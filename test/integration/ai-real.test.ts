/**
 * Teste de integração com OpenAI real
 * 
 * Este teste usa OpenAI real quando OPENAI_API_KEY está configurada,
 * caso contrário usa mocks.
 * 
 * Para executar com OpenAI real:
 * OPENAI_API_KEY=sua_chave npm run test:ai:real:all
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { setupTestEnvironment, validateOpenAIResponse, createTestPrompt } from '../config/openai-test-config';
import { analyzePerformance, generateInsights } from '../../src/lib/ai/aiService';
import { detectAnomalies } from '../../src/lib/ai/anomalyDetection';
import { OptimizationEngine } from '../../src/lib/ai/optimizationEngine';

describe('AI Integration Tests (Real OpenAI)', () => {
  let useRealOpenAI: boolean;

  beforeAll(() => {
    useRealOpenAI = setupTestEnvironment() || false;
  });

  const mockCampaignData = [
    {
      id: 'campaign-1',
      name: 'Test Campaign 1',
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
    },
    {
      id: 'campaign-2',
      name: 'Test Campaign 2',
      status: 'ACTIVE',
      daily_budget: 20000,
      budget_remaining: 1000, // Budget baixo para testar anomalias
      spend: 19000,
      impressions: 50000,
      clicks: 800,
      conversions: 15,
      cpl: 1267, // CPL alto
      ctr: 1.6,
      conversionRate: 1.9,
      created_time: '2025-01-20T00:00:00Z',
      updated_time: '2025-01-27T00:00:00Z'
    }
  ];

  describe('Performance Analysis', () => {
    it('should analyze performance data with real OpenAI', async () => {
      const data = {
        campaigns: mockCampaignData,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const analysis = await analyzePerformance(data);

      expect(analysis).toBeDefined();
      
      if (useRealOpenAI) {
        // Com OpenAI real, esperamos uma resposta mais elaborada
        expect(typeof analysis.analysis).toBe('string');
        expect(analysis.analysis.length).toBeGreaterThan(50);
        expect(Array.isArray(analysis.insights)).toBe(true);
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      } else {
        // Com mocks, verificamos a estrutura básica
        expect(analysis).toHaveProperty('analysis');
        expect(analysis).toHaveProperty('insights');
        expect(analysis).toHaveProperty('recommendations');
      }
    }, useRealOpenAI ? 30000 : 5000); // Timeout maior para OpenAI real

    it('should generate insights from campaign data', async () => {
      const data = {
        campaigns: mockCampaignData,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const insights = await generateInsights(data);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
      });
    }, useRealOpenAI ? 30000 : 5000);
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalies in campaign data', async () => {
      const anomalies = await detectAnomalies(mockCampaignData);

      expect(Array.isArray(anomalies)).toBe(true);

      if (useRealOpenAI) {
        // Com OpenAI real, esperamos detectar a campanha com budget baixo
        const budgetAnomalies = anomalies.filter(a => 
          a.type === 'PERFORMANCE_DROP' || a.type === 'COST_SPIKE'
        );
        
        if (budgetAnomalies.length > 0) {
          expect(budgetAnomalies[0]).toHaveProperty('severity');
          expect(budgetAnomalies[0]).toHaveProperty('message');
        }
      } else {
        // Com mocks, verificamos a estrutura
        if (anomalies.length > 0) {
          expect(anomalies[0]).toHaveProperty('type');
          expect(anomalies[0]).toHaveProperty('severity');
        }
      }
    }, useRealOpenAI ? 30000 : 5000);
  });

  describe('Optimization Engine', () => {
    it('should generate optimization suggestions', async () => {
      const optimizationEngine = new OptimizationEngine();
      
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      expect(Array.isArray(suggestions)).toBe(true);

      if (useRealOpenAI) {
        // Com OpenAI real, esperamos sugestões mais específicas
        if (suggestions.length > 0) {
          expect(suggestions[0]).toHaveProperty('type');
          expect(suggestions[0]).toHaveProperty('title');
          expect(suggestions[0]).toHaveProperty('description');
          expect(suggestions[0]).toHaveProperty('impact');
        }
      } else {
        // Com mocks, verificamos a estrutura básica
        if (suggestions.length > 0) {
          expect(suggestions[0]).toHaveProperty('id');
          expect(suggestions[0]).toHaveProperty('type');
        }
      }
    }, useRealOpenAI ? 30000 : 5000);
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidData = {
        campaigns: null,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      await expect(analyzePerformance(invalidData as any)).rejects.toThrow();
    });

    it('should handle empty data', async () => {
      const emptyData = {
        campaigns: [],
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      const analysis = await analyzePerformance(emptyData);
      
      expect(analysis).toBeDefined();
      expect(analysis.analysis).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      const data = {
        campaigns: mockCampaignData,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      await analyzePerformance(data);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Timeout razoável baseado no tipo de teste
      const maxDuration = useRealOpenAI ? 30000 : 5000;
      expect(duration).toBeLessThan(maxDuration);
    });
  });
}); 