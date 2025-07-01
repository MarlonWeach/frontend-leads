import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './utils/rateLimit';

export async function middleware(request: NextRequest) {
  // Verifica rate limit
  const { isLimited, resetTime } = checkRateLimit(request);
  if (isLimited) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
      { status: 429 }
    );
  }

  // Verifica autenticação para rotas protegidas (exceto status)
  if (request.nextUrl.pathname.startsWith('/api/sync') && 
      !request.nextUrl.pathname.startsWith('/api/sync/status')) {
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
  matcher: '/api/:path*',
}; 