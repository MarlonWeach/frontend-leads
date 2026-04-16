import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_KEYS } from '../../../../../src/lib/auth/session';
import { supabaseServer } from '../../../../../src/lib/supabaseServer';
import { logAuthAudit } from '../../../../../src/lib/auth/audit';

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

function getAdminAllowlist(): Set<string> {
  const raw = process.env.AUTH_ADMIN_EMAILS || '';
  const values = raw
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
}

function isAllowedRole(role: string): boolean {
  return role === 'admin' || role === 'analyst' || role === 'viewer';
}

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get('origin');
    const expectedOrigin = new URL(request.url).origin;
    if (requestOrigin && requestOrigin !== expectedOrigin) {
      logAuthAudit({ event: 'csrf_blocked', request, status: 403, reason: 'origin_mismatch' });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value;
    if (!accessToken) {
      logAuthAudit({ event: 'admin_invite_denied', request, status: 401, reason: 'missing_access_token' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createAuthClient();
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData.user) {
      logAuthAudit({
        event: 'admin_invite_denied',
        request,
        status: 401,
        reason: authError?.message || 'invalid_session',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requesterEmail = String(authData.user.email || '').toLowerCase();
    const adminAllowlist = getAdminAllowlist();
    if (!requesterEmail || !adminAllowlist.has(requesterEmail)) {
      logAuthAudit({
        event: 'admin_invite_denied',
        request,
        status: 403,
        userId: authData.user.id,
        email: requesterEmail,
        reason: 'requester_not_admin',
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const targetEmail = String(body?.email || '').trim().toLowerCase();
    const targetRole = String(body?.role || 'viewer').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }
    if (!isAllowedRole(targetRole)) {
      return NextResponse.json({ error: 'Role inválida.' }, { status: 400 });
    }

    const redirectTo = process.env.AUTH_INVITE_REDIRECT_TO || `${expectedOrigin}/login`;
    const { data, error } = await supabaseServer.auth.admin.inviteUserByEmail(targetEmail, {
      data: { role: targetRole },
      redirectTo,
    });

    if (error) {
      logAuthAudit({
        event: 'admin_invite_failure',
        request,
        status: 500,
        userId: authData.user.id,
        email: requesterEmail,
        reason: error.message,
        metadata: { targetEmail, targetRole },
      });
      return NextResponse.json({ error: 'Falha ao convidar usuário.' }, { status: 500 });
    }

    logAuthAudit({
      event: 'admin_invite_success',
      request,
      status: 200,
      userId: authData.user.id,
      email: requesterEmail,
      metadata: { targetEmail, targetRole, invitedUserId: data.user?.id || null },
    });

    return NextResponse.json({
      success: true,
      invitedUser: {
        id: data.user?.id || null,
        email: targetEmail,
        role: targetRole,
      },
    });
  } catch (error) {
    logAuthAudit({
      event: 'admin_invite_failure',
      request,
      status: 500,
      reason: error instanceof Error ? error.message : 'unexpected_admin_invite_error',
    });
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
