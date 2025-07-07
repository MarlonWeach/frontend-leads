import { NextRequest, NextResponse } from 'next/server';
import { detectAnomalies, getDetectionConfig } from '../../../../src/lib/ai/anomalyDetection';
import { createClient } from '@supabase/supabase-js';
import { logAIUsage, estimateTokens, calculateEstimatedCost } from '../../../../src/lib/ai/logger';
import { checkOpenAIRateLimit, recordOpenAI429Error } from '../../../../src/utils/rateLimit';
import { FALLBACK_CONFIG } from '../../../../src/lib/ai/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const { 
      dateRange, 
      sensitivity = 'medium',
      campaignIds
    } = await request.json();

    // Validação de entrada
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return NextResponse.json(
        { error: 'Período de data é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados de campanhas do Supabase
    const campaignData = await fetchCampaignData(dateRange, campaignIds);
    
    if (!campaignData || campaignData.length === 0) {
      return NextResponse.json({
        anomalies: [],
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        message: 'Nenhum dado encontrado para o período selecionado'
      });
    }

    // Detectar anomalias
    const config = getDetectionConfig(sensitivity);
    const anomalies = await detectAnomalies(campaignData, config);

    // Salvar anomalias no banco (apenas as novas)
    if (anomalies.length > 0) {
      await saveAnomalies(anomalies);
    }

    // Registrar uso da IA
    const inputTokens = estimateTokens(JSON.stringify(campaignData));
    const outputTokens = estimateTokens(JSON.stringify(anomalies));
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens);

    await logAIUsage({
      analysis_type: 'anomalies',
      campaign_ids: campaignIds || [],
      date_range: dateRange,
      tokens_used: totalTokens,
      cost_estimated: estimatedCost,
      model_used: 'gpt-4',
      status: 'completed',
      metadata: {
        sensitivity,
        anomalies_found: anomalies.length,
        campaigns_analyzed: campaignData.length
      }
    });

    // Calcular resumo
    const summary = {
      total: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
      high: anomalies.filter(a => a.severity === 'HIGH').length,
      medium: anomalies.filter(a => a.severity === 'MEDIUM').length,
      low: anomalies.filter(a => a.severity === 'LOW').length
    };

    return NextResponse.json({
      anomalies,
      summary,
      config: {
        sensitivity,
        totalCampaigns: campaignData.length,
        dateRange
      },
      usage: {
        tokens: totalTokens,
        estimatedCost: estimatedCost
      }
    });

  } catch (error) {
    console.error('Erro na detecção de anomalias:', error);
    
    // Tratar erro 429 da OpenAI especificamente
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      // Registrar erro 429 para ativar cooldown
      recordOpenAI429Error();
      
      // Se fallback está habilitado, retornar resposta mock
      if (FALLBACK_CONFIG.ENABLE_FALLBACK) {
        console.log('🔄 Usando fallback para anomalias devido a quota excedida');
        
        return NextResponse.json({
          anomalies: [],
          summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
          message: FALLBACK_CONFIG.FALLBACK_RESPONSES.ANOMALY.detection,
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
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');

    let query = supabase
      .from('ai_anomalies')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq('severity', severity.toUpperCase());
    }

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      anomalies: data || [],
      pagination: {
        limit,
        offset,
        total: data?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar anomalias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Funções auxiliares
async function fetchCampaignData(dateRange: any, campaignIds?: string[]) {
  try {
    let query = supabase
      .from('adset_insights')
      .select(`
        adset_id,
        campaign_id,
        date,
        leads,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        cpl,
        reach,
        frequency
      `)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    if (campaignIds && campaignIds.length > 0) {
      query = query.in('campaign_id', campaignIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de adset_insights:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro na consulta de adset_insights:', error);
    return [];
  }
}

async function saveAnomalies(anomalies: any[]) {
  try {
    const anomaliesToSave = anomalies.map(anomaly => ({
      id: anomaly.id,
      type: anomaly.type,
      severity: anomaly.severity,
      title: anomaly.title,
      description: anomaly.description,
      confidence: anomaly.confidence,
      affected_campaigns: anomaly.affectedCampaigns,
      metrics: anomaly.metrics,
      recommendations: anomaly.recommendations,
      resolved: false,
      created_at: anomaly.detectedAt.toISOString()
    }));

    const { error } = await supabase
      .from('ai_anomalies')
      .upsert(anomaliesToSave, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Erro ao salvar anomalias:', error);
    }
  } catch (error) {
    console.error('Erro ao processar anomalias para salvamento:', error);
  }
} 