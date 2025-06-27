import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock do Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          in: jest.fn(() => ({
            data: [
              {
                id: 'test-campaign-1',
                name: 'Test Campaign 1',
                status: 'ACTIVE',
                daily_budget: 10000,
                budget_remaining: 5000,
                created_time: '2025-01-20T00:00:00Z',
                updated_time: '2025-01-27T00:00:00Z'
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
};

// Mock das APIs de IA
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'Análise de performance: A campanha Test Campaign 1 apresenta um CPL de R$ 45,50 com taxa de conversão de 2,3%. Recomendo otimizar a segmentação para melhorar a eficiência.'
            }
          }]
        }))
      }
    }
  }))
}));

// Import das APIs após os mocks
import { POST as analyzePost } from '../../app/api/ai/analyze/route';
import { POST as anomaliesPost } from '../../app/api/ai/anomalies/route';
import { POST as optimizationPost } from '../../app/api/ai/optimization/route';
import { POST as chatPost } from '../../app/api/ai/chat/route';

describe('AI Workflow Integration Tests', () => {
  const mockDateRange = {
    startDate: '2025-01-20',
    endDate: '2025-01-27'
  };

  const mockCampaignIds = ['test-campaign-1'];

  beforeAll(() => {
    // Setup environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Performance Analysis API', () => {
    it('should analyze performance data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE',
          dateRange: mockDateRange,
          campaignIds: mockCampaignIds
        })
      });

      const response = await analyzePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('analysis');
      expect(data.analysis).toContain('performance');
      expect(data).toHaveProperty('insights');
      expect(Array.isArray(data.insights)).toBe(true);
    });

    it('should handle missing date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE'
        })
      });

      const response = await analyzePost(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Anomaly Detection API', () => {
    it('should detect anomalies successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/anomalies', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: mockDateRange,
          sensitivity: 'medium',
          campaignIds: mockCampaignIds
        })
      });

      const response = await anomaliesPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('anomalies');
      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('total');
      expect(data.summary).toHaveProperty('critical');
      expect(data.summary).toHaveProperty('high');
      expect(data.summary).toHaveProperty('medium');
      expect(data.summary).toHaveProperty('low');
    });

    it('should handle different sensitivity levels', async () => {
      const sensitivities = ['low', 'medium', 'high'];
      
      for (const sensitivity of sensitivities) {
        const request = new NextRequest('http://localhost:3000/api/ai/anomalies', {
          method: 'POST',
          body: JSON.stringify({
            dateRange: mockDateRange,
            sensitivity,
            campaignIds: mockCampaignIds
          })
        });

        const response = await anomaliesPost(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('config');
        expect(data.config.sensitivity).toBe(sensitivity);
      }
    });
  });

  describe('Optimization Suggestions API', () => {
    it('should generate optimization suggestions', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/optimization', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: mockDateRange,
          campaignIds: mockCampaignIds
        })
      });

      const response = await optimizationPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('suggestions');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('stats');
    });
  });

  describe('Chat Assistant API', () => {
    it('should respond to chat queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Qual campanha teve melhor performance?',
          context: {
            dateRange: mockDateRange,
            campaignIds: mockCampaignIds
          }
        })
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('response');
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(10);
    });

    it('should handle contextual questions', async () => {
      const questions = [
        'Como está a performance das campanhas?',
        'Há alguma anomalia detectada?',
        'Quais são as sugestões de otimização?',
        'Qual o CPL médio das campanhas?'
      ];

      for (const question of questions) {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: question,
            context: {
              dateRange: mockDateRange,
              campaignIds: mockCampaignIds
            }
          })
        });

        const response = await chatPost(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('response');
        expect(typeof data.response).toBe('string');
      }
    });
  });

  describe('Cross-Module Integration', () => {
    it('should maintain data consistency across modules', async () => {
      // Test that all modules work with the same data set
      const testData = {
        dateRange: mockDateRange,
        campaignIds: mockCampaignIds
      };

      // Get analysis
      const analysisRequest = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE',
          ...testData
        })
      });

      const analysisResponse = await analyzePost(analysisRequest);
      const analysisData = await analysisResponse.json();

      // Get anomalies
      const anomaliesRequest = new NextRequest('http://localhost:3000/api/ai/anomalies', {
        method: 'POST',
        body: JSON.stringify({
          sensitivity: 'medium',
          ...testData
        })
      });

      const anomaliesResponse = await anomaliesPost(anomaliesRequest);
      const anomaliesData = await anomaliesResponse.json();

      // Get optimizations
      const optimizationRequest = new NextRequest('http://localhost:3000/api/ai/optimization', {
        method: 'POST',
        body: JSON.stringify(testData)
      });

      const optimizationResponse = await optimizationPost(optimizationRequest);
      const optimizationData = await optimizationResponse.json();

      // Verify all modules return successful responses
      expect(analysisResponse.status).toBe(200);
      expect(anomaliesResponse.status).toBe(200);
      expect(optimizationResponse.status).toBe(200);

      // Verify data structure consistency
      expect(analysisData).toHaveProperty('analysis');
      expect(anomaliesData).toHaveProperty('anomalies');
      expect(optimizationData).toHaveProperty('suggestions');

      // Verify they all reference the same campaign data
      expect(anomaliesData.config.dateRange).toEqual(testData.dateRange);
      expect(optimizationData.config.dateRange).toEqual(testData.dateRange);
    });

    it('should handle workflow with no data gracefully', async () => {
      // Mock empty data response
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              in: jest.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      });

      const testData = {
        dateRange: mockDateRange,
        campaignIds: ['non-existent-campaign']
      };

      // Test analysis with no data
      const analysisRequest = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE',
          ...testData
        })
      });

      const analysisResponse = await analyzePost(analysisRequest);
      expect(analysisResponse.status).toBe(200);

      // Test anomalies with no data
      const anomaliesRequest = new NextRequest('http://localhost:3000/api/ai/anomalies', {
        method: 'POST',
        body: JSON.stringify({
          sensitivity: 'medium',
          ...testData
        })
      });

      const anomaliesResponse = await anomaliesPost(anomaliesRequest);
      const anomaliesData = await anomaliesResponse.json();
      
      expect(anomaliesResponse.status).toBe(200);
      expect(anomaliesData.anomalies).toEqual([]);
      expect(anomaliesData.summary.total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn(() => Promise.reject(new Error('OpenAI API Error')))
          }
        }
      }));

      const request = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE',
          dateRange: mockDateRange,
          campaignIds: mockCampaignIds
        })
      });

      const response = await analyzePost(request);
      
      // Should handle error gracefully
      expect(response.status).toBe(500);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              in: jest.fn(() => ({
                data: null,
                error: { message: 'Database connection error' }
              }))
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/ai/anomalies', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: mockDateRange,
          sensitivity: 'medium',
          campaignIds: mockCampaignIds
        })
      });

      const response = await anomaliesPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.anomalies).toEqual([]);
    });
  });

  describe('Performance Validation', () => {
    it('should complete analysis within acceptable time', async () => {
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PERFORMANCE',
          dateRange: mockDateRange,
          campaignIds: mockCampaignIds
        })
      });

      const response = await analyzePost(request);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(30000); // Less than 30 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, () => 
        new NextRequest('http://localhost:3000/api/ai/analyze', {
          method: 'POST',
          body: JSON.stringify({
            type: 'PERFORMANCE',
            dateRange: mockDateRange,
            campaignIds: mockCampaignIds
          })
        })
      );

      const responses = await Promise.all(
        requests.map(request => analyzePost(request))
      );

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
}); 