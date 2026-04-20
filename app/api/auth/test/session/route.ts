import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_KEYS,
  AUTH_TTL_SECONDS,
  getAuthCookieOptions,
} from '../../../../../src/lib/auth/session';

export const dynamic = 'force-dynamic';

function isE2EAuthEnabled(): boolean {
  // Em desenvolvimento local, habilitamos por padrão para estabilidade dos E2Es.
  // Em ambiente com NODE_ENV=production (ex.: CI com npm start), exige flag explícita.
  return process.env.PLAYWRIGHT_AUTH_E2E === '1' || process.env.NODE_ENV !== 'production';
}

export async function POST(request: Request) {
  if (!isE2EAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store');
  const cookieOptions = getAuthCookieOptions({
    headers: request.headers,
    nextUrl: { protocol: new URL(request.url).protocol },
  });

  response.cookies.set(AUTH_COOKIE_KEYS.accessToken, 'e2e_access_token', {
    ...cookieOptions,
    maxAge: AUTH_TTL_SECONDS.accessToken,
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, 'e2e_refresh_token', {
    ...cookieOptions,
    maxAge: AUTH_TTL_SECONDS.refreshToken,
  });

  return response;
}

export async function DELETE(request: Request) {
  if (!isE2EAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store');
  const cookieOptions = getAuthCookieOptions({
    headers: request.headers,
    nextUrl: { protocol: new URL(request.url).protocol },
  });

  response.cookies.set(AUTH_COOKIE_KEYS.accessToken, '', {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
