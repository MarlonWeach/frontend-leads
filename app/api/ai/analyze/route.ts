import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AI_CONFIG } from '../../../../src/lib/ai/config';
import { PerformancePrompts, PROMPT_CONFIG, PerformanceData } from '../../../../src/lib/ai/prompts';
import { logAIUsage, estimateTokens, calculateEstimatedCost } from '../../../../src/lib/ai/logger';

// Instanciar client OpenAI apenas no backend
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: AI_CONFIG.TIMEOUTS.REQUEST * 1000,
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

// Funções de análise movidas para dentro da rota
async function analyzePerformance(data: PerformanceData): Promise<string> {
  const campaigns = data.campaigns || [];
  const adsets = data.adsets || [];
  const ads = data.ads || [];
  
  let context = '';
  let dataSection = '';
  
  if (campaigns.length > 0) {
    context = 'campanha automotiva';
    dataSection = `CAMPANHA ANALISADA:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL, ${c.impressions || 0} impressões, ${c.clicks || 0} cliques`).join('\n')}`;
  } else if (adsets.length > 0) {
    context = 'adset automotivo';
    dataSection = `ADSET ANALISADO:
${adsets.map(a => `- ${a.adset_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  } else if (ads.length > 0) {
    context = 'ad automotivo';
    dataSection = `AD ANALISADO:
${ads.map(a => `- ${a.ad_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  }
  
  const prompt = `
CONTEXTO AUTOMOTIVO - ANÁLISE DE PERFORMANCE INDIVIDUAL

${dataSection}

BENCHMARKS AUTOMOTIVOS DE REFERÊNCIA:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

ANÁLISE ESPECÍFICA PARA ${context.toUpperCase()}:

Forneça uma análise detalhada em português brasileiro natural e conversacional:

1. **RESUMO EXECUTIVO** (2-3 frases)
   - Principais conquistas e desafios específicos desta ${context}
   - Comparação com benchmarks automotivos da categoria

2. **INSIGHTS PRINCIPAIS** (3-4 pontos)
   - O que está funcionando bem (test drives, leads qualificados)
   - O que precisa de atenção (CPL alto, baixa conversão)
   - Tendências observadas (sazonalidade, comportamento)

3. **ANÁLISE DETALHADA**
   - Performance específica desta ${context}
   - Comparação com benchmarks automotivos por categoria
   - Análise de qualidade de leads (score, red flags)
   - Padrões de gasto e eficiência

4. **RECOMENDAÇÕES ACIONÁVEIS** (3-5 sugestões)
   - Otimizações específicas para esta ${context}
   - Ajustes de segmentação por categoria de veículo
   - Melhorias de copy e criativos para test drive
   - Estratégias de qualificação de leads

Use linguagem específica do setor automotivo (test drive, concessionária, financiamento, etc.) e sempre compare com os benchmarks estabelecidos para a categoria apropriada.
`;
  
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
        content: `Você é um especialista em detecção de fraudes e anomalias em campanhas de marketing digital para o setor automotivo.
        Analise os dados fornecidos e identifique padrões suspeitos ou anômalos.
        Responda APENAS em formato JSON válido com array de anomalias, cada uma contendo: type, description, severity (low/medium/high).
        Não inclua texto adicional ou explicações fora do JSON.`,
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
    // Tentar extrair JSON se houver texto adicional
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    const anomalies = JSON.parse(jsonContent);
    return Array.isArray(anomalies) ? anomalies : [];
  } catch (parseError) {
    console.error('Erro ao fazer parse das anomalias:', parseError);
    console.error('Conteúdo recebido:', content);
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
        content: `Você é um especialista em otimização de campanhas de marketing digital para o setor automotivo.
        Analise os dados fornecidos e sugira melhorias específicas e acionáveis.
        Responda APENAS em formato JSON válido com array de sugestões, cada uma contendo: type, suggestion, expectedImpact.
        Não inclua texto adicional ou explicações fora do JSON.`,
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
    // Tentar extrair JSON se houver texto adicional
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    const suggestions = JSON.parse(jsonContent);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (parseError) {
    console.error('Erro ao fazer parse das sugestões:', parseError);
    console.error('Conteúdo recebido:', content);
    return [];
  }
}

async function generateInsights(data: PerformanceData): Promise<string> {
  const campaigns = data.campaigns || [];
  const adsets = data.adsets || [];
  const ads = data.ads || [];
  
  let context = '';
  let dataSection = '';
  
  if (campaigns.length > 0) {
    context = 'campanha';
    dataSection = `CAMPANHA ANALISADA:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL, ${c.impressions || 0} impressões, ${c.clicks || 0} cliques`).join('\n')}`;
  } else if (adsets.length > 0) {
    context = 'adset';
    dataSection = `ADSET ANALISADO:
${adsets.map(a => `- ${a.adset_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  } else if (ads.length > 0) {
    context = 'ad';
    dataSection = `AD ANALISADO:
${ads.map(a => `- ${a.ad_name || a.name}: ${a.leads || 0} leads, R$ ${a.spend || 0} gasto, ${a.ctr || 0}% CTR, R$ ${a.cpl || 0} CPL, ${a.impressions || 0} impressões, ${a.clicks || 0} cliques`).join('\n')}`;
  }
  
  const prompt = `
CONTEXTO AUTOMOTIVO - INSIGHTS DETALHADOS

${dataSection}

BENCHMARKS AUTOMOTIVOS:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

INSIGHTS ESPECÍFICOS PARA ${context.toUpperCase()}:

Forneça insights profundos e acionáveis em português brasileiro:

1. **ANÁLISE DE COMPORTAMENTO**
   - Padrões de engajamento e conversão
   - Horários de melhor performance
   - Segmentação de audiência mais eficaz

2. **QUALIDADE DE LEADS**
   - Score de qualidade dos leads gerados
   - Taxa de conversão para test drive
   - Red flags identificadas

3. **OPORTUNIDADES DE CRESCIMENTO**
   - Segmentações não exploradas
   - Criativos com potencial
   - Estratégias de expansão

4. **RISCO E MITIGAÇÃO**
   - Possíveis problemas identificados
   - Estratégias de proteção
   - Monitoramento recomendado

Use linguagem específica do setor automotivo e sempre compare com benchmarks estabelecidos.
`;
  
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um analista especializado em insights de marketing digital para o setor automotivo.
        Forneça insights profundos, acionáveis e específicos em português brasileiro.
        Seja detalhado mas mantenha a clareza.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: AI_CONFIG.MAX_TOKENS.INSIGHT,
    temperature: AI_CONFIG.TEMPERATURE.ANALYSIS,
  });

  return response.choices[0]?.message?.content || 'Não foi possível gerar insights.';
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
      case 'insights':
        result = await generateInsights(performanceData);
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

    // Converter period string para objeto date_range se necessário
    let dateRange;
    if (typeof performanceData.period === 'string') {
      // Se period é uma string, criar um objeto com startDate e endDate
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // Assumir últimos 7 dias como padrão
      
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
      analysisTypes: ['performance', 'trends', 'comparison', 'variations', 'efficiency', 'anomaly', 'optimization', 'insights']
    }
  });
} 