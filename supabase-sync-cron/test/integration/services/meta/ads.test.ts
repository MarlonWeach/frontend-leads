import { MetaAdsService } from '../../../../src/services/meta/ads';
import { MetaAPIError } from '../../../../src/types/meta';
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

describe('MetaAdsService Integration', () => {
  const config = {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    accountId: process.env.META_ACCOUNT_ID || ''
  };

  let service: MetaAdsService;

  beforeAll(() => {
    if (!config.accessToken || !config.accountId) {
      throw new Error('META_ACCESS_TOKEN e META_ACCOUNT_ID são necessários para os testes de integração');
    }
  });

  beforeEach(() => {
    service = new MetaAdsService(config);
    jest.clearAllMocks();
  });

  describe('getActiveAds', () => {
    it('deve retornar lista de anúncios ativos da Meta API', async () => {
      const ads = await service.getActiveAds();

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);

      // Verifica estrutura dos anúncios
      ads.forEach(ad => {
        expect(ad).toHaveProperty('id');
        expect(ad).toHaveProperty('name');
        expect(ad).toHaveProperty('status');
        expect(ad).toHaveProperty('effective_status');
        expect(ad).toHaveProperty('created_time');
        expect(ad).toHaveProperty('updated_time');

        // Verifica se todos os anúncios estão ativos
        expect(ad.effective_status).toBe('ACTIVE');
      });

      // Verifica logs
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Buscando anúncios ativos',
          accountId: config.accountId
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Busca de anúncios ativos concluída',
          totalAds: ads.length
        })
      );
    });

    it('deve lidar com erros de autenticação', async () => {
      const invalidService = new MetaAdsService({
        ...config,
        accessToken: 'invalid-token'
      });

      await expect(invalidService.getActiveAds()).rejects.toThrow(MetaAPIError);
      expect(logger.error).toHaveBeenCalled();
    });

    it('deve lidar com account ID inválido', async () => {
      const invalidService = new MetaAdsService({
        ...config,
        accountId: 'invalid-account'
      });

      await expect(invalidService.getActiveAds()).rejects.toThrow(MetaAPIError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 