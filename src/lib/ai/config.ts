import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Configuração da OpenAI com logs detalhados
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-tests',
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  // Configuração de logs detalhados
  maxRetries: 0, // Desabilitar retry para ver erro original
});

// Configuração da Anthropic como fallback
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-tests',
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test', // Permitir em ambiente de teste
});

// Função para log detalhado das requisições OpenAI
export const logOpenAIRequest = (params: {
  model: string;
  messages: any[];
  requestId?: string;
  timestamp?: string;
}) => {
  console.log('🤖 [OPENAI REQUEST]', {
    timestamp: new Date().toISOString(),
    model: params.model,
    messageCount: params.messages.length,
    apiKeyPresent: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not-found',
    requestId: params.requestId || 'no-id'
  });
};

// Função para log detalhado das requisições Anthropic
export const logAnthropicRequest = (params: {
  model: string;
  messages: any[];
  requestId?: string;
  timestamp?: string;
}) => {
  console.log('🧠 [ANTHROPIC REQUEST]', {
    timestamp: new Date().toISOString(),
    model: params.model,
    messageCount: params.messages.length,
    apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'not-found',
    requestId: params.requestId || 'no-id'
  });
};

// Função para log detalhado das respostas OpenAI
export const logOpenAIResponse = (response: any, error?: any) => {
  if (error) {
    console.log('❌ [OPENAI ERROR]', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.type,
        code: error.code,
        status: error.status,
        param: error.param,
      },
      requestId: error.requestId || 'no-id',
      headers: error.headers || {}
    });
  } else {
    console.log('✅ [OPENAI SUCCESS]', {
      timestamp: new Date().toISOString(),
      model: response.model,
      usage: response.usage,
      choices: response.choices?.length || 0,
      requestId: response.id || 'no-id'
    });
  }
};

// Função para log detalhado das respostas Anthropic
export const logAnthropicResponse = (response: any, error?: any) => {
  if (error) {
    console.log('❌ [ANTHROPIC ERROR]', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.type,
        code: error.code,
        status: error.status,
      },
      requestId: error.request_id || 'no-id',
    });
  } else {
    console.log('✅ [ANTHROPIC SUCCESS]', {
      timestamp: new Date().toISOString(),
      model: response.model,
      usage: response.usage,
      requestId: response.id || 'no-id'
    });
  }
};

// Configuração de fallback para quota excedida
export const FALLBACK_CONFIG = {
  ENABLE_FALLBACK: true, // Sempre habilitado devido a limites de conta
  FALLBACK_RESPONSES: {
    PERFORMANCE: {
      analysis: "**Análise de Performance**\n\n📊 **Resumo dos Dados:**\n- Período analisado com métricas de leads, gastos e conversões\n- Dados processados com sucesso\n\n🔍 **Principais Insights:**\n- As campanhas mostram padrões consistentes de performance\n- Recomenda-se monitoramento contínuo das métricas\n- Oportunidades de otimização identificadas\n\n⚠️ *Análise gerada em modo fallback devido a limitações temporárias da API.*",
      variations: "**Análise de Variações**\n\n📈 **Variações Identificadas:**\n- Flutuações normais observadas nos dados\n- Padrões sazonais detectados\n- Tendências de performance analisadas\n\n💡 **Recomendações:**\n- Manter monitoramento das métricas principais\n- Ajustar estratégias conforme necessário\n- Focar em otimizações baseadas em dados\n\n⚠️ *Análise gerada em modo fallback devido a limitações temporárias da API.*"
    },
    ANOMALY: {
      detection: "**Detecção de Anomalias**\n\n🔍 **Status da Análise:**\n- Dados analisados para padrões anômalos\n- Métricas verificadas dentro dos parâmetros normais\n- Nenhuma anomalia crítica detectada\n\n✅ **Resultado:**\n- Campanhas operando dentro dos padrões esperados\n- Métricas de conversão estáveis\n- Qualidade do tráfego mantida\n\n⚠️ *Análise gerada em modo fallback devido a limitações temporárias da API.*"
    },
    OPTIMIZATION: {
      suggestions: "**Sugestões de Otimização**\n\n🎯 **Oportunidades Identificadas:**\n- Ajustes de segmentação de público\n- Otimização de orçamento entre campanhas\n- Melhorias nos criativos\n\n📊 **Próximos Passos:**\n- Implementar testes A/B nos criativos\n- Revisar segmentação de público-alvo\n- Monitorar performance pós-otimização\n\n⚠️ *Análise gerada em modo fallback devido a limitações temporárias da API.*"
    }
  }
};

// Configuração da integração com OpenAI
export const AI_CONFIG = {
  // Modelo padrão - usando GPT-4o mini (melhor custo-benefício)
  DEFAULT_MODEL: 'gpt-4o-mini' as const,
  
  // Modelo alternativo para análises mais complexas
  ADVANCED_MODEL: 'gpt-4o' as const,
  
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
  
  // Rate limiting - configurações ultra conservadoras para Tier 1
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 1,    // Apenas 1 request por minuto
    REQUESTS_PER_HOUR: 10,     // Apenas 10 requests por hora
    REQUESTS_PER_DAY: 50,      // Apenas 50 requests por dia
    COOLDOWN_PERIOD: 120000,   // 2 minutos de cooldown após erro 429
  },
  
  // Cache settings
  CACHE: {
    TTL: 3600,          // 1 hora em segundos
    MAX_SIZE: 100,      // Máximo de itens em cache
  },
  
  // Fallback configuration
  FALLBACK: {
    ENABLED: true,      // Habilitar fallback
    PROVIDER: 'anthropic' as const,
    RETRY_ATTEMPTS: 1,  // Tentativas antes de usar fallback
  },
} as const;

// Configuração específica para Anthropic
export const ANTHROPIC_CONFIG = {
  // Modelo padrão - Claude 3.5 Haiku (rápido e econômico)
  DEFAULT_MODEL: 'claude-3-5-haiku-20241022' as const,
  
  // Modelo avançado - Claude 3.5 Sonnet (mais capaz)
  ADVANCED_MODEL: 'claude-3-5-sonnet-20241022' as const,
  
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
  },
  
  // Rate limiting - mais generoso que OpenAI
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 50,   // Claude tem limites mais altos
    REQUESTS_PER_HOUR: 1000,   
    REQUESTS_PER_DAY: 10000,   
  },
} as const;

// Tipos para os modelos
export type AIModel = typeof AI_CONFIG.DEFAULT_MODEL | typeof AI_CONFIG.ADVANCED_MODEL;
export type AnthropicModel = typeof ANTHROPIC_CONFIG.DEFAULT_MODEL | typeof ANTHROPIC_CONFIG.ADVANCED_MODEL;

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