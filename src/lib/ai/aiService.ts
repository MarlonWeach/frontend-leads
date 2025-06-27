import OpenAI from 'openai';
import { AI_CONFIG, AIModel, PERFORMANCE_ANALYSIS_CONFIG } from './config';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: AI_CONFIG.TIMEOUTS.REQUEST * 1000, // Converter para milissegundos
});

// Cache simples para respostas
const responseCache = new Map<string, { response: string; timestamp: number }>();

/**
 * Serviço de IA para integração com OpenAI
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
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
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Responda apenas "OK" se você está funcionando.',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      const message = response.choices[0]?.message?.content?.trim();
      
      if (message === 'OK') {
        return { success: true, message: 'Conexão com OpenAI estabelecida com sucesso' };
      } else {
        return { success: false, message: 'Resposta inesperada da API' };
      }
    } catch (error) {
      console.error('Erro ao testar conexão com OpenAI:', error);
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
      const prompt = this.buildPerformanceAnalysisPrompt(data, period);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
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
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS.ANALYSIS,
        temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
      });

      const analysis = response.choices[0]?.message?.content || 'Não foi possível gerar análise.';
      
      // Salvar no cache
      responseCache.set(cacheKey, {
        response: analysis,
        timestamp: Date.now(),
      });

      return analysis;
    } catch (error) {
      console.error('Erro ao analisar performance:', error);
      throw new Error(`Erro na análise de performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Detecta anomalias nos dados de campanhas
   */
  async detectAnomalies(data: any): Promise<Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>> {
    try {
      const prompt = this.buildAnomalyDetectionPrompt(data);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
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
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS.INSIGHT,
        temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
      });

      const content = response.choices[0]?.message?.content || '[]';
      
      try {
        const anomalies = JSON.parse(content);
        return Array.isArray(anomalies) ? anomalies : [];
      } catch (parseError) {
        console.error('Erro ao fazer parse das anomalias:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Erro ao detectar anomalias:', error);
      throw new Error(`Erro na detecção de anomalias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Gera sugestões de otimização
   */
  async generateOptimizationSuggestions(data: any): Promise<Array<{ type: string; suggestion: string; expectedImpact: string }>> {
    try {
      const prompt = this.buildOptimizationPrompt(data);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
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
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS.OPTIMIZATION,
        temperature: AI_CONFIG.TEMPERATURE.CREATIVE,
      });

      const content = response.choices[0]?.message?.content || '[]';
      
      try {
        const suggestions = JSON.parse(content);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (parseError) {
        console.error('Erro ao fazer parse das sugestões:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      throw new Error(`Erro na geração de sugestões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Processa perguntas do chat
   */
  async processChatMessage(message: string, context: any = {}): Promise<string> {
    try {
      const prompt = this.buildChatPrompt(message, context);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages: [
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
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS.CHAT,
        temperature: AI_CONFIG.TEMPERATURE.CHAT,
      });

      return response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
    } catch (error) {
      console.error('Erro ao processar mensagem do chat:', error);
      throw new Error(`Erro no processamento do chat: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Constrói prompt para análise de performance
   */
  private buildPerformanceAnalysisPrompt(data: any, period: string): string {
    return `
Analise os dados de performance das campanhas para o período de ${period}:

Dados:
${JSON.stringify(data, null, 2)}

Forneça uma análise em português brasileiro que inclua:
1. Resumo geral da performance
2. Principais tendências identificadas
3. Pontos de atenção (se houver)
4. Insights acionáveis

Seja específico e use os números fornecidos na análise.
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
}

// Exportar instância singleton
export const aiService = AIService.getInstance(); 