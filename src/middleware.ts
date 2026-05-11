import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './utils/rateLimit';
import { AUTH_COOKIE_KEYS } from './lib/auth/session';
import { logAuthAudit } from './lib/auth/audit';
import { AUTH_TTL_SECONDS, getAuthCookieOptions } from './lib/auth/session';

const PRIVATE_PAGE_PREFIXES = [
  '/dashboard',
  '/metas',
  '/recomendacoes',
  '/performance',
  '/campaigns',
  '/ads',
  '/adsets',
  '/leads',
  '/settings',
];

const PROTECTED_API_PREFIXES = [
  '/api/admin',
  '/api/dashboard',
  '/api/alerts',
  '/api/goals',
  '/api/meta',
  '/api/performance',
  '/api/cache',
  '/api/debug-env',
  '/api/test-ads-structure',
  '/api/test-meta-leads-ads',
  '/api/optimization',
];

function isPrivatePage(pathname: string): boolean {
  return PRIVATE_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Parseia o header Cookie de forma tolerante a valores com "=" (JWT), aspas
 * e nomes duplicados (ex.: cookie vazio legado + cookie válido).
 */
function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(';')) {
    const segment = part.trim();
    if (!segment) continue;
    const eq = segment.indexOf('=');
    if (eq <= 0) continue;
    const name = segment.slice(0, eq).trim();
    let value = segment.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) continue;
    let decoded = value;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      decoded = value;
    }
    if (!decoded) continue;
    map.set(name, decoded);
  }
  return map;
}

function getAuthCookies(request: NextRequest): { accessToken?: string; refreshToken?: string } {
  const headerMap = parseCookieHeader(request.headers.get('cookie'));
  const accessFromHeader = headerMap.get(AUTH_COOKIE_KEYS.accessToken);
  const refreshFromHeader = headerMap.get(AUTH_COOKIE_KEYS.refreshToken);

  const accessTokenFromApi = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value?.trim() || undefined;
  const refreshTokenFromApi = request.cookies.get(AUTH_COOKIE_KEYS.refreshToken)?.value?.trim() || undefined;

  return {
    accessToken: accessTokenFromApi || accessFromHeader,
    refreshToken: refreshTokenFromApi || refreshFromHeader,
  };
}

type AccessValidationResult = {
  valid: boolean;
  userId?: string;
  email?: string;
  reason?: string;
};

type RefreshResult = {
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  userId?: string;
  email?: string;
  reason?: string;
};

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function validateAccessToken(accessToken: string): Promise<AccessValidationResult> {
  const client = createAuthClient();
  if (!client) {
    return { valid: false, reason: 'supabase_auth_unconfigured' };
  }
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user?.id) {
    return { valid: false, reason: error?.message || 'invalid_access_token' };
  }
  return {
    valid: true,
    userId: data.user.id,
    email: data.user.email,
  };
}

async function refreshFromToken(refreshToken: string): Promise<RefreshResult> {
  const client = createAuthClient();
  if (!client) {
    return { ok: false, reason: 'supabase_auth_unconfigured' };
  }
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session?.access_token || !data.session.refresh_token) {
    return { ok: false, reason: error?.message || 'refresh_failed' };
  }
  return {
    ok: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    userId: data.user?.id,
    email: data.user?.email,
  };
}

function applyRefreshedCookies(
  request: NextRequest,
  response: NextResponse,
  refreshed: RefreshResult
) {
  const cookieOptions = getAuthCookieOptions(request);
  response.cookies.set(AUTH_COOKIE_KEYS.accessToken, refreshed.accessToken || '', {
    ...cookieOptions,
    maxAge: Math.min(
      refreshed.expiresIn ?? AUTH_TTL_SECONDS.accessToken,
      AUTH_TTL_SECONDS.accessToken
    ),
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, refreshed.refreshToken || '', {
    ...cookieOptions,
    maxAge: AUTH_TTL_SECONDS.refreshToken,
  });
}

function normalizeSessionCookies(
  request: NextRequest,
  response: NextResponse,
  accessToken?: string,
  refreshToken?: string
) {
  const cookieOptions = getAuthCookieOptions(request);
  if (accessToken) {
    response.cookies.set(AUTH_COOKIE_KEYS.accessToken, accessToken, {
      ...cookieOptions,
      maxAge: AUTH_TTL_SECONDS.accessToken,
    });
  }
  if (refreshToken) {
    response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, refreshToken, {
      ...cookieOptions,
      maxAge: AUTH_TTL_SECONDS.refreshToken,
    });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPrivatePage(pathname)) {
    const { accessToken, refreshToken } = getAuthCookies(request);

    if (!accessToken && !refreshToken) {
      logAuthAudit({ event: 'page_access_denied', request, status: 302, reason: 'missing_session_cookies' });
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (accessToken) {
      const validation = await validateAccessToken(accessToken);
      if (validation.valid) {
        // Sessão válida: normaliza cookies no escopo raiz para evitar
        // inconsistências legadas de path e garantir envio nas rotas /api.
        const response = NextResponse.next();
        normalizeSessionCookies(request, response, accessToken, refreshToken);
        return response;
      } else if (refreshToken) {
        const refreshed = await refreshFromToken(refreshToken);
        if (refreshed.ok) {
          const response = NextResponse.next();
          applyRefreshedCookies(request, response, refreshed);
          logAuthAudit({
            event: 'session_refresh_success',
            request,
            userId: refreshed.userId,
            email: refreshed.email,
            status: 200,
            metadata: { source: 'middleware_private_page' },
          });
          return response;
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        logAuthAudit({
          event: 'page_access_denied',
          request,
          status: 302,
          reason: refreshed.reason || 'invalid_access_and_refresh_token',
        });
        return NextResponse.redirect(loginUrl);
      } else {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        logAuthAudit({
          event: 'page_access_denied',
          request,
          status: 302,
          reason: validation.reason || 'invalid_access_token',
        });
        return NextResponse.redirect(loginUrl);
      }
    } else if (refreshToken) {
      const refreshed = await refreshFromToken(refreshToken);
      if (refreshed.ok) {
        const response = NextResponse.next();
        applyRefreshedCookies(request, response, refreshed);
        logAuthAudit({
          event: 'session_refresh_success',
          request,
          userId: refreshed.userId,
          email: refreshed.email,
          status: 200,
          metadata: { source: 'middleware_missing_access_token' },
        });
        return response;
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      logAuthAudit({
        event: 'page_access_denied',
        request,
        status: 302,
        reason: refreshed.reason || 'invalid_refresh_token',
      });
      return NextResponse.redirect(loginUrl);
    }

    // Se chegou aqui, segue fluxo normal.
  }

  if (isProtectedApi(pathname)) {
    const { accessToken, refreshToken } = getAuthCookies(request);

    if (accessToken) {
      const validation = await validateAccessToken(accessToken);
      if (validation.valid) {
        // Sessão válida: permite chamada da API e normaliza cookies de sessão.
        const response = NextResponse.next();
        normalizeSessionCookies(request, response, accessToken, refreshToken);
        return response;
      } else if (refreshToken) {
        const refreshed = await refreshFromToken(refreshToken);
        if (refreshed.ok) {
          const response = NextResponse.next();
          applyRefreshedCookies(request, response, refreshed);
          logAuthAudit({
            event: 'session_refresh_success',
            request,
            userId: refreshed.userId,
            email: refreshed.email,
            status: 200,
            metadata: { source: 'middleware_protected_api' },
          });
          return response;
        }
        logAuthAudit({
          event: 'api_access_denied',
          request,
          status: 401,
          reason: refreshed.reason || 'invalid_access_and_refresh_token',
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        logAuthAudit({
          event: 'api_access_denied',
          request,
          status: 401,
          reason: validation.reason || 'invalid_access_token',
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (refreshToken) {
      const refreshed = await refreshFromToken(refreshToken);
      if (refreshed.ok) {
        const response = NextResponse.next();
        applyRefreshedCookies(request, response, refreshed);
        logAuthAudit({
          event: 'session_refresh_success',
          request,
          userId: refreshed.userId,
          email: refreshed.email,
          status: 200,
          metadata: { source: 'middleware_api_missing_access_token' },
        });
        return response;
      }
      logAuthAudit({
        event: 'api_access_denied',
        request,
        status: 401,
        reason: refreshed.reason || 'invalid_refresh_token',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logAuthAudit({
      event: 'api_access_denied',
      request,
      status: 401,
      reason: 'missing_session_cookies',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifica rate limit apenas para rotas específicas (não para IA)
  const { isLimited, resetTime } = checkRateLimit(request);
  if (isLimited) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
      { status: 429 }
    );
  }

  // Verifica autenticação para rotas protegidas (exceto status e trigger)
  if (request.nextUrl.pathname.startsWith('/api/sync') && 
      !request.nextUrl.pathname.startsWith('/api/sync/status') &&
      !request.nextUrl.pathname.startsWith('/api/sync/trigger')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.META_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/metas',
    '/performance/:path*',
    '/campaigns/:path*',
    '/ads/:path*',
    '/adsets/:path*',
    '/leads/:path*',
    '/settings/:path*',
    '/login',
    '/api/auth/:path*',
    '/api/sync/:path*',
    '/api/dashboard/:path*',
    '/api/alerts/:path*',
    '/api/goals/:path*',
    '/api/meta/:path*',
    '/api/performance/:path*',
    '/api/cache/:path*',
    '/api/debug-env/:path*',
    '/api/test-ads-structure/:path*',
    '/api/test-meta-leads-ads/:path*',
    '/api/optimization/:path*'
  ],
}; 