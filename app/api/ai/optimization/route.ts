import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OptimizationEngine, CampaignData } from '../../../../src/lib/ai/optimizationEngine';
import { logAIUsage, estimateTokens, calculateEstimatedCost } from '../../../../src/lib/ai/logger';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateRange, campaignIds, type } = body;

    // Buscar dados das campanhas
    let campaignQuery = supabase
      .from('campaigns')
      .select('id, name, status');

    // Filtrar campanhas por período se fornecido
    if (dateRange?.startDate && dateRange?.endDate) {
      campaignQuery = campaignQuery
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }

    // Filtrar por campanhas específicas se fornecido
    if (campaignIds && campaignIds.length > 0) {
      campaignQuery = campaignQuery.in('id', campaignIds);
    }

    const { data: campaigns, error: campaignError } = await campaignQuery;

    if (campaignError) {
      console.error('Erro ao buscar campanhas:', campaignError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados das campanhas', details: campaignError.message },
        { status: 500 }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        suggestions: [],
        summary: {
          totalSuggestions: 0,
          highImpact: 0,
          mediumImpact: 0,
          lowImpact: 0,
          averageConfidence: 0,
          estimatedTotalROI: 0
        },
        benchmarks: {
          avgCTR: 0,
          avgCPL: 0,
          avgConversionRate: 0
        }
      });
    }

    // Buscar métricas de performance da meta_leads
    let metricsQuery = supabase
      .from('meta_leads')
      .select('campaign_name, spend, impressions, clicks, lead_count, created_time');

    // Filtrar métricas por período se fornecido
    if (dateRange?.startDate && dateRange?.endDate) {
      metricsQuery = metricsQuery
        .gte('created_time', dateRange.startDate)
        .lte('created_time', dateRange.endDate);
    }

    const { data: metrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Erro ao buscar métricas:', metricsError);
    }

    // Agregar métricas por campanha
    const campaignMetrics = new Map();
    
    if (metrics) {
      metrics.forEach(metric => {
        const campaignName = metric.campaign_name;
        if (!campaignMetrics.has(campaignName)) {
          campaignMetrics.set(campaignName, {
            spend: 0,
            impressions: 0,
            clicks: 0,
            leads: 0
          });
        }
        
        const current = campaignMetrics.get(campaignName);
        current.spend += Number(metric.spend) || 0;
        current.impressions += Number(metric.impressions) || 0;
        current.clicks += Number(metric.clicks) || 0;
        current.leads += Number(metric.lead_count) || 0;
      });
    }

    // Converter dados para formato esperado pelo OptimizationEngine
    const campaignData: CampaignData[] = campaigns.map(campaign => {
      const metrics = campaignMetrics.get(campaign.name) || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0
      };

      const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      const cpl = metrics.leads > 0 ? metrics.spend / metrics.leads : 0;
      const conversionRate = metrics.clicks > 0 ? (metrics.leads / metrics.clicks) * 100 : 0;

      return {
        campaign_id: campaign.id,
        name: campaign.name || 'Nome não disponível',
        status: campaign.status || 'UNKNOWN',
        spend: metrics.spend,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        leads: metrics.leads,
        ctr: ctr,
        cpl: cpl,
        conversion_rate: conversionRate,
        created_time: new Date().toISOString()
      };
    });

    // Gerar otimizações usando IA
    const optimizationEngine = new OptimizationEngine(campaignData);
    const analysis = await optimizationEngine.generateOptimizations();

    // Registrar uso da IA
    const inputTokens = estimateTokens(JSON.stringify(campaignData));
    const outputTokens = estimateTokens(JSON.stringify(analysis));
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens);

    await logAIUsage({
      analysis_type: 'optimization',
      campaign_ids: campaignIds || campaigns.map(c => c.id),
      date_range: dateRange,
      tokens_used: totalTokens,
      cost_estimated: estimatedCost,
      model_used: 'gpt-4',
      status: 'completed',
      metadata: {
        optimization_type: type,
        suggestions_generated: analysis.suggestions.length,
        campaigns_analyzed: campaignData.length
      }
    });

    // Log para debugging
    console.log(`Geradas ${analysis.suggestions.length} sugestões de otimização`);

    return NextResponse.json({
      ...analysis,
      usage: {
        tokens: totalTokens,
        estimatedCost: estimatedCost
      }
    });

  } catch (error) {
    console.error('Erro na API de otimização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, action } = body;

    if (action === 'apply') {
      // Aplicar sugestão
      const optimizationEngine = new OptimizationEngine([]);
      const result = await optimizationEngine.applySuggestion(suggestionId);
      
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Ação não suportada' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao aplicar sugestão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 