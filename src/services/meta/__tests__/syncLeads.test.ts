import { MetaLeadsSyncService } from '../syncLeads';
import { MetaAdsService } from '../ads';
import { logger } from '../../../utils/logger';
import { MetaAd } from '../../../types/meta';

// Mock das dependências
jest.mock('../ads');
jest.mock('../../../utils/logger');

describe('MetaLeadsSyncService', () => {
  const mockConfig = {
    accessToken: 'test-token',
    accountId: '123456789'
  };

  let service: MetaLeadsSyncService;
  let mockMetaAdsService: jest.Mocked<MetaAdsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMetaAdsService = {
      getActiveAds: jest.fn()
    } as any;
    (MetaAdsService as jest.Mock).mockImplementation(() => mockMetaAdsService);
    service = new MetaLeadsSyncService(mockConfig);
  });

  describe('fetchLeadsWithRetry', () => {
    it('deve filtrar insights apenas para anúncios ativos', async () => {
      // Mock dos anúncios ativos
      const mockActiveAds: MetaAd[] = [
        { id: 'ad_1', name: 'Anúncio Ativo 1', effective_status: 'ACTIVE', status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-01' },
        { id: 'ad_2', name: 'Anúncio Ativo 2', effective_status: 'ACTIVE', status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-01' }
      ];
      mockMetaAdsService.getActiveAds.mockResolvedValue(mockActiveAds);

      // Mock da resposta da Meta API
      const mockInsightsResponse = {
        data: [
          {
            ad_id: 'ad_1',
            date_start: '2024-01-01',
            spend: '100.50',
            impressions: '1000',
            clicks: '50',
            results: [{
              indicator: 'actions:onsite_conversion.lead_grouped',
              values: [{ value: '5' }]
            }]
          },
          {
            ad_id: 'ad_2',
            date_start: '2024-01-01',
            spend: '75.25',
            impressions: '750',
            clicks: '35',
            results: [{
              indicator: 'actions:onsite_conversion.lead_grouped',
              values: [{ value: '3' }]
            }]
          }
        ]
      };

      // Mock do fetch global
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockInsightsResponse)
      });

      // Executar o método
      const result = await (service as any).fetchLeadsWithRetry('2024-01-01', '2024-01-31');

      // Verificar se getActiveAds foi chamado
      expect(mockMetaAdsService.getActiveAds).toHaveBeenCalled();

      // Verificar se a URL da API inclui os IDs dos anúncios ativos
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ad_ids=' + encodeURIComponent(JSON.stringify(['ad_1', 'ad_2'])))
      );

      // Verificar se o resultado contém apenas os insights dos anúncios ativos
      expect(result).toHaveLength(2);
      expect(result[0].ad_id).toBe('ad_1');
      expect(result[1].ad_id).toBe('ad_2');

      // Verificar logs
      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Fazendo requisição para Meta API',
          activeAdCount: 2
        })
      );
    });

    it('deve retornar array vazio quando não há anúncios ativos', async () => {
      // Mock de nenhum anúncio ativo
      mockMetaAdsService.getActiveAds.mockResolvedValue([]);

      // Executar o método
      const result = await (service as any).fetchLeadsWithRetry('2024-01-01', '2024-01-31');

      // Verificar se getActiveAds foi chamado
      expect(mockMetaAdsService.getActiveAds).toHaveBeenCalled();

      // Verificar se fetch não foi chamado
      expect(global.fetch).not.toHaveBeenCalled();

      // Verificar se retornou array vazio
      expect(result).toEqual([]);

      // Verificar logs
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Nenhum anúncio ativo encontrado para o período'
        })
      );
    });
  });
}); 