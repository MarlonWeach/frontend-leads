import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

import { 
  calculateComparisons, 
  calculatePreviousPeriod, 
  calculateAggregatedMetrics,
  assessDataQuality,
  generateCacheKey,
  PeriodCalculationData
} from '../../../../src/utils/comparisonAnalysis';
import { ComparisonResponse, CampaignData } from '../../../../src/types/comparisons';
import { serverCache } from '../../../../src/utils/server-cache';

const CACHE_TTL = 0; // Desabilitado temporariamente para evitar divergências por stale cache no heatmap

const aggregateMetaLeads = (insight: any): number => {
  const actionRows = Array.isArray(insight.actions) ? insight.actions : [];
  const preferredAction = actionRows.find(
    (action: { action_type?: string }) => action?.action_type === 'onsite_conversion.lead_grouped'
  );
  if (preferredAction) {
    return Number(preferredAction.value) || 0;
  }

  const resultRows = Array.isArray(insight.results) ? insight.results : [];
  const preferredResult = resultRows.find(
    (result: { indicator?: string }) => String(result?.indicator || '').toLowerCase() === 'leads'
  );
  if (preferredResult) {
    return Number(preferredResult?.values?.[0]?.value) || 0;
  }

  const fallbackAction = actionRows.find(
    (action: { action_type?: string }) => String(action?.action_type || '').toLowerCase().includes('lead')
  );
  return fallbackAction ? Number(fallbackAction.value) || 0 : 0;
};

const fetchPeriodDataFromMeta = async (
  startDate: string,
  endDate: string,
  _campaignIds?: string[]
): Promise<PeriodCalculationData> => {
  const metaAccessToken =
    process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const metaAccountId =
    process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID || '';

  if (!metaAccessToken || !metaAccountId) {
    return { campaigns: [], metrics: calculateAggregatedMetrics([]) };
  }

  const normalizedAccountId = metaAccountId.startsWith('act_')
    ? metaAccountId
    : `act_${metaAccountId}`;
  const timeRange = encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }));

  const dailyData: Record<string, { leads: number; spend: number; impressions: number; clicks: number }> = {};

  let nextUrl: string | null =
    `https://graph.facebook.com/v25.0/${normalizedAccountId}/insights?fields=date_start,spend,impressions,clicks,actions,results&time_range=${timeRange}&time_increment=1&limit=500`;

  while (nextUrl) {
    const insightsRes: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${metaAccessToken}` }
    });
    const payload = await insightsRes.json();
    if (!insightsRes.ok) {
      throw new Error(payload?.error?.message || 'Erro ao buscar insights da Meta');
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    rows.forEach((insight: any) => {
      const date = insight.date_start || insight.date || startDate;
      if (!dailyData[date]) {
        dailyData[date] = { leads: 0, spend: 0, impressions: 0, clicks: 0 };
      }
      dailyData[date].spend += Number(insight.spend) || 0;
      dailyData[date].impressions += Number(insight.impressions) || 0;
      dailyData[date].clicks += Number(insight.clicks) || 0;
      dailyData[date].leads += aggregateMetaLeads(insight);
    });

    nextUrl = payload?.paging?.next || null;
  }

  const campaigns: CampaignData[] = Object.keys(dailyData)
    .sort()
    .map(date => {
      const dayData = dailyData[date];
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      const cpl = dayData.leads > 0 ? dayData.spend / dayData.leads : 0;
      return {
        campaign_id: 'aggregated',
        campaign_name: `Dados Agregados - ${date}`,
        date,
        leads: dayData.leads,
        spend: dayData.spend,
        impressions: dayData.impressions,
        clicks: dayData.clicks,
        ctr: Number(ctr.toFixed(2)),
        cpl: Number(cpl.toFixed(2))
      };
    });

  return {
    campaigns,
    metrics: calculateAggregatedMetrics(campaigns)
  };
};

/**
 * Busca dados de performance para um período específico
 */
const fetchPeriodData = async (
  startDate: string,
  endDate: string,
  campaignIds?: string[]
): Promise<PeriodCalculationData> => {
  // CORREÇÃO CRÍTICA: Usar adset_insights ao invés de campaign_insights
  // Esta é a mesma tabela que as APIs /api/performance e /api/performance/forecast usam
      const query = supabase
    .from('adset_insights')
    .select(`
      adset_id,
      campaign_id,
      date,
      leads,
      spend,
      impressions,
      clicks
    `)
    .gte('date', startDate)
    .lte('date', endDate);

  // Nota: Filtro por campaign não pode ser aplicado diretamente pois adset_insights 
  // não tem campaign_id. Seria necessário fazer JOIN ou buscar todos os dados.
  // Por enquanto, vamos buscar todos os dados para garantir funcionamento.

  const { data: insights, error } = await query;

  if (error) {
    if (error.message?.includes('fetch failed')) {
      return fetchPeriodDataFromMeta(startDate, endDate, campaignIds);
    }
    throw new Error(`Erro ao buscar dados do período: ${error.message}`);
  }

  const adsetIds = Array.from(
    new Set((insights || []).map((insight: { adset_id?: string }) => insight.adset_id).filter(Boolean))
  ) as string[];

  const adsetToCampaignMap = new Map<string, string>();
  const campaignNameMap = new Map<string, string>();

  if (adsetIds.length > 0) {
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id,campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      throw new Error(`Erro ao mapear adsets para campanhas: ${adsetsError.message}`);
    }

    const mappedCampaignIds = Array.from(
      new Set((adsets || []).map((adset: { campaign_id?: string }) => adset.campaign_id).filter(Boolean))
    ) as string[];

    (adsets || []).forEach((adset: { id: string; campaign_id?: string }) => {
      if (adset.campaign_id) {
        adsetToCampaignMap.set(adset.id, adset.campaign_id);
      }
    });

    if (mappedCampaignIds.length > 0) {
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id,name')
        .in('id', mappedCampaignIds);

      if (campaignsError) {
        throw new Error(`Erro ao mapear nomes de campanhas: ${campaignsError.message}`);
      }

      (campaigns || []).forEach((campaign: { id: string; name?: string }) => {
        campaignNameMap.set(campaign.id, campaign.name || campaign.id);
      });
    }
  }

  const groupedByDateCampaign = new Map<string, {
    campaign_id: string;
    campaign_name: string;
    date: string;
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
  }>();

  (insights || []).forEach((insight: {
    adset_id?: string;
    campaign_id?: string;
    date: string;
    leads?: number | string;
    spend?: number | string;
    impressions?: number | string;
    clicks?: number | string;
  }) => {
    // Priorizar campaign_id histórico persistido no insight para evitar perda de dados
    // quando adset/campaign estiver inativo ou ausente na tabela adsets.
    const campaignId = insight.campaign_id || (insight.adset_id ? adsetToCampaignMap.get(insight.adset_id) : undefined);
    if (!campaignId) return;
    if (campaignIds?.length && !campaignIds.includes(campaignId)) return;

    const key = `${insight.date}::${campaignId}`;
    if (!groupedByDateCampaign.has(key)) {
      groupedByDateCampaign.set(key, {
        campaign_id: campaignId,
        campaign_name: campaignNameMap.get(campaignId) || campaignId,
        date: insight.date,
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0
      });
    }

    const entry = groupedByDateCampaign.get(key)!;
    entry.leads += Number(insight.leads) || 0;
    entry.spend += Number(insight.spend) || 0;
    entry.impressions += Number(insight.impressions) || 0;
    entry.clicks += Number(insight.clicks) || 0;
  });

  const campaignData: CampaignData[] = Array.from(groupedByDateCampaign.values())
    .map(entry => {
      const ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
      const cpl = entry.leads > 0 ? entry.spend / entry.leads : 0;

      return {
        ...entry,
        ctr: Number(ctr.toFixed(2)),
        cpl: Number(cpl.toFixed(2))
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const metrics = calculateAggregatedMetrics(campaignData);

  return {
    campaigns: campaignData,
    metrics
  };
};

/**
 * Valida parâmetros de entrada
 */
const validateParams = (
  startDate: string | null,
  endDate: string | null
): { isValid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      error: 'Parâmetros startDate e endDate são obrigatórios'
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      error: 'Formato de data inválido. Use YYYY-MM-DD'
    };
  }

  if (start > end) {
    return {
      isValid: false,
      error: 'Data de início deve ser anterior ou igual à data de fim'
    };
  }

  return { isValid: true };
};

/**
 * Endpoint GET para comparações de performance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'campaign';
    const campaignIdsParam = searchParams.get('campaignIds');
    
    // Validar parâmetros
    const validation = validateParams(startDate, endDate);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Processar campaignIds se fornecido
    const campaignIds = campaignIdsParam 
      ? campaignIdsParam.split(',').map(id => id.trim())
      : undefined;

    // Cache desabilitado para garantir reconciliação fiel após backfills
    const cacheKey = generateCacheKey(startDate!, endDate!, granularity, campaignIds);

    console.log(`🔍 Comparisons API: Buscando dados para ${startDate} até ${endDate}`);

    // Calcular período anterior
    const previousPeriod = calculatePreviousPeriod(startDate!, endDate!);
    
    console.log(`📊 Período anterior calculado: ${previousPeriod.start} até ${previousPeriod.end}`);

    // Buscar dados dos dois períodos
    const [currentData, previousData] = await Promise.all([
      fetchPeriodData(startDate!, endDate!, campaignIds),
      fetchPeriodData(previousPeriod.start, previousPeriod.end, campaignIds)
    ]);

    console.log(`📈 Dados período atual: ${currentData.campaigns.length} campanhas`);
    console.log(`📉 Dados período anterior: ${previousData.campaigns.length} campanhas`);

    // Calcular comparações
    const comparisons = calculateComparisons(currentData, previousData);
    const dataQuality = assessDataQuality(currentData, previousData);

    const response: ComparisonResponse = {
      success: true,
      data: {
        current: {
          period: { start: startDate!, end: endDate! },
          metrics: currentData.metrics,
          campaigns: currentData.campaigns
        },
        previous: {
          period: previousPeriod,
          metrics: previousData.metrics,
          campaigns: previousData.campaigns
        },
        comparisons: comparisons,
        metadata: {
          totalCampaigns: currentData.campaigns.length,
          granularity,
          generatedAt: new Date().toISOString(),
          dataQuality
        }
      }
    };

    if (CACHE_TTL > 0) {
      await serverCache.set(cacheKey, response, CACHE_TTL);
      console.log(`💾 Resultado cacheado: ${cacheKey}`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de comparações:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
} 