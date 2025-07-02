import OpenAI from 'openai';

// Configuração da OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-tests',
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

// Configuração da integração com OpenAI
export const AI_CONFIG = {
  // Modelo padrão - usando GPT-3.5-turbo para custos menores
  DEFAULT_MODEL: 'gpt-3.5-turbo' as const,
  
  // Modelo alternativo para análises mais complexas
  ADVANCED_MODEL: 'gpt-4' as const,
  
  // Configurações de temperatura (0 = mais determinístico, 1 = mais criativo)
  TEMPERATURE: {
    ANALYSIS: 0.3,      // Análises precisas
    CREATIVE: 0.7,      // Geração de conteúdo
    CHAT: 0.5,          // Conversas equilibradas
  },
  
  // Limites de tokens
  MAX_TOKENS: {
    ANALYSIS: 1000,     // Análises de performance
    INSIGHT: 500,       // Insights individuais
    CHAT: 800,          // Respostas de chat
    OPTIMIZATION: 1200, // Sugestões de otimização
  },
  
  // Timeouts em segundos
  TIMEOUTS: {
    REQUEST: 30,        // Timeout da requisição
    STREAM: 60,         // Timeout para streaming
  },
  
  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 20,
    REQUESTS_PER_HOUR: 1000,
  },
  
  // Cache settings
  CACHE: {
    TTL: 3600,          // 1 hora em segundos
    MAX_SIZE: 100,      // Máximo de itens em cache
  },
} as const;

// Tipos para os modelos
export type AIModel = typeof AI_CONFIG.DEFAULT_MODEL | typeof AI_CONFIG.ADVANCED_MODEL;

// Configuração de prompts
export const PROMPT_CONFIG = {
  LANGUAGE: 'portuguese',
  CONTEXT: 'marketing digital, campanhas de lead ads, setor automotivo',
  TONE: 'profissional mas acessível',
} as const;

// Configuração de análise de performance
export const PERFORMANCE_ANALYSIS_CONFIG = {
  // Períodos de análise
  PERIODS: {
    SHORT: 7,    // 7 dias
    MEDIUM: 30,  // 30 dias
    LONG: 90,    // 90 dias
  },
  
  // Métricas importantes
  KEY_METRICS: [
    'leads',
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpl',
    'conversion_rate',
  ],
  
  // Thresholds para detecção de anomalias
  ANOMALY_THRESHOLDS: {
    CPL_INCREASE: 0.3,      // 30% de aumento
    CTR_DECREASE: 0.2,      // 20% de diminuição
    SPEND_SPIKE: 0.5,       // 50% de aumento
    CONVERSION_DROP: 0.25,  // 25% de diminuição
  },
} as const;

// Configuração de otimização
export const OPTIMIZATION_CONFIG = {
  // Tipos de otimização
  TYPES: {
    SEGMENTATION: 'segmentação',
    CREATIVE: 'criativo',
    BUDGET: 'orçamento',
    TIMING: 'timing',
    TARGETING: 'público-alvo',
  },
  
  // Impacto esperado das otimizações
  EXPECTED_IMPACT: {
    LOW: 0.1,      // 10% de melhoria
    MEDIUM: 0.25,  // 25% de melhoria
    HIGH: 0.5,     // 50% de melhoria
  },
} as const;

// Configuração de chat
export const CHAT_CONFIG = {
  // Contexto máximo para conversas
  MAX_CONTEXT_LENGTH: 10, // Últimas 10 mensagens
  
  // Tipos de perguntas suportadas
  SUPPORTED_QUESTIONS: [
    'performance',
    'comparação',
    'tendências',
    'anomalias',
    'otimização',
    'métricas',
  ],
  
  // Respostas padrão para casos de erro
  FALLBACK_RESPONSES: {
    NO_DATA: 'Desculpe, não tenho dados suficientes para responder essa pergunta.',
    ERROR: 'Ocorreu um erro ao processar sua pergunta. Tente novamente.',
    UNSUPPORTED: 'Essa pergunta está fora do escopo do assistente.',
  },
} as const;

// Tipos de análise disponíveis
export const ANALYSIS_TYPES = {
  PERFORMANCE: 'performance',
  ANOMALY: 'anomaly',
  OPTIMIZATION: 'optimization',
  INSIGHTS: 'insights',
} as const;

// Configurações específicas para cada tipo de análise
export const ANALYSIS_CONFIGS = {
  [ANALYSIS_TYPES.PERFORMANCE]: {
    model: AI_CONFIG.DEFAULT_MODEL,
    temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
    maxTokens: AI_CONFIG.MAX_TOKENS.ANALYSIS,
    prompt: 'Analise os dados de performance das campanhas e explique as variações em linguagem natural.',
  },
  [ANALYSIS_TYPES.ANOMALY]: {
    model: AI_CONFIG.DEFAULT_MODEL,
    temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
    maxTokens: AI_CONFIG.MAX_TOKENS.ANALYSIS,
    prompt: 'Identifique anomalias nos dados de campanhas, como conversões suspeitas, tráfego anormal ou variações inesperadas.',
  },
  [ANALYSIS_TYPES.OPTIMIZATION]: {
    model: AI_CONFIG.ADVANCED_MODEL,
    temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
    maxTokens: AI_CONFIG.MAX_TOKENS.OPTIMIZATION,
    prompt: 'Sugira otimizações baseadas nos dados históricos e padrões identificados.',
  },
  [ANALYSIS_TYPES.INSIGHTS]: {
    model: AI_CONFIG.DEFAULT_MODEL,
    temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
    maxTokens: AI_CONFIG.MAX_TOKENS.INSIGHT,
    prompt: 'Gere insights acionáveis baseados nos dados de performance.',
  },
}; 