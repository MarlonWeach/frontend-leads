import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '../../../../src/lib/ai/aiService';
import { AI_CONFIG, PROMPT_CONFIG, FALLBACK_CONFIG } from '../../../../src/lib/ai/config';
import { checkOpenAIRateLimit, recordOpenAI429Error } from '../../../../src/utils/rateLimit';
import { logAIUsage, estimateTokens, calculateEstimatedCost } from '../../../../src/lib/ai/logger';

// Tipos para os dados de performance
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

// Enum para modelos disponíveis
enum AIModel {
  _AUTO = 'auto',
  _OPENAI = 'openai',
  _ANTHROPIC = 'anthropic'
}

// Constantes para usar nos cases
const AUTO = 'auto';
const OPENAI = 'openai';
const ANTHROPIC = 'anthropic';

// Função para análise usando o AIService com fallback
async function analyzeWithAI(
  data: PerformanceData, 
  analysisType: string,
  preferredModel: AIModel = AIModel._AUTO
): Promise<{ result: string; modelUsed: string; isFallback: boolean }> {
  try {
    // Se o modelo preferido for especificamente Anthropic, usar diretamente
    if (preferredModel === AIModel._ANTHROPIC) {
      const aiService = AIService.getInstance();
      
      // Forçar o uso do Anthropic
      const result = await aiService.analyzeWithAnthropicOnly(data, data.period?.toString() || '7 dias');
      
      return {
        result: result || 'Não foi possível gerar análise com Anthropic.',
        modelUsed: 'Claude 3.5 Haiku',
        isFallback: false
      };
    }
    
    // Se o modelo preferido for especificamente OpenAI, usar diretamente
    if (preferredModel === AIModel._OPENAI) {
      const aiService = AIService.getInstance();
      
      // Forçar o uso do OpenAI
      const result = await aiService.analyzeWithOpenAIOnly(data, data.period?.toString() || '7 dias');
      
      return {
        result: result || 'Não foi possível gerar análise com OpenAI.',
        modelUsed: 'OpenAI GPT-4o-mini',
        isFallback: false
      };
    }
    
    // Para análise de performance com modelo AUTO, usar o método existente do AIService (com fallback)
    if (analysisType === 'performance') {
      const aiService = AIService.getInstance();
      const result = await aiService.analyzePerformance(data, data.period?.toString() || '7 dias');
      
      return {
        result: result || 'Não foi possível gerar análise.',
        modelUsed: 'OpenAI GPT-4o-mini',
        isFallback: false
      };
    }
    
    // Para outros tipos de análise, usar resposta genérica
    const fallbackResponses: Record<string, string> = {
      trends: 'Análise de tendências: Com base nos dados fornecidos, observamos padrões consistentes de performance. Recomendamos monitoramento contínuo para identificar oportunidades de otimização.',
      comparison: 'Análise comparativa: Os dados mostram variações de performance entre diferentes elementos. Sugere-se focar nos elementos com melhor ROI.',
      variations: 'Análise de variações: Identificamos flutuações normais na performance. Recomendamos ajustes pontuais para manter estabilidade.',
      efficiency: 'Análise de eficiência: A eficiência atual está dentro dos parâmetros esperados. Há oportunidades de otimização de custos.',
      insights: 'Insights gerais: Os dados indicam performance estável com potencial de crescimento através de otimizações direcionadas.'
    };

    return {
      result: fallbackResponses[analysisType] || fallbackResponses.insights,
      modelUsed: 'Sistema de Fallback',
      isFallback: true
    };
  } catch (error) {
    console.error(`Erro na análise ${analysisType}:`, error);
    
    // Fallback para resposta estática
    const fallbackResponse = FALLBACK_CONFIG.FALLBACK_RESPONSES.PERFORMANCE.analysis;
    return {
      result: fallbackResponse,
      modelUsed: 'Sistema de Fallback',
      isFallback: true
    };
  }
}

// Função para detectar anomalias (retorna JSON)
async function detectAnomalies(data: PerformanceData, preferredModel: AIModel = AIModel._AUTO): Promise<{
  result: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  modelUsed: string;
  isFallback: boolean;
}> {
  try {
    const aiService = AIService.getInstance();
    const result = await aiService.detectAnomalies(data);

    return {
      result: Array.isArray(result) ? result : [],
      modelUsed: 'OpenAI GPT-4o-mini',
      isFallback: false
    };
  } catch (error) {
    console.error('Erro na detecção de anomalias:', error);
    return {
      result: [],
      modelUsed: 'Sistema de Fallback',
      isFallback: true
    };
  }
}

// Função para gerar sugestões de otimização (retorna JSON)
async function generateOptimizationSuggestions(data: PerformanceData, preferredModel: AIModel = AIModel._AUTO): Promise<{
  result: Array<{ type: string; suggestion: string; expectedImpact: string }>;
  modelUsed: string;
  isFallback: boolean;
}> {
  try {
    const aiService = AIService.getInstance();
    const result = await aiService.generateOptimizationSuggestions(data);

    return {
      result: Array.isArray(result) ? result : [],
      modelUsed: 'OpenAI GPT-4o-mini',
      isFallback: false
    };
  } catch (error) {
    console.error('Erro na geração de sugestões:', error);
    return {
      result: [],
      modelUsed: 'Sistema de Fallback',
      isFallback: true
    };
  }
}

// Funções auxiliares para construir prompts
function buildAnomalyDetectionPrompt(data: PerformanceData): string {
  const campaigns = data.campaigns || [];
  const adsets = data.adsets || [];
  const ads = data.ads || [];
  
  let dataSection = '';
  
  if (campaigns.length > 0) {
    dataSection = `CAMPANHAS ANALISADAS:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL, ${c.impressions || 0} impressões, ${c.clicks || 0} cliques`).join('\n')}`;
  } else if (adsets.length > 0) {
    dataSection = `ADSETS ANALISADOS:
${adsets.map(a => `- ${a.adset_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  } else if (ads.length > 0) {
    dataSection = `ADS ANALISADOS:
${ads.map(a => `- ${a.ad_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  }
  
  return `
CONTEXTO AUTOMOTIVO - DETECÇÃO DE ANOMALIAS

${dataSection}

ANÁLISE ESPECÍFICA PARA SETOR AUTOMOTIVO:

Identifique anomalias considerando benchmarks automotivos:
- CPL < R$ 15 (suspeita de fraude para econômicos)
- CPL < R$ 45 (suspeita para premium)
- Conversão > 40% (muito alta, verificar qualidade)
- CTR > 5% (muito alto, possível tráfego incentivado)
- Horários 2h-6h (menor intenção real)
- Dados genéricos nos leads

RED FLAGS ESPECÍFICAS:
1. Conversões suspeitas (muito altas ou muito baixas)
2. Tráfego anormal (picos inexplicados)
3. Variações inesperadas de performance
4. Possíveis fraudes ou bots
5. Padrões que indicam problemas de qualidade
6. CPL inconsistentes com categoria de veículo
7. Horários de conversão anômalos

Responda em formato JSON com array de anomalias, cada uma contendo:
{
  "type": "tipo da anomalia",
  "description": "descrição detalhada em português",
  "severity": "low/medium/high"
}
`;
}

function buildOptimizationPrompt(data: PerformanceData): string {
  const campaigns = data.campaigns || [];
  const adsets = data.adsets || [];
  const ads = data.ads || [];
  
  let dataSection = '';
  let context = '';
  
  if (campaigns.length > 0) {
    dataSection = `CAMPANHA ANALISADA:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL, ${c.impressions || 0} impressões, ${c.clicks || 0} cliques`).join('\n')}`;
    context = 'campanha';
  } else if (adsets.length > 0) {
    dataSection = `ADSET ANALISADO:
${adsets.map(a => `- ${a.adset_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
    context = 'adset';
  } else if (ads.length > 0) {
    dataSection = `AD ANALISADO:
${ads.map(a => `- ${a.ad_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
    context = 'ad';
  }
  
  return `
CONTEXTO AUTOMOTIVO - OTIMIZAÇÃO ESPECÍFICA

${dataSection}

BENCHMARKS AUTOMOTIVOS DE REFERÊNCIA:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

OTIMIZAÇÕES ESPECÍFICAS PARA ${context.toUpperCase()} AUTOMOTIVO:

1. **SEGMENTAÇÃO E AUDIÊNCIA**
   - Ajustes de idade, localização, interesses
   - Exclusões de audiências de baixa qualidade
   - Lookalike audiences baseadas em conversores

2. **CRIATIVOS E COPY**
   - Otimização de títulos para test drive
   - Melhoria de descrições e CTAs
   - A/B testing de diferentes abordagens

3. **ORÇAMENTO E LANCE**
   - Ajustes de bid strategy
   - Otimização de distribuição de verba
   - Configurações de delivery

4. **QUALIDADE DE LEADS**
   - Filtros de qualificação
   - Melhoria de formulário
   - Estratégias de qualificação

5. **TIMING E FREQUÊNCIA**
   - Horários de melhor performance
   - Controle de frequência
   - Sazonalidade automotiva

Responda em formato JSON com array de sugestões, cada uma contendo:
{
  "type": "categoria da otimização",
  "suggestion": "sugestão específica e acionável em português",
  "expectedImpact": "impacto esperado na performance"
}
`;
}

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let analysisType = 'performance'; // Valor padrão
  
  try {
    // Verificar rate limiting da OpenAI
    const rateLimitCheck = checkOpenAIRateLimit();
    if (rateLimitCheck.isLimited) {
      const waitTime = rateLimitCheck.resetTime ? Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000) : 60;
      return NextResponse.json(
        { 
          error: 'Rate limit excedido para OpenAI API',
          message: `${rateLimitCheck.reason}. Tente novamente em ${waitTime} segundos.`,
          retryAfter: waitTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': waitTime.toString()
          }
        }
      );
    }

    const body = await request.json();
    const { data, analysisType: requestedAnalysisType, model } = body;
    analysisType = requestedAnalysisType || 'performance';

    // Determinar modelo preferido
    let preferredModel = AIModel._AUTO;
    if (model === 'openai') {
      preferredModel = AIModel._OPENAI;
    } else if (model === 'anthropic') {
      preferredModel = AIModel._ANTHROPIC;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Dados de performance são obrigatórios' },
        { status: 400 }
      );
    }

    const performanceData: PerformanceData = data;

    let result: any;
    let modelUsed: string;
    let isFallback: boolean = false;
    let inputTokens = 0;
    let outputTokens = 0;
    
    switch (analysisType) {
      case 'performance':
      case 'trends':
      case 'comparison':
      case 'variations':
      case 'efficiency':
      case 'insights': {
        const analysisResult = await analyzeWithAI(performanceData, analysisType, preferredModel);
        result = analysisResult.result;
        modelUsed = analysisResult.modelUsed;
        isFallback = analysisResult.isFallback;
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(result);
        break;
      }
        
      case 'anomaly': {
        const anomalyResult = await detectAnomalies(performanceData, preferredModel);
        result = anomalyResult.result;
        modelUsed = anomalyResult.modelUsed;
        isFallback = anomalyResult.isFallback;
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(JSON.stringify(result));
        break;
      }
        
      case 'optimization': {
        const optimizationResult = await generateOptimizationSuggestions(performanceData, preferredModel);
        result = optimizationResult.result;
        modelUsed = optimizationResult.modelUsed;
        isFallback = optimizationResult.isFallback;
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(JSON.stringify(result));
        break;
      }
        
      default:
        return NextResponse.json(
          { error: 'Tipo de análise inválido' },
          { status: 400 }
        );
    }

    // Registrar uso da IA
    const campaignIds = (performanceData.campaigns?.map(c => c.id || c.campaign_id).filter(Boolean) as string[]) || [];
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens, AI_CONFIG.DEFAULT_MODEL);

    // Converter period string para objeto date_range se necessário
    let dateRange;
    if (typeof performanceData.period === 'string') {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      
      dateRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    } else {
      dateRange = performanceData.period;
    }

    await logAIUsage({
      analysis_type: analysisType === 'anomaly' ? 'anomalies' : 
                    analysisType === 'optimization' ? 'optimization' : 
                    analysisType === 'insights' ? 'performance' : 'performance',
      campaign_ids: campaignIds,
      date_range: dateRange,
      tokens_used: totalTokens,
      cost_estimated: estimatedCost,
      model_used: modelUsed,
      status: 'completed',
      metadata: {
        analysis_type: analysisType,
        campaigns_count: performanceData.campaigns?.length || 0,
        period: performanceData.period,
        preferred_model: model || 'auto',
        is_fallback: isFallback
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      modelUsed,
      isFallback,
      timestamp: new Date().toISOString(),
      usage: {
        tokens: totalTokens,
        estimatedCost: estimatedCost
      }
    });

  } catch (error) {
    console.error('Erro na análise de IA:', error);
    
    // Tratar erro 429 da OpenAI especificamente
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      recordOpenAI429Error();
      
      if (FALLBACK_CONFIG.ENABLE_FALLBACK) {
        console.log('🔄 Usando fallback devido a quota excedida');
        
        let fallbackResponse;
        if (analysisType === 'variations') {
          fallbackResponse = FALLBACK_CONFIG.FALLBACK_RESPONSES.PERFORMANCE.variations;
        } else {
          fallbackResponse = FALLBACK_CONFIG.FALLBACK_RESPONSES.PERFORMANCE.analysis;
        }
        
        return NextResponse.json({
          success: true,
          data: fallbackResponse,
          modelUsed: 'Sistema de Fallback',
          isFallback: true,
          reason: 'Quota da OpenAI excedida - usando resposta de fallback'
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Limite de quota da OpenAI excedido',
          message: 'Você excedeu sua quota atual da OpenAI. Verifique seu plano e detalhes de cobrança.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno na análise de IA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de análise de IA disponível',
    endpoints: {
      POST: '/api/ai/analyze - Análise de performance com IA',
      analysisTypes: ['performance', 'trends', 'comparison', 'variations', 'efficiency', 'anomaly', 'optimization', 'insights'],
      models: ['auto', 'openai', 'anthropic']
    }
  });
} 