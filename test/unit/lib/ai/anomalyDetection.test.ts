import { 
  detectAnomalies, 
  getDetectionConfig, 
  AnomalyType, 
  AnomalySeverity 
} from '../../../../src/lib/ai/anomalyDetection';

// Mock do OpenAI
jest.mock('../../../../src/lib/ai/config', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}));

describe('AnomalyDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDetectionConfig', () => {
    it('deve retornar configuração padrão', () => {
      const config = getDetectionConfig();
      expect(config.sensitivity).toBe('medium');
      expect(config.deviationThreshold).toBe(2.5);
      expect(config.conversionRateThreshold).toBe(0.15);
    });

    it('deve retornar configuração para sensibilidade baixa', () => {
      const config = getDetectionConfig('low');
      expect(config.sensitivity).toBe('low');
      expect(config.deviationThreshold).toBe(3.0);
    });

    it('deve retornar configuração para sensibilidade alta', () => {
      const config = getDetectionConfig('high');
      expect(config.sensitivity).toBe('high');
      expect(config.deviationThreshold).toBe(2.0);
    });
  });

  describe('detectAnomalies', () => {
    it('deve retornar array para dados vazios', async () => {
      const anomalies = await detectAnomalies([]);
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('deve funcionar com dados básicos', async () => {
      const { openai } = require('../../../../src/lib/ai/config');
      openai.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"anomalies":[]}' } }]
      });

      const testData = [
        {
          campaign_id: '1',
          campaign_name: 'Campanha Teste',
          conversion_rate: 0.05,
          spend: 1000
        }
      ];

      const anomalies = await detectAnomalies(testData);
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('deve detectar leads duplicados quando existem', async () => {
      const { openai } = require('../../../../src/lib/ai/config');
      openai.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"anomalies":[]}' } }]
      });

      const dataWithDuplicates = [
        {
          campaign_id: '1',
          campaign_name: 'Campanha Teste',
          conversion_rate: 0.05,
          spend: 1000,
          leads: [
            { email: 'test@example.com' },
            { email: 'test@example.com' }
          ]
        }
      ];

      const anomalies = await detectAnomalies(dataWithDuplicates);
      expect(Array.isArray(anomalies)).toBe(true);
      
      const duplicateAnomaly = anomalies.find(a => a.type === AnomalyType.DUPLICATE_LEADS);
      expect(duplicateAnomaly).toBeDefined();
    });

    it('deve lidar com erro graciosamente', async () => {
      const { openai } = require('../../../../src/lib/ai/config');
      openai.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const testData = [
        { campaign_id: '1', campaign_name: 'Campanha', conversion_rate: 0.05, spend: 1000 }
      ];

      const anomalies = await detectAnomalies(testData);
      expect(Array.isArray(anomalies)).toBe(true);
    });
  });
}); 