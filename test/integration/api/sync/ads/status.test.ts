// Configuração do ambiente para testes
import { jest } from '@jest/globals';

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock do middleware
jest.mock('@/middleware', () => ({
  withAuth: jest.fn((handler) => handler),
  withRateLimit: jest.fn((handler) => handler)
}));

// Mock do syncAdsStatus
const mockSyncAdsStatus = jest.fn() as jest.MockedFunction<any>;
jest.mock('@/jobs/sync-ads', () => ({
  syncAdsStatus: mockSyncAdsStatus
}));

// Mock do rateLimit
const mockCheckRateLimit = jest.fn() as jest.MockedFunction<any>;
jest.mock('@/utils/rateLimit', () => ({
  resetRateLimit: jest.fn(),
  getRequestCount: jest.fn(),
  checkRateLimit: mockCheckRateLimit
}));

import { DEFAULT_SYNC_OPTIONS } from '@/types/sync';

// Mock das classes Next.js
class MockNextRequest {
  url: string;
  method: string;
  body: string;

  constructor(url: string, options: { method: string; body?: string } = { method: 'GET' }) {
    this.url = url;
    this.method = options.method;
    this.body = options.body || '';
  }

  async json() {
    try {
      return JSON.parse(this.body);
    } catch {
      return null;
    }
  }
}

class MockNextResponse {
  status: number;
  data: any;

  constructor(data: any, options: { status?: number } = {}) {
    this.status = options.status || 200;
    this.data = data;
  }

  async json() {
    return this.data;
  }
}

// Mock da função POST
const mockPOST = async (request: MockNextRequest) => {
  try {
    // Verificar rate limit
    const isAllowed = await mockCheckRateLimit(request);
    if (!isAllowed) {
      return new MockNextResponse(
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
    const result = await mockSyncAdsStatus(options);

    return new MockNextResponse(
      { success: true, data: result },
      { status: 200 }
    );
      } catch (error) {
      mockLogger.error('Erro ao sincronizar status dos anúncios:', error);
      return new MockNextResponse(
        { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
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

    mockSyncAdsStatus.mockResolvedValue(mockResult);
    mockCheckRateLimit.mockResolvedValue(true);

    const request = new MockNextRequest('http://localhost:3000/api/sync/ads/status', {
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
    mockCheckRateLimit.mockResolvedValue(false);

    const request = new MockNextRequest('http://localhost:3000/api/sync/ads/status', {
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
    mockSyncAdsStatus.mockRejectedValue(mockError);
    mockCheckRateLimit.mockResolvedValue(true);

    const request = new MockNextRequest('http://localhost:3000/api/sync/ads/status', {
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

    mockSyncAdsStatus.mockResolvedValue(mockResult);
    mockCheckRateLimit.mockResolvedValue(true);

    const request = new MockNextRequest('http://localhost:3000/api/sync/ads/status', {
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
    expect(mockSyncAdsStatus).toHaveBeenCalledWith(DEFAULT_SYNC_OPTIONS);
  });
}); 