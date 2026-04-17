import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './utils/rateLimit';
import { AUTH_COOKIE_KEYS } from './lib/auth/session';
import { logAuthAudit } from './lib/auth/audit';

const PRIVATE_PAGE_PREFIXES = [
  '/dashboard',
  '/metas',
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
  '/api/meta',
  '/api/performance',
  '/api/cache',
  '/api/debug-env',
  '/api/test-ads-structure',
  '/api/test-meta-leads-ads',
];

function isPrivatePage(pathname: string): boolean {
  return PRIVATE_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPrivatePage(pathname)) {
    const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value;

    if (!accessToken) {
      logAuthAudit({ event: 'page_access_denied', request, status: 302, reason: 'missing_access_token' });
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Não redirecionar /login apenas pela presença de cookie.
  // A validação real de sessão acontece em /api/auth/session no client.

  if (isProtectedApi(pathname)) {
    const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value;
    if (!accessToken) {
      logAuthAudit({ event: 'api_access_denied', request, status: 401, reason: 'missing_access_token' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    '/api/meta/:path*',
    '/api/performance/:path*',
    '/api/cache/:path*',
    '/api/debug-env/:path*',
    '/api/test-ads-structure/:path*',
    '/api/test-meta-leads-ads/:path*'
  ],
}; 