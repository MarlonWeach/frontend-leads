import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

const CACHE_TTL = 5 * 60; // 5 minutos

const createSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 0
      }
    }
  });
};

const aggregateMetaLeads = (insight: any): number => {
  const leadsFromResults = Array.isArray(insight.results)
    ? insight.results.reduce((acc: number, result: { indicator?: string; values?: Array<{ value?: string }> }) => {
        if (!result?.indicator?.toLowerCase().includes('lead')) return acc;
        return acc + (Number(result?.values?.[0]?.value) || 0);
      }, 0)
    : 0;

  const leadsFromActions = Array.isArray(insight.actions)
    ? insight.actions.reduce((acc: number, action: { action_type?: string; value?: string }) => {
        if (!action?.action_type?.toLowerCase().includes('lead')) return acc;
        return acc + (Number(action?.value) || 0);
      }, 0)
    : 0;

  return Math.max(leadsFromResults, leadsFromActions);
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
    `https://graph.facebook.com/v23.0/${normalizedAccountId}/insights?fields=date_start,spend,impressions,clicks,actions,results&time_range=${timeRange}&time_increment=1&limit=500`;

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
  const supabase = createSupabaseClient();
  if (!supabase) {
    return fetchPeriodDataFromMeta(startDate, endDate, campaignIds);
  }
  // CORREÇÃO CRÍTICA: Usar adset_insights ao invés de campaign_insights
  // Esta é a mesma tabela que as APIs /api/performance e /api/performance/forecast usam
      const query = supabase
    .from('adset_insights')
    .select(`
      adset_id,
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

  // Agrupar dados por data para ter métricas diárias agregadas
  const dailyData: { [date: string]: any } = {};
  
  (insights || []).forEach(insight => {
    const date = insight.date;
    if (!dailyData[date]) {
      dailyData[date] = {
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0
      };
    }
    
    dailyData[date].leads += Number(insight.leads) || 0;
    dailyData[date].spend += Number(insight.spend) || 0;
    dailyData[date].impressions += Number(insight.impressions) || 0;
    dailyData[date].clicks += Number(insight.clicks) || 0;
  });

  // Converter para formato de campanhas (simulando uma campanha agregada)
  const campaignData: CampaignData[] = Object.keys(dailyData).map(date => {
    const dayData = dailyData[date];
    const leads = dayData.leads;
    const spend = dayData.spend;
    const impressions = dayData.impressions;
    const clicks = dayData.clicks;
    
    // Calcular métricas derivadas
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    
    return {
      campaign_id: 'aggregated',
      campaign_name: `Dados Agregados - ${date}`,
      date: date,
      leads,
      spend,
      impressions,
      clicks,
      ctr: Number(ctr.toFixed(2)),
      cpl: Number(cpl.toFixed(2))
    };
  });

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

    // Verificar cache primeiro
    const cacheKey = generateCacheKey(startDate!, endDate!, granularity, campaignIds);
    const cached = await serverCache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit para comparisons: ${cacheKey}`);
      return NextResponse.json(cached);
    }

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

    // Cachear resultado
    await serverCache.set(cacheKey, response, CACHE_TTL);
    console.log(`💾 Resultado cacheado: ${cacheKey}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de comparações:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
} 