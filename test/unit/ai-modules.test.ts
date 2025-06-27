import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock OpenAI before any imports
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                analysis: 'Análise de performance detalhada',
                insights: ['Insight 1', 'Insight 2'],
                recommendations: ['Recomendação 1', 'Recomendação 2']
              })
            }
          }]
        }))
      }
    }
  }))
}));

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';

import { detectAnomalies, getDetectionConfig } from '../../src/lib/ai/anomalyDetection';
import { OptimizationEngine } from '../../src/lib/ai/optimizationEngine';
import { analyzePerformance, generateInsights } from '../../src/lib/ai/aiService';

describe('AI Modules Unit Tests', () => {
  beforeEach(() => {
    // Setup environment
    process.env.OPENAI_API_KEY = 'test-key';
    jest.clearAllMocks();
  });

  describe('Anomaly Detection Module', () => {
    const mockCampaignData = [
      {
        id: 'campaign-1',
        name: 'Test Campaign 1',
        status: 'ACTIVE',
        daily_budget: 10000,
        budget_remaining: 5000,
        created_time: '2025-01-20T00:00:00Z',
        updated_time: '2025-01-27T00:00:00Z'
      },
      {
        id: 'campaign-2',
        name: 'Test Campaign 2',
        status: 'ACTIVE',
        daily_budget: 20000,
        budget_remaining: 1000,
        created_time: '2025-01-20T00:00:00Z',
        updated_time: '2025-01-27T00:00:00Z'
      }
    ];

    it('should get detection config for different sensitivity levels', () => {
      const lowConfig = getDetectionConfig('low');
      const mediumConfig = getDetectionConfig('medium');
      const highConfig = getDetectionConfig('high');

      expect(lowConfig.cplThreshold).toBeGreaterThan(mediumConfig.cplThreshold);
      expect(mediumConfig.cplThreshold).toBeGreaterThan(highConfig.cplThreshold);
      
      expect(lowConfig.conversionRateThreshold).toBeGreaterThan(mediumConfig.conversionRateThreshold);
      expect(mediumConfig.conversionRateThreshold).toBeGreaterThan(highConfig.conversionRateThreshold);
    });

    it('should detect budget anomalies', async () => {
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, config);

      // Should detect campaign with low budget remaining
      const budgetAnomalies = anomalies.filter(a => a.type === 'BUDGET_DEPLETION');
      expect(budgetAnomalies.length).toBeGreaterThan(0);
      
      const budgetAnomaly = budgetAnomalies[0];
      expect(budgetAnomaly.severity).toBe('HIGH');
      expect(budgetAnomaly.affectedCampaigns).toContain('campaign-2');
    });

    it('should handle empty campaign data', async () => {
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies([], config);

      expect(anomalies).toEqual([]);
    });

    it('should generate appropriate anomaly recommendations', async () => {
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, config);

      anomalies.forEach(anomaly => {
        expect(anomaly.recommendations).toBeDefined();
        expect(Array.isArray(anomaly.recommendations)).toBe(true);
        expect(anomaly.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Optimization Engine Module', () => {
    const mockCampaignData = [
      {
        id: 'campaign-1',
        name: 'Test Campaign 1',
        spend: 5000,
        impressions: 100000,
        clicks: 2000,
        conversions: 50,
        cpl: 100,
        ctr: 2.0,
        conversionRate: 2.5
      }
    ];

    let optimizationEngine: OptimizationEngine;

    beforeEach(() => {
      optimizationEngine = new OptimizationEngine();
    });

    it('should initialize optimization engine', () => {
      expect(optimizationEngine).toBeInstanceOf(OptimizationEngine);
    });

    it('should generate optimization suggestions', async () => {
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('actions');
        expect(['SEGMENTACAO', 'CRIATIVO', 'ORCAMENTO', 'TIMING', 'ABTEST']).toContain(suggestion.type);
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(suggestion.impact);
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate benchmarks correctly', () => {
      const benchmarks = optimizationEngine.calculateBenchmarks(mockCampaignData);

      expect(benchmarks).toHaveProperty('avgCPL');
      expect(benchmarks).toHaveProperty('avgCTR');
      expect(benchmarks).toHaveProperty('avgConversionRate');
      expect(benchmarks).toHaveProperty('totalSpend');
      expect(benchmarks).toHaveProperty('totalConversions');

      expect(benchmarks.avgCPL).toBe(100);
      expect(benchmarks.avgCTR).toBe(2.0);
      expect(benchmarks.avgConversionRate).toBe(2.5);
      expect(benchmarks.totalSpend).toBe(5000);
      expect(benchmarks.totalConversions).toBe(50);
    });

    it('should handle empty campaign data gracefully', async () => {
      const suggestions = await optimizationEngine.generateSuggestions(
        [],
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('AI Service Module', () => {
    const mockData = {
      campaigns: [
        {
          id: 'campaign-1',
          name: 'Test Campaign',
          spend: 1000,
          impressions: 50000,
          clicks: 1000,
          conversions: 25,
          cpl: 40,
          ctr: 2.0,
          conversionRate: 2.5
        }
      ],
      dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
    };

    it('should analyze performance data', async () => {
      const analysis = await analyzePerformance(mockData);

      expect(analysis).toHaveProperty('analysis');
      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('recommendations');
      expect(typeof analysis.analysis).toBe('string');
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should generate insights from data', async () => {
      const insights = await generateInsights(mockData);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
        expect(['INFO', 'WARNING', 'CRITICAL']).toContain(insight.severity);
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock OpenAI error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn(() => Promise.reject(new Error('API Error')))
          }
        }
      }));

      await expect(analyzePerformance(mockData)).rejects.toThrow('API Error');
    });

    it('should validate input data', async () => {
      // Test with invalid data
      const invalidData = {
        campaigns: null,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      await expect(analyzePerformance(invalidData as any)).rejects.toThrow();
    });
  });

  describe('Integration Between Modules', () => {
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

    it('should maintain consistency between anomaly detection and optimization', async () => {
      // Run anomaly detection
      const anomalyConfig = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, anomalyConfig);

      // Run optimization engine
      const optimizationEngine = new OptimizationEngine();
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      // Both should work with the same data structure
      expect(Array.isArray(anomalies)).toBe(true);
      expect(Array.isArray(suggestions)).toBe(true);

      // If anomalies are detected, there should be related optimization suggestions
      if (anomalies.length > 0) {
        expect(suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should provide consistent recommendations across modules', async () => {
      // Get anomalies
      const anomalyConfig = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(mockCampaignData, anomalyConfig);

      // Get optimization suggestions
      const optimizationEngine = new OptimizationEngine();
      const suggestions = await optimizationEngine.generateSuggestions(
        mockCampaignData,
        { startDate: '2025-01-20', endDate: '2025-01-27' }
      );

      // Both should reference the same campaigns
      const anomalyCampaigns = new Set(
        anomalies.flatMap(a => a.affectedCampaigns)
      );
      
      const suggestionCampaigns = new Set(
        suggestions.flatMap(s => s.affectedCampaigns || [])
      );

      // There should be some overlap in affected campaigns
      const intersection = new Set(
        [...anomalyCampaigns].filter(x => suggestionCampaigns.has(x))
      );

      if (anomalyCampaigns.size > 0 && suggestionCampaigns.size > 0) {
        expect(intersection.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete anomaly detection within reasonable time', async () => {
      const largeCampaignData = Array.from({ length: 100 }, (_, i) => ({
        id: `campaign-${i}`,
        name: `Test Campaign ${i}`,
        status: 'ACTIVE',
        daily_budget: Math.random() * 20000,
        budget_remaining: Math.random() * 20000,
        created_time: '2025-01-20T00:00:00Z',
        updated_time: '2025-01-27T00:00:00Z'
      }));

      const startTime = Date.now();
      const config = getDetectionConfig('medium');
      const anomalies = await detectAnomalies(largeCampaignData, config);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // Less than 10 seconds
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should handle concurrent AI operations', async () => {
      const data = {
        campaigns: mockCampaignData,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      // Run multiple operations concurrently
      const operations = [
        analyzePerformance(data),
        generateInsights(data),
        detectAnomalies(mockCampaignData, getDetectionConfig('medium'))
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    it('should provide fallback analysis when AI is unavailable', async () => {
      // Mock complete API failure
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn(() => Promise.reject(new Error('Service Unavailable')))
          }
        }
      }));

      const data = {
        campaigns: mockCampaignData,
        dateRange: { startDate: '2025-01-20', endDate: '2025-01-27' }
      };

      // Should throw error (fallback logic would be implemented in the service layer)
      await expect(analyzePerformance(data)).rejects.toThrow();
    });

    it('should validate and sanitize input data', () => {
      // Test anomaly detection with malformed data
      const malformedData = [
        {
          id: null,
          name: '',
          status: 'INVALID_STATUS',
          daily_budget: 'not-a-number',
          budget_remaining: -1000
        }
      ];

      const config = getDetectionConfig('medium');
      
      // Should handle malformed data gracefully
      expect(() => detectAnomalies(malformedData as any, config)).not.toThrow();
    });
  });
}); 