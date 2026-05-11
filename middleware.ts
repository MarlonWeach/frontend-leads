import type { NextRequest } from 'next/server';
import { middleware as runMiddleware } from './src/middleware';

export function middleware(request: NextRequest) {
  return runMiddleware(request);
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
    '/api/alerts',
    '/api/alerts/:path*',
    '/api/goals',
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
