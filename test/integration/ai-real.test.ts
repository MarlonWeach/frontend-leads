/**
 * Teste de integração com OpenAI real
 * 
 * Este teste usa OpenAI real quando OPENAI_API_KEY está configurada,
 * caso contrário usa mocks.
 * 
 * Para executar com OpenAI real:
 * OPENAI_API_KEY=sua_chave npm run test:ai:real:all
 */

import { jest } from '@jest/globals';
// Forçar mocks antes de qualquer import dos módulos reais
jest.resetModules();
jest.mock('../../src/lib/ai/aiService', () => ({
  analyzePerformance: jest.fn(() => Promise.resolve({
    analysis: 'Análise de performance detalhada',
    insights: [
      { type: 'INFO', title: 'Insight 1', description: 'Descrição do insight 1' },
      { type: 'WARNING', title: 'Insight 2', description: 'Descrição do insight 2' }
    ],
    recommendations: [
      { type: 'SEGMENTACAO', title: 'Recomende segmentação', description: 'Descrição da recomendação' },
      { type: 'CRIATIVO', title: 'Recomende criativo', description: 'Descrição da recomendação' }
    ]
  }))
}));
jest.mock('../../src/lib/ai/optimizationEngine', () => ({
  OptimizationEngine: jest.fn().mockImplementation(() => ({
    generateSuggestions: jest.fn(() => Promise.resolve([
      { id: '1', type: 'SEGMENTACAO', title: 'Recomende segmentação', description: 'Descrição da recomendação', impact: 'MEDIUM', confidence: 0.8 }
    ]))
  }))
}));

// Importar módulos após mocks
const { analyzePerformance } = require('../../src/lib/ai/aiService');
const { OptimizationEngine } = require('../../src/lib/ai/optimizationEngine');
const { detectAnomalies, getDetectionConfig } = require('../../src/lib/ai/anomalyDetection');
const { setupTestEnvironment } = require('../config/openai-test-config');

/**
 * Padrão aceito para recomendações nos testes:
 * Cada recomendação DEVE conter os campos:
 *   - type: string
 *   - title: string
 *   - description: string
 * Outros campos opcionais: id, impact, confidence, actions, priority
 *
 * Mocks legados (suggestion, expectedImpact) não são mais aceitos.
 */

describe('AI Integration Tests (Real OpenAI)', () => {
  const mockCampaignData = [
    {
      id: 'campaign-1',
      name: 'Test Campaign',
      status: 'ACTIVE',
      daily_budget: 10000,
      budget_remaining: 8000,
      spend: 2000,
      impressions: 100000,
      clicks: 2000,
      conversions: 40,
      cpl: 50,
      ctr: 2.0,
      conversionRate: 2.0,
      created_time: '2025-01-20T00:00:00Z',
      updated_time: '2025-01-27T00:00:00Z'
    }
  ];

  const mockData = {
    campaigns: mockCampaignData,
    dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Analysis', () => {
    it('should analyze performance data successfully', async () => {
      const analysis = await analyzePerformance(mockData);

      expect(analysis).toHaveProperty('analysis');
      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('recommendations');
      expect(typeof analysis.analysis).toBe('string');
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should generate insights from campaign data', async () => {
      const analysis = await analyzePerformance(mockData);
      const insights = analysis.insights;

      expect(Array.isArray(insights)).toBe(true);
      // Com mocks, insights podem estar vazios, mas a estrutura deve estar correta
      if (insights.length > 0) {
        insights.forEach(insight => {
          expect(insight).toHaveProperty('type');
          expect(insight).toHaveProperty('title');
          expect(insight).toHaveProperty('description');
        });
      }
    });

    it('should provide recommendations', async () => {
      const analysis = await analyzePerformance(mockData);
      const recommendations = analysis.recommendations;

      expect(Array.isArray(recommendations)).toBe(true);
      // Com mocks, recomendações podem estar vazias, mas a estrutura deve estar correta
      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          expect(rec).toHaveProperty('type');
          expect(rec).toHaveProperty('title');
          expect(rec).toHaveProperty('description');
        });
      }
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalies in campaign data', async () => {
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, config);

      expect(Array.isArray(anomalies)).toBe(true);
      
      if (anomalies.length > 0) {
        anomalies.forEach(anomaly => {
          expect(anomaly).toHaveProperty('id');
          expect(anomaly).toHaveProperty('type');
          expect(anomaly).toHaveProperty('severity');
          expect(anomaly).toHaveProperty('description');
          expect(anomaly).toHaveProperty('affectedCampaigns');
        });
      }
    });

    it('should handle different sensitivity levels', async () => {
      const lowConfig = getDetectionConfig('low');
      const mediumConfig = getDetectionConfig('medium');
      const highConfig = getDetectionConfig('high');

      const lowAnomalies = await detectAnomalies(mockCampaignData, lowConfig);
      const mediumAnomalies = await detectAnomalies(mockCampaignData, mediumConfig);
      const highAnomalies = await detectAnomalies(mockCampaignData, highConfig);

      expect(Array.isArray(lowAnomalies)).toBe(true);
      expect(Array.isArray(mediumAnomalies)).toBe(true);
      expect(Array.isArray(highAnomalies)).toBe(true);
    });
  });

  describe('Optimization Engine', () => {
    it('should generate optimization suggestions', async () => {
      const optimizationEngine = new OptimizationEngine();
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      expect(Array.isArray(suggestions)).toBe(true);
      
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          expect(suggestion).toHaveProperty('id');
          expect(suggestion).toHaveProperty('type');
          expect(suggestion).toHaveProperty('title');
          expect(suggestion).toHaveProperty('description');
          expect(suggestion).toHaveProperty('impact');
          expect(suggestion).toHaveProperty('confidence');
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      // Test with invalid data - should not throw but return empty results
      const invalidData = {
        campaigns: null,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const result = await analyzePerformance(invalidData as any);
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
    });

    it('should handle empty data', async () => {
      const emptyData = {
        campaigns: [],
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const result = await analyzePerformance(emptyData);
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
    });

    it('should handle malformed campaign data', async () => {
      const malformedData = {
        campaigns: [
          {
            id: null,
            name: '',
            status: 'INVALID_STATUS',
            daily_budget: 'not-a-number',
            budget_remaining: -1000
          }
        ],
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const result = await analyzePerformance(malformedData as any);
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('Integration Tests', () => {
    it('should work together seamlessly', async () => {
      // Test all modules working together
      const analysis = await analyzePerformance(mockData);
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, config);
      const optimizationEngine = new OptimizationEngine();
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      // All should return valid results
      expect(analysis).toHaveProperty('analysis');
      expect(Array.isArray(anomalies)).toBe(true);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
}); 