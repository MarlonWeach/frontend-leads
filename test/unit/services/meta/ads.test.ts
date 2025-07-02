import { mockLogger } from '../../../setup';
import { MetaAdsService } from '@/services/meta/ads';
import { MetaAd, MetaAdsResponse, MetaAPIError } from '@/types/meta';

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: mockLogger,
  logger: mockLogger
}));

// Mock do fetch
let mockFetch: jest.Mock;

describe('MetaAdsService', () => {
  const config = {
    accessToken: 'test-token',
    accountId: '123456789',
    baseUrl: 'https://test.api.com/v1'
  };

  let service: MetaAdsService;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    service = new MetaAdsService(config);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve buscar anúncios ativos corretamente', async () => {
    const mockResponse: MetaAdsResponse = {
      data: [
      {
          id: 'ad1',
        name: 'Ad 1',
        status: 'ACTIVE',
          effective_status: 'ACTIVE',
          created_time: '2025-01-20T00:00:00Z',
          updated_time: '2025-01-27T00:00:00Z'
      }
      ],
      paging: {
        cursors: {
          before: 'before1',
          after: 'after1'
        }
      }
    };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getActiveAds();

    expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ads'),
        expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${config.accessToken}`
        })
      })
    );
    expect(mockLogger.info).toHaveBeenCalled();
    });

  it('deve lidar com erros da API corretamente', async () => {
    const mockErrorResponse = {
      error: {
        message: 'API Error',
        type: 'OAuthException',
        code: 190,
        error_subcode: 460,
        fbtrace_id: 'trace123'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockErrorResponse)
    });

    await expect(service.getActiveAds()).rejects.toThrow('API Error');
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'Erro ao buscar anúncios ativos',
      error: expect.objectContaining({
        name: 'MetaAPIError',
        message: 'API Error',
        code: 190,
        type: 'OAuthException',
        fbtrace_id: 'trace123'
      })
    });
  });

  it('deve lidar com erros de rede corretamente', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(service.getActiveAds()).rejects.toThrow('Network Error');
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'Erro ao buscar anúncios ativos',
      error: expect.objectContaining({
        name: 'Error',
        message: 'Network Error'
      })
    });
  });

  it('deve lidar com respostas inválidas corretamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invalid: 'response' })
    });

    await expect(service.getActiveAds()).rejects.toThrow('response.data is not iterable');
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'Erro ao buscar anúncios ativos',
      error: expect.any(Object)
    });
  });
}); 