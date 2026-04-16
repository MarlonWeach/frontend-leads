import type { NextRequest } from 'next/server';

export type AuthAuditEvent =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh_success'
  | 'session_refresh_failure'
  | 'session_check_success'
  | 'session_check_failure'
  | 'page_access_denied'
  | 'api_access_denied'
  | 'csrf_blocked'
  | 'admin_invite_success'
  | 'admin_invite_failure'
  | 'admin_invite_denied';

interface AuthAuditPayload {
  event: AuthAuditEvent;
  request?: NextRequest;
  userId?: string | null;
  email?: string | null;
  status?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function logAuthAudit(payload: AuthAuditPayload): void {
  const request = payload.request;

  const entry = {
    category: 'auth_audit',
    event: payload.event,
    userId: payload.userId ?? null,
    email: payload.email ?? null,
    status: payload.status ?? null,
    reason: payload.reason ?? null,
    pathname: request?.nextUrl.pathname ?? null,
    method: request?.method ?? null,
    ip:
      request?.headers.get('x-forwarded-for') ||
      request?.headers.get('x-real-ip') ||
      null,
    userAgent: request?.headers.get('user-agent') ?? null,
    metadata: payload.metadata ?? null,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(entry);
  if (payload.status && payload.status >= 400) {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}
