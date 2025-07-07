import OpenAI from 'openai';
import { AI_CONFIG, AIModel, PERFORMANCE_ANALYSIS_CONFIG, ANTHROPIC_CONFIG, AnthropicModel, anthropic, logOpenAIRequest, logOpenAIResponse, logAnthropicRequest, logAnthropicResponse } from './config';
import { logger } from '../../utils/logger';

// Importar tipo PerformanceData
interface PerformanceData {
  campaigns?: Array<{
    id?: string;
    campaign_id?: string;
    campaign_name?: string;
    name?: string;
    leads?: number;
    spend?: number;
    ctr?: number;
    cpl?: number;
    impressions?: number;
    clicks?: number;
  }>;
  adsets?: Array<{
    id?: string;
    adset_id?: string;
    adset_name?: string;
    name?: string;
    leads?: number;
    spend?: number;
    ctr?: number;
    cpl?: number;
    impressions?: number;
    clicks?: number;
  }>;
  ads?: Array<{
    id?: string;
    ad_id?: string;
    ad_name?: string;
    name?: string;
    leads?: number;
    spend?: number;
    ctr?: number;
    cpl?: number;
    impressions?: number;
    clicks?: number;
  }>;
  period?: string | { startDate: string; endDate: string };
}

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: AI_CONFIG.TIMEOUTS.REQUEST * 1000, // Converter para milissegundos
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

// Cache simples para respostas
const responseCache = new Map<string, { response: string; timestamp: number }>();

// Função para verificar se o erro é de quota/rate limit
const isQuotaOrRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  const errorType = error.type?.toLowerCase() || '';
  
  return (
    errorCode === 'insufficient_quota' ||
    errorType === 'insufficient_quota' ||
    errorCode === 'rate_limit_exceeded' ||
    errorType === 'rate_limit_exceeded' ||
    error.status === 429 ||
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit')
  );
};

// Função para converter mensagens OpenAI para formato Anthropic
const convertMessagesToAnthropic = (messages: any[]): { system?: string; messages: any[] } => {
  const systemMessage = messages.find(msg => msg.role === 'system');
  const userMessages = messages.filter(msg => msg.role !== 'system');
  
  return {
    system: systemMessage?.content,
    messages: userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  };
};

// Função para fazer requisição com fallback
const makeAIRequest = async (
  messages: any[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    useAdvancedModel?: boolean;
  } = {}
): Promise<string> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Primeiro, tentar OpenAI
  if (AI_CONFIG.FALLBACK.ENABLED) {
    try {
      const openaiModel = options.useAdvancedModel ? AI_CONFIG.ADVANCED_MODEL : AI_CONFIG.DEFAULT_MODEL;
      
      logOpenAIRequest({
        model: openaiModel,
        messages,
        requestId,
      });

      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages,
        max_tokens: options.maxTokens || AI_CONFIG.MAX_TOKENS.ANALYSIS,
        temperature: options.temperature || AI_CONFIG.TEMPERATURE.ANALYSIS,
      });

      logOpenAIResponse(response);
      
      const content = response.choices[0]?.message?.content;
      if (content) {
        return content;
      }
      
      throw new Error('Resposta vazia do OpenAI');
      
    } catch (error) {
      logOpenAIResponse(null, error);
      
      // Se for erro de quota/rate limit, usar fallback
      if (isQuotaOrRateLimitError(error)) {
        console.log('🔄 [FALLBACK] Usando Anthropic devido a erro de quota/rate limit do OpenAI');
        
        try {
          const anthropicModel = options.useAdvancedModel ? ANTHROPIC_CONFIG.ADVANCED_MODEL : ANTHROPIC_CONFIG.DEFAULT_MODEL;
          const { system, messages: anthropicMessages } = convertMessagesToAnthropic(messages);
          
          logAnthropicRequest({
            model: anthropicModel,
            messages: anthropicMessages,
            requestId,
          });

          const anthropicResponse = await anthropic.messages.create({
            model: anthropicModel,
            max_tokens: options.maxTokens || ANTHROPIC_CONFIG.MAX_TOKENS.ANALYSIS,
            temperature: options.temperature || AI_CONFIG.TEMPERATURE.ANALYSIS,
            system,
            messages: anthropicMessages,
          });

          logAnthropicResponse(anthropicResponse);
          
          const content = anthropicResponse.content[0]?.type === 'text' ? anthropicResponse.content[0]?.text : '';
          if (content) {
            return content;
          }
          
          throw new Error('Resposta vazia do Anthropic');
          
        } catch (anthropicError) {
          logAnthropicResponse(null, anthropicError);
          const errorMsg = error instanceof Error ? error.message : String(error);
          const anthropicErrorMsg = anthropicError instanceof Error ? anthropicError.message : String(anthropicError);
          throw new Error(`Falha em ambos os provedores de IA: OpenAI (${errorMsg}) e Anthropic (${anthropicErrorMsg})`);
        }
      }
      
      // Se não for erro de quota, relançar o erro original
      throw error;
    }
  } else {
    // Fallback desabilitado, usar apenas OpenAI
    const openaiModel = options.useAdvancedModel ? AI_CONFIG.ADVANCED_MODEL : AI_CONFIG.DEFAULT_MODEL;
    
    logOpenAIRequest({
      model: openaiModel,
      messages,
      requestId,
    });

    const response = await openai.chat.completions.create({
      model: openaiModel,
      messages,
      max_tokens: options.maxTokens || AI_CONFIG.MAX_TOKENS.ANALYSIS,
      temperature: options.temperature || AI_CONFIG.TEMPERATURE.ANALYSIS,
    });

    logOpenAIResponse(response);
    
    const content = response.choices[0]?.message?.content;
    if (content) {
      return content;
    }
    
    throw new Error('Resposta vazia do OpenAI');
  }
};

/**
 * Serviço de IA para integração com OpenAI e Anthropic (fallback)
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Testa a conexão com a OpenAI API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeAIRequest([
        {
          role: 'user',
          content: 'Responda apenas "OK" se você está funcionando.',
        },
      ], {
        maxTokens: 10,
        temperature: 0,
      });

      if (response.trim() === 'OK') {
        return { success: true, message: 'Conexão com IA estabelecida com sucesso' };
      } else {
        return { success: false, message: 'Resposta inesperada da API' };
      }
    } catch (error) {
      logger.error({
        msg: 'Erro ao testar conexão com IA',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return { 
        success: false, 
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }

  /**
   * Gera análise de performance em linguagem natural
   */
  async analyzePerformance(data: any, period: string = '7 dias'): Promise<string> {
    const cacheKey = `performance_${JSON.stringify(data)}_${period}`;
    
    // Verificar cache
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < AI_CONFIG.CACHE.TTL * 1000) {
      return cached.response;
    }

    try {
      const prompt = this.buildPerformancePrompt(data, period);
      
      const analysis = await makeAIRequest([
        {
          role: 'system',
          content: `Você é um especialista em marketing digital focado em campanhas de Lead Ads para o setor automotivo. 
          Analise os dados fornecidos e forneça insights úteis em português brasileiro. 
          Seja específico, acionável e use linguagem clara.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        maxTokens: AI_CONFIG.MAX_TOKENS.ANALYSIS,
        temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
      });
      
      // Salvar no cache
      responseCache.set(cacheKey, {
        response: analysis,
        timestamp: Date.now(),
      });

      return analysis;
    } catch (error) {
      logger.error({
        msg: 'Erro ao analisar performance',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Erro na análise de performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Detecta anomalias nos dados de campanhas
   */
  async detectAnomalies(data: any): Promise<Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>> {
    try {
      const prompt = this.buildAnomalyDetectionPrompt(data);
      
      const content = await makeAIRequest([
        {
          role: 'system',
          content: `Você é um especialista em detecção de fraudes e anomalias em campanhas de marketing digital.
          Analise os dados fornecidos e identifique padrões suspeitos ou anômalos.
          Responda em formato JSON com array de anomalias, cada uma contendo: type, description, severity (low/medium/high).`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        maxTokens: AI_CONFIG.MAX_TOKENS.INSIGHT,
        temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
      });
      
      try {
        const anomalies = JSON.parse(content);
        return Array.isArray(anomalies) ? anomalies : [];
      } catch (parseError) {
        logger.error({
          msg: 'Erro ao fazer parse das anomalias',
          error: parseError instanceof Error ? parseError.message : String(parseError),
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        return [];
      }
    } catch (error) {
      logger.error({
        msg: 'Erro ao detectar anomalias',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Erro na detecção de anomalias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Gera sugestões de otimização
   */
  async generateOptimizationSuggestions(data: any): Promise<Array<{ type: string; suggestion: string; expectedImpact: string }>> {
    try {
      const prompt = this.buildOptimizationPrompt(data);
      
      const content = await makeAIRequest([
        {
          role: 'system',
          content: `Você é um especialista em otimização de campanhas de marketing digital.
          Analise os dados fornecidos e sugira melhorias específicas e acionáveis.
          Responda em formato JSON com array de sugestões, cada uma contendo: type, suggestion, expectedImpact.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        maxTokens: AI_CONFIG.MAX_TOKENS.OPTIMIZATION,
        temperature: AI_CONFIG.TEMPERATURE.CREATIVE,
        useAdvancedModel: true, // Usar modelo avançado para otimizações
      });
      
      try {
        const suggestions = JSON.parse(content);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (parseError) {
        logger.error({
          msg: 'Erro ao fazer parse das sugestões',
          error: parseError instanceof Error ? parseError.message : String(parseError),
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        return [];
      }
    } catch (error) {
      logger.error({
        msg: 'Erro ao gerar sugestões',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Erro na geração de sugestões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Processa perguntas do chat
   */
  async processChatMessage(message: string, context: any = {}): Promise<string> {
    try {
      const prompt = this.buildChatPrompt(message, context);
      
      const response = await makeAIRequest([
        {
          role: 'system',
          content: `Você é um assistente virtual especializado em campanhas de marketing digital para o setor automotivo.
          Responda perguntas sobre performance, métricas, campanhas e otimizações.
          Use linguagem clara e profissional em português brasileiro.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        maxTokens: AI_CONFIG.MAX_TOKENS.CHAT,
        temperature: AI_CONFIG.TEMPERATURE.CHAT,
      });

      return response;
    } catch (error) {
      console.error('Erro ao processar mensagem do chat:', error);
      throw new Error(`Erro no processamento do chat: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Constrói prompt para análise de performance
   */
  private buildPerformancePrompt(data: PerformanceData, period: string): string {
    const campaigns = data.campaigns || [];
    const adsets = data.adsets || [];
    const ads = data.ads || [];
    
    let context = '';
    let dataSection = '';
    
    if (campaigns.length > 0) {
      context = 'campanha automotiva';
      dataSection = `CAMPANHA ANALISADA:\n${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL, ${c.impressions || 0} impressões, ${c.clicks || 0} cliques`).join('\n')}`;
    } else if (adsets.length > 0) {
      context = 'adset automotivo';
      dataSection = `ADSET ANALISADO:\n${adsets.map(a => `- ${a.adset_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
    } else if (ads.length > 0) {
      context = 'ad automotivo';
      dataSection = `AD ANALISADO:\n${ads.map(a => `- ${a.ad_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
    }

    return `
CONTEXTO AUTOMOTIVO - ANÁLISE DE PERFORMANCE

${dataSection}

PERÍODO ANALISADO: ${period}

BENCHMARKS AUTOMOTIVOS DE REFERÊNCIA:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

ANÁLISE ESPECÍFICA PARA ${context.toUpperCase()}:

1. **PERFORMANCE GERAL**
   - Avalie a eficiência dos investimentos
   - Compare com benchmarks do setor
   - Identifique pontos fortes e fracos

2. **QUALIDADE DOS LEADS**
   - Analise a taxa de conversão
   - Avalie o CPL em relação à categoria
   - Identifique possíveis problemas de qualidade

3. **OTIMIZAÇÕES SUGERIDAS**
   - Melhorias de segmentação
   - Ajustes de criativos
   - Otimizações de orçamento

4. **INSIGHTS ACIONÁVEIS**
   - Recomendações específicas
   - Próximos passos
   - Alertas importantes

Forneça uma análise detalhada, específica e acionável em português brasileiro.
`;
  }

  /**
   * Constrói prompt para detecção de anomalias
   */
  private buildAnomalyDetectionPrompt(data: any): string {
    return `
Analise os dados de campanhas para identificar possíveis anomalias ou padrões suspeitos:

Dados:
${JSON.stringify(data, null, 2)}

Procure por:
- Conversões manuais suspeitas
- Tráfego incentivado
- Taxas de conversão anormalmente altas
- Variações bruscas de performance
- Padrões que indicam fraude

Responda apenas em formato JSON válido.
`;
  }

  /**
   * Constrói prompt para otimização
   */
  private buildOptimizationPrompt(data: any): string {
    return `
Analise os dados de campanhas e sugira otimizações específicas:

Dados:
${JSON.stringify(data, null, 2)}

Sugira melhorias em:
- Segmentação de público
- Criativos e copies
- Distribuição de orçamento
- Timing de campanhas
- Estratégias de targeting

Cada sugestão deve ser específica e acionável.
Responda apenas em formato JSON válido.
`;
  }

  /**
   * Constrói prompt para chat
   */
  private buildChatPrompt(message: string, context: any): string {
    return `
Pergunta do usuário: "${message}"

Contexto adicional:
${JSON.stringify(context, null, 2)}

Responda de forma clara e útil, usando o contexto fornecido quando relevante.
`;
  }

  /**
   * Limpa o cache de respostas
   */
  clearCache(): void {
    responseCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: responseCache.size,
      entries: responseCache.size,
    };
  }

  /**
   * Analisa performance usando especificamente OpenAI
   */
  async analyzeWithOpenAIOnly(data: PerformanceData, period: string): Promise<string> {
    try {
      const prompt = this.buildPerformancePrompt(data, period);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em marketing digital focado em campanhas de Lead Ads para o setor automotivo. 
            Analise os dados fornecidos e forneça insights úteis em português brasileiro. 
            Seja específico, acionável e use linguagem clara e natural.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS.ANALYSIS,
        temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
      });

      return response.choices[0]?.message?.content || 'Não foi possível gerar análise.';
    } catch (error) {
      console.error('Erro ao analisar com OpenAI:', error);
      throw new Error('Falha ao analisar com OpenAI: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Analisa performance usando especificamente Anthropic
   */
  async analyzeWithAnthropicOnly(data: PerformanceData, period: string): Promise<string> {
    try {
      const prompt = this.buildPerformancePrompt(data, period);
      
      const response = await anthropic.messages.create({
        model: ANTHROPIC_CONFIG.DEFAULT_MODEL,
        max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS.ANALYSIS,
        temperature: ANTHROPIC_CONFIG.TEMPERATURE.ANALYSIS,
        messages: [
          {
            role: 'user',
            content: `Você é um especialista em marketing digital focado em campanhas de Lead Ads para o setor automotivo. 
            Analise os dados fornecidos e forneça insights úteis em português brasileiro. 
            Seja específico, acionável e use linguagem clara e natural.
            
            ${prompt}`,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0]?.text : '';
      return content || 'Não foi possível gerar análise.';
    } catch (error) {
      console.error('Erro ao analisar com Anthropic:', error);
      throw new Error('Falha ao analisar com Anthropic: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}

// Exportar instância singleton
export const aiService = AIService.getInstance();

// Funções de conveniência para compatibilidade com testes
export async function analyzePerformance(data: any, period: string = '7 dias'): Promise<{
  analysis: string;
  insights: Array<{ type: string; title: string; description: string; severity: string }>;
  recommendations: Array<{ type: string; suggestion: string; expectedImpact: string }>;
}> {
  const service = AIService.getInstance();
  const analysis = await service.analyzePerformance(data, period);
  const insights = await service.detectAnomalies(data);
  const recommendations = await service.generateOptimizationSuggestions(data);
  
  return {
    analysis,
    insights: insights.map(insight => ({
      type: insight.type,
      title: `Anomalia: ${insight.type}`,
      description: insight.description,
      severity: insight.severity.toUpperCase()
    })),
    recommendations: recommendations.map(rec => ({
      type: rec.type,
      suggestion: rec.suggestion,
      expectedImpact: rec.expectedImpact
    }))
  };
}

export async function generateInsights(data: any): Promise<Array<{ type: string; title: string; description: string; severity: string }>> {
  const service = AIService.getInstance();
  const anomalies = await service.detectAnomalies(data);
  
  return anomalies.map(insight => ({
    type: insight.type,
    title: `Insight: ${insight.type}`,
    description: insight.description,
    severity: insight.severity.toUpperCase()
  }));
} 