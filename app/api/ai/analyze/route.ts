import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AI_CONFIG } from '../../../../src/lib/ai/config';
import { PerformancePrompts, PROMPT_CONFIG, PerformanceData } from '../../../../src/lib/ai/prompts';
import { logAIUsage, estimateTokens, calculateEstimatedCost } from '../../../../src/lib/ai/logger';

// Instanciar client OpenAI apenas no backend
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: AI_CONFIG.TIMEOUTS.REQUEST * 1000,
});

// Funções de análise movidas para dentro da rota
async function analyzePerformance(data: PerformanceData): Promise<string> {
  const prompt = PerformancePrompts.buildPerformanceAnalysisPrompt(data, data.period || '7 dias');
  
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
    max_tokens: PROMPT_CONFIG.MAX_TOKENS.PERFORMANCE,
    temperature: PROMPT_CONFIG.TEMPERATURE.PERFORMANCE,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar análise.';
}

async function analyzeTrends(data: PerformanceData): Promise<string> {
  const prompt = PerformancePrompts.buildTrendAnalysisPrompt(data, data.period || '7 dias');
  
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um analista de dados especializado em identificar tendências e padrões em campanhas de marketing digital.
        Analise os dados fornecidos e identifique tendências temporais, padrões cíclicos e projeções futuras.
        Use linguagem clara e acionável em português brasileiro.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: PROMPT_CONFIG.MAX_TOKENS.TREND,
    temperature: PROMPT_CONFIG.TEMPERATURE.TREND,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar análise de tendências.';
}

async function compareCampaigns(data: PerformanceData): Promise<string> {
  const prompt = PerformancePrompts.buildCampaignComparisonPrompt(data);
  
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em análise comparativa de campanhas de marketing digital.
        Compare as campanhas fornecidas e identifique diferenças significativas, fatores de sucesso e oportunidades de otimização.
        Use linguagem objetiva e acionável em português brasileiro.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: PROMPT_CONFIG.MAX_TOKENS.COMPARISON,
    temperature: PROMPT_CONFIG.TEMPERATURE.COMPARISON,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar comparação entre campanhas.';
}

async function analyzeVariations(data: PerformanceData): Promise<string> {
  const prompt = PerformancePrompts.buildVariationAnalysisPrompt(data, data.period || '7 dias');
  
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em análise de variações e mudanças em campanhas de marketing digital.
        Identifique variações significativas nos dados fornecidos, explique possíveis causas e sugira ações corretivas.
        Use linguagem clara e acionável em português brasileiro.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: PROMPT_CONFIG.MAX_TOKENS.VARIATION,
    temperature: PROMPT_CONFIG.TEMPERATURE.VARIATION,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar análise de variações.';
}

async function analyzeEfficiency(data: PerformanceData): Promise<string> {
  const prompt = PerformancePrompts.buildEfficiencyAnalysisPrompt(data);
  
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em análise de eficiência e ROI de campanhas de marketing digital.
        Analise a eficiência das campanhas fornecidas, identifique oportunidades de otimização de custos e melhoria de ROI.
        Use linguagem técnica mas acessível em português brasileiro.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: PROMPT_CONFIG.MAX_TOKENS.EFFICIENCY,
    temperature: PROMPT_CONFIG.TEMPERATURE.EFFICIENCY,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar análise de eficiência.';
}

async function detectAnomalies(data: PerformanceData): Promise<Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>> {
  const prompt = buildAnomalyDetectionPrompt(data);
  
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
}

async function generateOptimizationSuggestions(data: PerformanceData): Promise<Array<{ type: string; suggestion: string; expectedImpact: string }>> {
  const prompt = buildOptimizationPrompt(data);
  
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
}

// Funções auxiliares para construir prompts
function buildAnomalyDetectionPrompt(data: PerformanceData): string {
  const campaigns = data.campaigns || [];
  
  return `
Analise os dados das campanhas para detectar anomalias e padrões suspeitos:

${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL`).join('\n')}

Identifique:
1. Conversões suspeitas (muito altas ou muito baixas)
2. Tráfego anormal
3. Variações inesperadas de performance
4. Possíveis fraudes ou bots
5. Padrões que indicam problemas de qualidade

Responda em JSON com array de anomalias.
`;
}

function buildOptimizationPrompt(data: PerformanceData): string {
  const campaigns = data.campaigns || [];
  
  return `
Analise os dados das campanhas para sugerir otimizações:

${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL`).join('\n')}

Sugira otimizações específicas para:
1. Melhorar CTR
2. Reduzir CPL
3. Aumentar conversões
4. Otimizar segmentação
5. Ajustar orçamentos

Responda em JSON com array de sugestões.
`;
}

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, analysisType } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Dados de performance são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se temos a chave da API
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    const performanceData: PerformanceData = data;

    let result;
    let inputTokens = 0;
    let outputTokens = 0;
    
    switch (analysisType) {
      case 'performance':
        result = await analyzePerformance(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'trends':
        result = await analyzeTrends(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'comparison':
        result = await compareCampaigns(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'variations':
        result = await analyzeVariations(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'efficiency':
        result = await analyzeEfficiency(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'anomaly':
        result = await detectAnomalies(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      case 'optimization':
        result = await generateOptimizationSuggestions(performanceData);
        inputTokens = estimateTokens(JSON.stringify(performanceData));
        outputTokens = estimateTokens(typeof result === 'string' ? result : JSON.stringify(result));
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de análise inválido' },
          { status: 400 }
        );
    }

    // Registrar uso da IA
    const campaignIds = performanceData.campaigns?.map(c => c.id || c.campaign_id).filter(Boolean) || [];
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens, AI_CONFIG.DEFAULT_MODEL);

    await logAIUsage({
      analysis_type: analysisType === 'anomaly' ? 'anomalies' : 
                    analysisType === 'optimization' ? 'optimization' : 'performance',
      campaign_ids: campaignIds,
      date_range: performanceData.dateRange,
      tokens_used: totalTokens,
      cost_estimated: estimatedCost,
      model_used: AI_CONFIG.DEFAULT_MODEL,
      status: 'completed',
      metadata: {
        analysis_type: analysisType,
        campaigns_count: performanceData.campaigns?.length || 0,
        period: performanceData.period
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      usage: {
        tokens: totalTokens,
        estimatedCost: estimatedCost
      }
    });

  } catch (error) {
    console.error('Erro na análise de IA:', error);
    
    // Tratar erro de quota da OpenAI
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Limite de quota da OpenAI excedido. Tente novamente mais tarde.',
          details: 'Você excedeu sua quota atual da OpenAI. Verifique seu plano e detalhes de cobrança.'
        },
        { status: 429 }
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
      analysisTypes: ['performance', 'trends', 'comparison', 'variations', 'efficiency', 'anomaly', 'optimization']
    }
  });
} 