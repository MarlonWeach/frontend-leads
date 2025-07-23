/**
 * Configuração para testes com OpenAI real
 * 
 * Para usar OpenAI real nos testes:
 * 1. Configure OPENAI_API_KEY no ambiente
 * 2. Execute: OPENAI_API_KEY=sua_chave npm test
 * 
 * Para usar mocks (padrão):
 * 1. Não configure OPENAI_API_KEY ou use 'test-key'
 * 2. Execute: npm test
 */

export const OPENAI_TEST_CONFIG = {
  // Verifica se deve usar OpenAI real
  useRealOpenAI: () => {
    const apiKey = process.env.OPENAI_API_KEY;
    return apiKey && apiKey !== 'test-key' && apiKey !== '';
  },

  // Configurações para testes com OpenAI real
  realOpenAIConfig: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.3,
    timeout: 30000, // 30 segundos
  },

  // Configurações para mocks
  mockConfig: {
    responseDelay: 100, // Simular latência
    successRate: 0.95, // 95% de sucesso
  },

  // Logs para debug
  logConfig: {
    enabled: process.env.NODE_ENV === 'test' && process.env.DEBUG === 'true',
    logRequests: true,
    logResponses: false, // Cuidado com dados sensíveis
  }
};

// Função helper para configurar ambiente de teste
export const setupTestEnvironment = () => {
  const useReal = OPENAI_TEST_CONFIG.useRealOpenAI();
  
  if (useReal) {
    console.log('🧪 Usando OpenAI REAL para testes');
    console.log('⚠️  Cuidado: Testes podem gerar custos na API');
  } else {
    console.log('🧪 Usando MOCKS para testes (padrão)');
  }

  return useReal;
};

// Função para validar resposta do OpenAI
export const validateOpenAIResponse = (response: any) => {
  if (!response) return false;
  if (!response.choices || !Array.isArray(response.choices)) return false;
  if (response.choices.length === 0) return false;
  
  const choice = response.choices[0];
  if (!choice.message || !choice.message.content) return false;
  
  return true;
};

// Função para criar prompt de teste
export const createTestPrompt = (type: 'analysis' | 'anomaly' | 'optimization') => {
  const prompts = {
    analysis: 'Analise os dados de performance fornecidos e forneça insights básicos.',
    anomaly: 'Identifique anomalias nos dados de campanhas fornecidos.',
    optimization: 'Sugira otimizações básicas para os dados de campanhas fornecidos.'
  };
  
  return prompts[type] || prompts.analysis;
}; 

// Mock global para analyzePerformance e OptimizationEngine para garantir estrutura correta nos testes
if (!OPENAI_TEST_CONFIG.useRealOpenAI()) {
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
} 