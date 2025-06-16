import { mockLogger } from '../../../setup';
import { MetaAdsService } from '@/services/meta/ads';
import { MetaAPIError } from '../../../../src/types/meta';

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: mockLogger,
  logger: mockLogger
}));

describe('MetaAdsService - Integration', () => {
  const config = {
    accessToken: 'test-token',
    accountId: '123456789',
    baseUrl: 'https://test.api.com/v1'
  };

  let service: MetaAdsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MetaAdsService(config);
  });

  it('deve buscar anúncios ativos corretamente', async () => {
    const mockResponse = {
      data: [
        {
          id: 'ad1',
          name: 'Ad 1',
          status: 'ACTIVE',
          effective_status: 'ACTIVE'
        }
      ],
      paging: {
        cursors: {
          before: 'before1',
          after: 'after1'
        }
      }
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await service.getActiveAds();

    expect(result).toEqual(mockResponse.data);
    expect(global.fetch).toHaveBeenCalledWith(
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
    const mockError = {
      error: {
        message: 'API Error',
        type: 'OAuthException',
        code: 190,
        error_subcode: 460,
        fbtrace_id: 'trace123'
      }
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockError)
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
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network Error'));

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
    global.fetch = jest.fn().mockResolvedValueOnce({
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