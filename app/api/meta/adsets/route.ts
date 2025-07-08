import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../src/utils/logger';

// Inicializa o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

// Constantes para validação
const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED'];
const MAX_LIMIT = 1000;

async function handleRequest(request: NextRequest, isPost: boolean) {
  const startTime = Date.now();
  
  try {
    // Ler os parâmetros de filtro da requisição
    let campaignId, status, startDate, endDate, limit;

    if (isPost) {
      const body = await request.json();
      campaignId = body.campaignId;
      status = body.status;
      startDate = body.startDate;
      endDate = body.endDate;
      limit = body.limit || 100;
    } else {
      const searchParams = request.nextUrl.searchParams;
      campaignId = searchParams.get('campaignId');
      status = searchParams.get('status');
      startDate = searchParams.get('startDate');
      endDate = searchParams.get('endDate');
      limit = parseInt(searchParams.get('limit') || '100');
    }

    // Validação de parâmetros
    if (limit > MAX_LIMIT) {
      logger.warn({ limit, maxLimit: MAX_LIMIT }, 'Limit excedeu o máximo permitido, ajustando.');
      limit = MAX_LIMIT;
    }

    if (status && !VALID_STATUSES.includes(status)) {
      logger.warn({ status, validStatuses: VALID_STATUSES }, 'Status inválido fornecido.');
      status = null;
    }

    logger.info({
      msg: 'Requisição para buscar adsets do Supabase',
      method: isPost ? 'POST' : 'GET',
      campaignId,
      status,
      startDate,
      endDate,
      limit
    });

    // Se há filtro de data, usar a tabela de insights diários
    if (startDate || endDate) {
      return await handleRequestWithDateFilter(campaignId, status, startDate, endDate, limit, startTime);
    } else {
      return await handleRequestWithoutDateFilter(campaignId, status, limit, startTime);
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    logger.error({
      msg: `Erro na rota /api/meta/adsets (${isPost ? 'POST' : 'GET'})`,
      error: error.message,
      code: error.code,
      responseTime,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Erro interno no servidor',
        details: error.message,
        responseTime
      },
      { status: 500 }
    );
  }
}

// Função para buscar adsets com filtro de data usando insights diários
async function handleRequestWithDateFilter(campaignId: string | null, status: string | null, startDate: string | null, endDate: string | null, limit: number, startTime: number) {
  logger.info({ startDate, endDate }, 'Usando filtro de data com insights diários');

  // Primeiro, buscar insights agregados por adset
  let insightsQuery = supabase
    .from('adset_insights')
    .select(`
      adset_id,
      adset_name,
      date,
      spend,
      impressions,
      clicks,
      ctr,
      cpc,
      cpm,
      leads,
      reach,
      frequency,
      unique_clicks,
      unique_ctr,
      unique_link_clicks,
      unique_link_clicks_ctr,
      social_spend,
      social_impressions,
      social_clicks,
      social_reach,
      social_frequency,
      social_unique_clicks,
      social_unique_link_clicks
    `)
    .limit(limit);

  // Aplicar filtros de data
  if (startDate) {
    insightsQuery = insightsQuery.gte('date', startDate);
    logger.debug({ startDate }, 'Filtro por data inicial aplicado.');
  }
  
  if (endDate) {
    insightsQuery = insightsQuery.lte('date', endDate);
    logger.debug({ endDate }, 'Filtro por data final aplicado.');
  }

  // Filtrar apenas registros com métricas > 0
  insightsQuery = insightsQuery.or('spend.gt.0,impressions.gt.0,clicks.gt.0,leads.gt.0');

  // Executar a query de insights
  const { data: insightsData, error: insightsError } = await insightsQuery;

  if (insightsError) {
    logger.error({ 
      error: insightsError.message, 
      code: insightsError.code,
      details: insightsError.details,
      hint: insightsError.hint 
    }, 'Erro ao buscar insights de adsets do Supabase.');
    throw insightsError;
  }

  logger.debug({ insightsCount: insightsData?.length }, 'Insights encontrados');

  if (!insightsData || insightsData.length === 0) {
    const responseTime = Date.now() - startTime;
    logger.info({ 
      count: 0,
      responseTime,
      filters: { campaignId, status, startDate, endDate, limit }
    }, 'Nenhum insight encontrado para o período.');
    
    return NextResponse.json({ 
      adsets: [],
      meta: {
        count: 0,
        responseTime,
        filters: { campaignId, status, startDate, endDate, limit },
        dataSource: 'adset_insights'
      }
    });
  }

  // Extrair IDs únicos de adsets
  const adsetIds = Array.from(new Set(insightsData.map(insight => insight.adset_id)));
  
  // Buscar dados dos adsets
  const { data: adsetsData, error: adsetsError } = await supabase
    .from('adsets')
    .select(`
      id,
      name,
      status,
      effective_status,
      created_time,
      campaign_id,
      daily_budget,
      lifetime_budget,
      start_time,
      end_time,
      targeting,
      optimization_goal,
      billing_event,
      last_synced
    `)
    .in('id', adsetIds);

  if (adsetsError) {
    logger.error({ 
      error: adsetsError.message, 
      code: adsetsError.code,
      details: adsetsError.details,
      hint: adsetsError.hint 
    }, 'Erro ao buscar dados dos adsets do Supabase.');
    throw adsetsError;
  }

  // Criar mapa de adsets para lookup rápido
  const adsetsMap = new Map();
  adsetsData?.forEach(adset => {
    adsetsMap.set(adset.id, adset);
  });

  // Agregar métricas por adset
  const adsetMetrics = new Map();

  insightsData.forEach(insight => {
    const adsetId = insight.adset_id;
    const adset = adsetsMap.get(adsetId);
    
    if (!adset) {
      logger.warn({ adsetId }, 'Adset não encontrado para insight');
      return;
    }
    
    if (!adsetMetrics.has(adsetId)) {
      adsetMetrics.set(adsetId, {
        ...adset,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        reach: 0,
        frequency: 0,
        unique_clicks: 0,
        unique_link_clicks: 0,
        social_spend: 0,
        social_impressions: 0,
        social_clicks: 0,
        social_reach: 0,
        social_unique_clicks: 0,
        social_unique_link_clicks: 0,
        days_with_data: 0
      });
    }

    const metrics = adsetMetrics.get(adsetId);
    metrics.spend += parseFloat(insight.spend || 0);
    metrics.impressions += parseInt(insight.impressions || 0);
    metrics.clicks += parseInt(insight.clicks || 0);
    metrics.leads += parseInt(insight.leads || 0);
    metrics.reach += parseInt(insight.reach || 0);
    metrics.frequency += parseFloat(insight.frequency || 0);
    metrics.unique_clicks += parseInt(insight.unique_clicks || 0);
    metrics.unique_link_clicks += parseInt(insight.unique_link_clicks || 0);
    metrics.social_spend += parseFloat(insight.social_spend || 0);
    metrics.social_impressions += parseInt(insight.social_impressions || 0);
    metrics.social_clicks += parseInt(insight.social_clicks || 0);
    metrics.social_reach += parseInt(insight.social_reach || 0);
    metrics.social_unique_clicks += parseInt(insight.social_unique_clicks || 0);
    metrics.social_unique_link_clicks += parseInt(insight.social_unique_link_clicks || 0);
    metrics.days_with_data += 1;
  });

  // Converter para array e aplicar filtros adicionais
  let adsets = Array.from(adsetMetrics.values());

  // Buscar nomes das campanhas
  const campaignIds = Array.from(new Set(adsets.map(a => a.campaign_id)));
  const campaignNamesMap = new Map();
  if (campaignIds.length > 0) {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds);
    if (!campaignsError && campaignsData) {
      campaignsData.forEach(c => campaignNamesMap.set(c.id, c.name));
    }
  }

  // Aplicar filtros de campanha e status
  if (campaignId) {
    adsets = adsets.filter(adset => adset.campaign_id === campaignId);
    logger.debug({ campaignId }, 'Filtro por campanha aplicado.');
  }
  
  if (status) {
    adsets = adsets.filter(adset => adset.status === status);
    logger.debug({ status }, 'Filtro por status aplicado.');
  }

  // Calcular métricas derivadas e adicionar campaign_name
  adsets = adsets.map(adset => {
    const ctr = adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0;
    const cpc = adset.clicks > 0 ? adset.spend / adset.clicks : 0;
    const cpm = adset.impressions > 0 ? (adset.spend / adset.impressions) * 1000 : 0;
    const avgFrequency = adset.days_with_data > 0 ? adset.frequency / adset.days_with_data : 0;
    return {
      ...adset,
      campaign_name: campaignNamesMap.get(adset.campaign_id) || adset.campaign_id,
      ctr: parseFloat(ctr.toFixed(4)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2)),
      frequency: parseFloat(avgFrequency.toFixed(2))
    };
  });

  // Ordenar por gasto (maior primeiro)
  adsets.sort((a, b) => b.spend - a.spend);

  const responseTime = Date.now() - startTime;
  
  logger.info({ 
    count: adsets.length,
    responseTime,
    filters: { campaignId, status, startDate, endDate, limit }
  }, 'Adsets com insights diários buscados com sucesso do Supabase.');

  return NextResponse.json({ 
    adsets: adsets,
    meta: {
      count: adsets.length,
      responseTime,
      filters: { campaignId, status, startDate, endDate, limit },
      dataSource: 'adset_insights'
    }
  });
}

// Função para buscar adsets sem filtro de data (comportamento original)
async function handleRequestWithoutDateFilter(campaignId: string | null, status: string | null, limit: number, startTime: number) {
  logger.info('Usando busca sem filtro de data (métricas agregadas)');

  // Construir a query para o Supabase
  let query = supabase
    .from('adsets')
    .select(`
      id,
      name,
      status,
      effective_status,
      created_time,
      campaign_id,
      daily_budget,
      lifetime_budget,
      start_time,
      end_time,
      targeting,
      optimization_goal,
      billing_event,
      spend,
      impressions,
      clicks,
      ctr,
      cpc,
      cpm,
      leads,
      last_synced
    `)
    .limit(limit);

  // Aplicar filtros
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
    logger.debug({ campaignId }, 'Filtro por campanha aplicado.');
  }
  
  if (status) {
    query = query.eq('status', status);
    logger.debug({ status }, 'Filtro por status aplicado.');
  }
  
  // Ordenar por data de criação para consistência
  query = query.order('created_time', { ascending: false });

  // Executar a query
  const { data: adsets, error } = await query;

  if (error) {
    logger.error({ 
      error: error.message, 
      code: error.code,
      details: error.details,
      hint: error.hint 
    }, 'Erro ao buscar adsets do Supabase.');
    throw error;
  }

  const responseTime = Date.now() - startTime;
  
  logger.info({ 
    count: adsets?.length || 0,
    responseTime,
    filters: { campaignId, status, limit }
  }, 'Adsets buscados com sucesso do Supabase.');

  return NextResponse.json({ 
    adsets: adsets || [],
    meta: {
      count: adsets?.length || 0,
      responseTime,
      filters: { campaignId, status, limit },
      dataSource: 'adsets_aggregated'
    }
  });
}

export async function POST(request: NextRequest) {
  return handleRequest(request, true);
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
} 