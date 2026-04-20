import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_KEYS, getAuthCookieOptions } from '../../../../src/lib/auth/session';
import { logAuthAudit } from '../../../../src/lib/auth/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store');
  const cookieOptions = getAuthCookieOptions(request);

  response.cookies.set(AUTH_COOKIE_KEYS.accessToken, '', {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  logAuthAudit({ event: 'logout', request, status: 200 });

  return response;
}
