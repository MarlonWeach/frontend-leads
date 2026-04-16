import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_KEYS, AUTH_COOKIE_OPTIONS, AUTH_TTL_SECONDS } from '../../../../src/lib/auth/session';
import { logAuthAudit } from '../../../../src/lib/auth/audit';

export const dynamic = 'force-dynamic';

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase auth não configurado (URL/anon key ausentes).');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get('origin');
    const expectedOrigin = new URL(request.url).origin;
    if (requestOrigin && requestOrigin !== expectedOrigin) {
      logAuthAudit({ event: 'csrf_blocked', request, status: 403, reason: 'origin_mismatch' });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site') {
      logAuthAudit({ event: 'csrf_blocked', request, status: 403, reason: 'cross_site_request' });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      logAuthAudit({ event: 'login_failure', request, email, status: 400, reason: 'missing_credentials' });
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const supabase = createAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      logAuthAudit({ event: 'login_failure', request, email, status: 401, reason: error?.message || 'invalid_credentials' });
      return NextResponse.json(
        { error: 'Credenciais inválidas ou usuário sem acesso.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
    response.headers.set('Cache-Control', 'no-store');

    response.cookies.set(AUTH_COOKIE_KEYS.accessToken, data.session.access_token, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: Math.min(data.session.expires_in ?? AUTH_TTL_SECONDS.accessToken, AUTH_TTL_SECONDS.accessToken),
    });
    response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, data.session.refresh_token, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: AUTH_TTL_SECONDS.refreshToken,
    });

    logAuthAudit({
      event: 'login_success',
      request,
      userId: data.user?.id,
      email: data.user?.email,
      status: 200,
    });

    return response;
  } catch (error) {
    logAuthAudit({
      event: 'login_failure',
      request,
      status: 500,
      reason: error instanceof Error ? error.message : 'unexpected_login_error',
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro inesperado no login.',
      },
      { status: 500 }
    );
  }
}
