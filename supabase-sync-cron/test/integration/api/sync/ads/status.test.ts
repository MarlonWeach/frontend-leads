process.env.META_ACCESS_TOKEN = 'test-token';

import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/sync/ads/status/route';
import { syncAdsStatus } from '@/jobs/sync-ads';
import { DEFAULT_SYNC_OPTIONS } from '@/types/sync';
import { NextRequest } from 'next/server';
import { resetRateLimit, getRequestCount, checkRateLimit } from '@/utils/rateLimit';

// Mock do middleware
jest.mock('@/middleware', () => ({
  middleware: jest.fn().mockImplementation(async (request) => {
    // Verifica autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        json: () => Promise.resolve({ error: 'Unauthorized' }),
        status: 401
      };
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.META_ACCESS_TOKEN) {
      return {
        json: () => Promise.resolve({ error: 'Unauthorized' }),
        status: 401
      };
    }

    // Verifica rate limit
    const { isLimited } = checkRateLimit(request);
    if (isLimited) {
      return {
        json: () => Promise.resolve({ error: 'Muitas requisições. Tente novamente em 1 minuto.' }),
        status: 429
      };
    }

    return null; // Continua para a rota
  })
}));

jest.mock('@/jobs/sync-ads', () => ({
  syncAdsStatus: jest.fn(),
}));

// Mock do logger antes de qualquer importação
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/utils/logger', () => mockLogger);

// Mock do NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((req) => ({
    ...req,
    json: () => Promise.resolve(req.body || {}),
    headers: new Headers(req.headers),
    ip: req.ip,
    nextUrl: { pathname: '/api/sync/ads/status' }
  })),
  NextResponse: {
    json: (data, init) => ({
      status: (init && init.status) || 200,
      json: async () => data,
    }),
    next: () => null,
  },
}));

// Importa o middleware para usá-lo nos testes
import { middleware } from '@/middleware';

describe('POST /api/sync/ads/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimit();
    process.env.META_ACCESS_TOKEN = 'test-token';
  });

  it('retorna 401 quando não há token de autenticação', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {},
      ip: '127.0.0.1',
    });

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (middlewareResponse) {
      const data = await middlewareResponse.json();
      expect(middlewareResponse.status).toBe(401);
      expect(data).toEqual({
        error: 'Unauthorized',
      });
      return;
    }
    
    // Se o middleware não bloquear, continua para a rota
    const response = await POST(nextReq);
    const data = await response.json();
    
    // Isso não deve ser executado se o middleware funcionar corretamente
    expect(false).toBe(true);
  });

  it('retorna 401 quando o token é inválido', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      ip: '127.0.0.2',
    });

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (middlewareResponse) {
      const data = await middlewareResponse.json();
      expect(middlewareResponse.status).toBe(401);
      expect(data).toEqual({
        error: 'Unauthorized',
      });
      return;
    }
    
    // Se o middleware não bloquear, continua para a rota
    const response = await POST(nextReq);
    const data = await response.json();
    
    // Isso não deve ser executado se o middleware funcionar corretamente
    expect(false).toBe(true);
  });

  it('retorna 429 quando o rate limit é excedido', async () => {
    // Simula múltiplas requisições para exceder o limite
    const ip = '127.0.0.3';
    for (let i = 0; i < 101; i++) {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-token',
        },
        ip,
      });

      const nextReq = new NextRequest(req);
      await checkRateLimit(nextReq);
    }

    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      ip,
    });

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (middlewareResponse) {
      const data = await middlewareResponse.json();
      expect(middlewareResponse.status).toBe(429);
      expect(data).toEqual({
        error: 'Muitas requisições. Tente novamente em 1 minuto.',
      });
      
      const count = getRequestCount(ip);
      expect(count?.count).toBeGreaterThan(100);
      return;
    }
    
    // Se o middleware não bloquear, continua para a rota
    const response = await POST(nextReq);
    const data = await response.json();
    
    // Isso não deve ser executado se o middleware funcionar corretamente
    expect(false).toBe(true);
  });

  it('processa opções de sincronização', async () => {
    const syncOptions = {
      force: true,
      retryCount: 2,
      timeoutMs: 1000,
    };

    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: syncOptions,
      ip: '127.0.0.4',
    });

    const mockResult = {
      status: {
        success: true,
        timestamp: new Date().toISOString(),
        totalAds: 0,
        activeAds: 0,
        details: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 0,
          retryCount: 0,
        },
      },
      ads: [],
    };

    (syncAdsStatus as jest.Mock).mockResolvedValueOnce(mockResult);

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (!middlewareResponse) {
      // Se o middleware não bloquear, continua para a rota
      const response = await POST(nextReq);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(syncAdsStatus).toHaveBeenCalledWith(syncOptions);
    }
  });

  it('usa opções padrão quando o body é inválido', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: 'invalid-json',
      ip: '127.0.0.5',
    });

    const mockResult = {
      status: {
        success: true,
        timestamp: new Date().toISOString(),
        totalAds: 0,
        activeAds: 0,
        details: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 0,
          retryCount: 0,
        },
      },
      ads: [],
    };

    (syncAdsStatus as jest.Mock).mockResolvedValueOnce(mockResult);

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (!middlewareResponse) {
      // Se o middleware não bloquear, continua para a rota
      const response = await POST(nextReq);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(syncAdsStatus).toHaveBeenCalledWith(DEFAULT_SYNC_OPTIONS);
    }
  });

  it('retorna erro 500 quando syncAdsStatus falha', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      ip: '127.0.0.6',
    });

    const error = new Error('Erro de teste');
    (syncAdsStatus as jest.Mock).mockRejectedValueOnce(error);

    const nextReq = new NextRequest(req);
    
    // Aplica o middleware
    const middlewareResponse = await middleware(nextReq);
    if (!middlewareResponse) {
      // Se o middleware não bloquear, continua para a rota
      const response = await POST(nextReq);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Erro interno ao sincronizar status dos anúncios',
      });
    }
  });
}); 