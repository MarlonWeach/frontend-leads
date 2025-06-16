// Configuração do ambiente Next.js para testes
import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { mockLogger } from '../../../setup';

// Mock do middleware
jest.mock('@/middleware', () => ({
  withAuth: jest.fn((handler) => handler),
  withRateLimit: jest.fn((handler) => handler)
}));

import { createMocks } from 'node-mocks-http';
import { syncAdsStatus } from '@/jobs/sync-ads';
import { DEFAULT_SYNC_OPTIONS } from '@/types/sync';
import { resetRateLimit, getRequestCount, checkRateLimit } from '@/utils/rateLimit';

// Mock do syncAdsStatus
jest.mock('@/jobs/sync-ads', () => ({
  syncAdsStatus: jest.fn()
}));

// Mock do rateLimit
jest.mock('@/utils/rateLimit', () => ({
  resetRateLimit: jest.fn(),
  getRequestCount: jest.fn(),
  checkRateLimit: jest.fn()
}));

// Mock global de Request para Next.js
// eslint-disable-next-line no-undef
if (typeof global.Request === 'undefined') {
  global.Request = class {};
}

// Mock da função POST
const mockPOST = async (request: NextRequest) => {
  try {
    // Verificar rate limit
    const isAllowed = await checkRateLimit(request);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit excedido' },
        { status: 429 }
      );
    }

    // Obter opções de sincronização do corpo da requisição
    let options = DEFAULT_SYNC_OPTIONS;
    try {
      const body = await request.json();
      if (body) {
        options = {
          force: body.force ?? DEFAULT_SYNC_OPTIONS.force,
          dryRun: body.dryRun ?? DEFAULT_SYNC_OPTIONS.dryRun
        };
      }
    } catch (error) {
      // Se não houver corpo ou for inválido, usa as opções padrão
    }

    // Executar sincronização
    const result = await syncAdsStatus(options);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    mockLogger.error('Erro ao sincronizar status dos anúncios:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
};

describe('POST /api/sync/ads/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve sincronizar status dos anúncios com sucesso', async () => {
    const mockResult = {
      status: {
        success: true,
        totalAds: 10,
        activeAds: 5
      },
      ads: []
    };

    (syncAdsStatus as jest.Mock).mockResolvedValue(mockResult);
    (checkRateLimit as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sync/ads/status', {
      method: 'POST',
      body: JSON.stringify({ force: true })
    });

    const response = await mockPOST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: mockResult
    });
  });

  it('deve retornar erro 429 quando rate limit é excedido', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/sync/ads/status', {
      method: 'POST'
    });

    const response = await mockPOST(request);
    const data = await response.json();
    
    expect(response.status).toBe(429);
    expect(data).toEqual({
      success: false,
      error: 'Rate limit excedido'
    });
  });

  it('deve retornar erro 500 quando a sincronização falha', async () => {
    const mockError = new Error('Erro de sincronização');
    (syncAdsStatus as jest.Mock).mockRejectedValue(mockError);
    (checkRateLimit as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sync/ads/status', {
      method: 'POST'
    });

    const response = await mockPOST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Erro de sincronização'
    });
  });

  it('deve usar opções padrão quando o corpo da requisição é inválido', async () => {
    const mockResult = {
      status: {
        success: true,
        totalAds: 5,
        activeAds: 3
      },
      ads: []
    };

    (syncAdsStatus as jest.Mock).mockResolvedValue(mockResult);
    (checkRateLimit as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sync/ads/status', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await mockPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: mockResult
    });
      expect(syncAdsStatus).toHaveBeenCalledWith(DEFAULT_SYNC_OPTIONS);
  });
}); 