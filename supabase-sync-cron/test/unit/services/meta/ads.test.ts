import { MetaAdsService } from '../../../../src/services/meta/ads';
import { MetaAd, MetaAdsResponse, MetaAPIError } from '../../../../src/types/meta';
import { logger } from '../../../../src/utils/logger';

// Mock do logger
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MetaAdsService', () => {
  const config = {
    accessToken: 'test-token',
    accountId: '123456789',
    baseUrl: 'https://test.api.com/v1'
  };

  let service: MetaAdsService;

  beforeEach(() => {
    service = new MetaAdsService(config);
    jest.clearAllMocks();
  });

  describe('getActiveAds', () => {
    const mockAds: MetaAd[] = [
      {
        id: '1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        created_time: '2024-01-01T00:00:00Z',
        updated_time: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Ad 2',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        created_time: '2024-01-01T00:00:00Z',
        updated_time: '2024-01-01T00:00:00Z'
      }
    ];

    const mockResponse: MetaAdsResponse = {
      data: mockAds,
      paging: {
        cursors: {
          before: 'cursor1',
          after: 'cursor2'
        }
      }
    };

    it('deve retornar lista de anúncios ativos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getActiveAds();

      expect(result).toEqual(mockAds);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${config.baseUrl}/${config.accountId}/ads`)
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Buscando anúncios ativos',
          accountId: config.accountId
        })
      );
    });

    it('deve lidar com paginação', async () => {
      const firstPage: MetaAdsResponse = {
        data: [mockAds[0]],
        paging: {
          cursors: {
            before: 'cursor1',
            after: 'cursor2'
          },
          next: 'next-page-url'
        }
      };

      const secondPage: MetaAdsResponse = {
        data: [mockAds[1]],
        paging: {
          cursors: {
            before: 'cursor2',
            after: 'cursor3'
          }
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstPage)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondPage)
        });

      const result = await service.getActiveAds();

      expect(result).toEqual(mockAds);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('deve retry em caso de erro 500', async () => {
      const errorResponse = {
        error: {
          code: 500,
          message: 'Internal Server Error',
          type: 'OAuthException',
          fbtrace_id: 'trace123'
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(errorResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

      const result = await service.getActiveAds();

      expect(result).toEqual(mockAds);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Erro temporário na Meta API, tentando novamente',
          attempt: 1
        })
      );
    });

    it('deve lançar erro em caso de falha permanente', async () => {
      const errorResponse = {
        error: {
          code: 400,
          message: 'Invalid Request',
          type: 'OAuthException',
          fbtrace_id: 'trace123'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      await expect(service.getActiveAds()).rejects.toThrow(MetaAPIError);
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve incluir parâmetros corretos na requisição', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.getActiveAds();

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get('access_token')).toBe(config.accessToken);
      expect(url.searchParams.get('fields')).toBe('id,name,status,effective_status,created_time,updated_time');
      expect(url.searchParams.get('effective_status')).toBe('ACTIVE');
      expect(url.searchParams.get('limit')).toBe('100');
    });

    it('deve lidar com erro de conexão do provedor do modelo', async () => {
      const modelProviderError = {
        error: {
          message: "We're having trouble connecting to the model provider. This might be temporary - please try again in a moment.",
          type: 'OAuthException',
          code: 500,
          fbtrace_id: 'trace123'
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(modelProviderError)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

      const result = await service.getActiveAds();

      expect(result).toEqual(mockAds);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Erro temporário do provedor do modelo',
          attempt: 1,
          error: expect.objectContaining({
            code: 'MODEL_PROVIDER_CONNECTION_ERROR',
            message: expect.stringContaining('trouble connecting to the model provider')
          }),
          retryAfter: 5000
        })
      );
    });

    it('deve lançar erro após todas as tentativas falharem com erro do provedor do modelo', async () => {
      const modelProviderError = {
        error: {
          message: "We're having trouble connecting to the model provider. This might be temporary - please try again in a moment.",
          type: 'OAuthException',
          code: 500,
          fbtrace_id: 'trace123'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(modelProviderError)
      });

      const service = new MetaAdsService({
        ...config,
        retryAttempts: 2
      });

      await expect(service.getActiveAds()).rejects.toThrow('Erro de conexão com o provedor do modelo');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Erro ao buscar anúncios ativos',
          error: expect.objectContaining({
            code: 'MODEL_PROVIDER_ERROR',
            providerError: expect.objectContaining({
              code: 'MODEL_PROVIDER_CONNECTION_ERROR'
            })
          })
        })
      );
    });
  });
}); 