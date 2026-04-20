import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_KEYS, AUTH_TTL_SECONDS, getAuthCookieOptions } from '../../../../src/lib/auth/session';
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

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value;
    const refreshToken = request.cookies.get(AUTH_COOKIE_KEYS.refreshToken)?.value;

    if (!accessToken && !refreshToken) {
      logAuthAudit({ event: 'session_check_failure', request, status: 200, reason: 'missing_session_cookies' });
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const supabase = createAuthClient();
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (!error && data.user) {
        const response = NextResponse.json({
          authenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        });
        response.headers.set('Cache-Control', 'no-store');
        logAuthAudit({
          event: 'session_check_success',
          request,
          userId: data.user.id,
          email: data.user.email,
          status: 200,
          metadata: { source: 'access_token' },
        });
        return response;
      }
    }

    if (!refreshToken) {
      logAuthAudit({ event: 'session_check_failure', request, status: 200, reason: 'missing_refresh_token' });
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError || !refreshed.session) {
      logAuthAudit({
        event: 'session_refresh_failure',
        request,
        status: 200,
        reason: refreshError?.message || 'refresh_failed_during_session_check',
      });
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      response.headers.set('Cache-Control', 'no-store');
      const cookieOptions = getAuthCookieOptions(request);
      response.cookies.set(AUTH_COOKIE_KEYS.accessToken, '', { ...cookieOptions, maxAge: 0 });
      response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, '', { ...cookieOptions, maxAge: 0 });
      return response;
    }

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: refreshed.user?.id,
        email: refreshed.user?.email,
      },
    });
    response.headers.set('Cache-Control', 'no-store');
    const cookieOptions = getAuthCookieOptions(request);

    response.cookies.set(AUTH_COOKIE_KEYS.accessToken, refreshed.session.access_token, {
      ...cookieOptions,
      maxAge: Math.min(
        refreshed.session.expires_in ?? AUTH_TTL_SECONDS.accessToken,
        AUTH_TTL_SECONDS.accessToken
      ),
    });
    response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, refreshed.session.refresh_token, {
      ...cookieOptions,
      maxAge: AUTH_TTL_SECONDS.refreshToken,
    });

    logAuthAudit({
      event: 'session_refresh_success',
      request,
      userId: refreshed.user?.id,
      email: refreshed.user?.email,
      status: 200,
      metadata: { source: 'session_check' },
    });

    return response;
  } catch (error) {
    logAuthAudit({
      event: 'session_check_failure',
      request,
      status: 500,
      reason: error instanceof Error ? error.message : 'unexpected_session_error',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro inesperado de sessão.' },
      { status: 500 }
    );
  }
}
