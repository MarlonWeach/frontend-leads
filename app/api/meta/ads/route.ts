import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../src/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

async function handleRequest(request: NextRequest, isPost: boolean) {
  const startTime = Date.now();
  
  try {
    let body: any = {};
    
    if (isPost) {
      body = await request.json();
    } else {
      const searchParams = request.nextUrl.searchParams;
      body = {
        campaignId: searchParams.get('campaignId'),
        adsetId: searchParams.get('adsetId'),
        status: searchParams.get('status'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        limit: parseInt(searchParams.get('limit') || '1000')
      };
    }

    const {
      campaignId = null,
      adsetId = null,
      status = 'ACTIVE',
      startDate = null,
      endDate = null,
      limit = 1000
    } = body;

    logger.info({
      msg: 'Requisição para buscar ads do Supabase (apenas ad_insights)',
      method: isPost ? 'POST' : 'GET',
      campaignId,
      adsetId,
      status,
      startDate,
      endDate,
      limit
    });

    // Sempre usar ad_insights como fonte
    return await handleRequestWithDateFilter(campaignId, adsetId, status, startDate, endDate, limit, startTime, true);

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    logger.error({
      msg: `Erro na rota /api/meta/ads (${isPost ? 'POST' : 'GET'})`,
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

// Ajuste: sempre usar ad_insights, mesmo sem filtro de data
async function handleRequestWithDateFilter(
  campaignId: string | null,
  adsetId: string | null,
  status: string | null,
  startDate: string | null,
  endDate: string | null,
  limit: number,
  startTime: number,
  forceAllDates = false
) {
  logger.info({ startDate, endDate, forceAllDates }, 'Usando filtro de data com insights diários (ad_insights)');

  // Se não houver filtro de data, buscar tudo (limitado)
  let insightsQuery = supabase
    .from('ad_insights')
    .select(`
      ad_id,
      date,
      spend,
      impressions,
      clicks,
      ctr,
      cpc,
      cpm,
      reach,
      frequency,
      leads
    `)
    .limit(limit);

  if (startDate && endDate) {
    insightsQuery = insightsQuery.gte('date', startDate).lte('date', endDate);
  } else if (forceAllDates) {
    // Se não houver filtro, buscar tudo (limitado)
  }

  const { data: insightsData, error: insightsError } = await insightsQuery;

  if (insightsError) {
    logger.error({ error: insightsError }, 'Erro ao buscar insights diários de ads do Supabase');
    throw new Error(`Erro ao buscar insights diários de ads do Supabase: ${insightsError.message}`);
  }

  if (!insightsData || insightsData.length === 0) {
    logger.info('Nenhum insight encontrado para o período especificado');
    return NextResponse.json({
      ads: [],
      meta: {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalLeads: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageCPM: 0,
        count: 0,
        responseTime: Date.now() - startTime,
        filters: { campaignId, adsetId, status, startDate, endDate, limit },
        dataSource: 'ad_insights'
      }
    });
  }

  // Agrupar insights por ad_id
  const insightsByAd = insightsData.reduce((acc, insight) => {
    if (!acc[insight.ad_id]) {
      acc[insight.ad_id] = [];
    }
    acc[insight.ad_id].push(insight);
    return acc;
  }, {} as Record<string, any[]>);

  // Buscar dados dos ads
  const adIds = Object.keys(insightsByAd);
  const { data: adsData, error: adsError } = await supabase
    .from('ads')
    .select(`
      ad_id,
      name,
      status,
      campaign_id,
      adset_id,
      creative
    `)
    .in('ad_id', adIds)
    .eq('status', status || 'ACTIVE');

  if (adsError) {
    logger.error({ error: adsError }, 'Erro ao buscar dados dos ads do Supabase');
    throw new Error(`Erro ao buscar dados dos ads do Supabase: ${adsError.message}`);
  }

  // Buscar nomes de campanhas e adsets para enriquecer os dados
  const campaignIds = Array.from(new Set(adsData?.map(ad => ad.campaign_id).filter(Boolean) || []));
  const adsetIds = Array.from(new Set(adsData?.map(ad => ad.adset_id).filter(Boolean) || []));

  const campaignNamesMap = new Map();
  const adsetNamesMap = new Map();

  if (campaignIds.length > 0) {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds);
    if (!campaignsError && campaignsData) {
      campaignsData.forEach(c => campaignNamesMap.set(c.id, c.name));
    }
  }

  if (adsetIds.length > 0) {
    const { data: adsetsData, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, name')
      .in('id', adsetIds);
    if (!adsetsError && adsetsData) {
      adsetsData.forEach(a => adsetNamesMap.set(a.id, a.name));
    }
  }

  // Combinar dados dos ads com insights agregados
  const adsWithInsights = adsData?.map(ad => {
    const adInsights = insightsByAd[ad.ad_id] || [];
    // Calcular métricas agregadas
    const aggregatedInsights = adInsights.reduce((acc, insight) => {
      acc.spend += parseFloat(insight.spend || 0);
      acc.impressions += parseInt(insight.impressions || 0);
      acc.clicks += parseInt(insight.clicks || 0);
      acc.reach += parseInt(insight.reach || 0);
      acc.leads += parseInt(insight.leads || 0); // Somar leads se existir
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0 });
    // Calcular métricas derivadas
    const ctr = aggregatedInsights.impressions > 0 ? (aggregatedInsights.clicks / aggregatedInsights.impressions) * 100 : 0;
    const cpc = aggregatedInsights.clicks > 0 ? aggregatedInsights.spend / aggregatedInsights.clicks : 0;
    const cpm = aggregatedInsights.impressions > 0 ? (aggregatedInsights.spend / aggregatedInsights.impressions) * 1000 : 0;
    return {
      id: ad.ad_id,
      name: ad.name,
      status: ad.status,
      adset_id: ad.adset_id,
      adset_name: adsetNamesMap.get(ad.adset_id) || null,
      campaign_id: ad.campaign_id,
      campaign_name: campaignNamesMap.get(ad.campaign_id) || null,
      creative: {
        type: ad.creative?.type || 'TEXT',
        images: ad.creative?.images || [],
        video: ad.creative?.video || null,
        text: ad.creative?.text || ad.creative?.body || ad.creative?.description || 'Texto do anúncio não disponível',
        slideshow: ad.creative?.slideshow || null,
        title: ad.creative?.title || ad.name || 'Anúncio',
        description: ad.creative?.description || ad.creative?.body || '',
        linkUrl: ad.creative?.link_url || null,
        linkTitle: ad.creative?.link_title || null,
        linkDescription: ad.creative?.link_description || null,
        linkImageUrl: ad.creative?.link_image_url || null,
        thumbnail_url: ad.creative?.thumbnail_url || ad.creative?.image_url || null,
        image_url: ad.creative?.image_url || null
      },
      spend: aggregatedInsights.spend,
      impressions: aggregatedInsights.impressions,
      clicks: aggregatedInsights.clicks,
      reach: aggregatedInsights.reach,
      ctr: ctr,
      cpc: cpc,
      cpm: cpm,
      leads: aggregatedInsights.leads
    };
  }) || [];

  // Calcular métricas agregadas totais
  const totalMetrics = adsWithInsights.reduce((acc, ad) => {
    acc.totalSpend += ad.spend;
    acc.totalImpressions += ad.impressions;
    acc.totalClicks += ad.clicks;
    acc.totalLeads += ad.leads;
    return acc;
  }, { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalLeads: 0 });

  const averageCTR = totalMetrics.totalImpressions > 0 ? (totalMetrics.totalClicks / totalMetrics.totalImpressions) * 100 : 0;
  const averageCPC = totalMetrics.totalClicks > 0 ? totalMetrics.totalSpend / totalMetrics.totalClicks : 0;
  const averageCPM = totalMetrics.totalImpressions > 0 ? (totalMetrics.totalSpend / totalMetrics.totalImpressions) * 1000 : 0;

  const responseTime = Date.now() - startTime;
  logger.info({ 
    count: adsWithInsights.length, 
    responseTime, 
    filters: { campaignId, adsetId, status, startDate, endDate, limit } 
  }, 'Ads buscados com sucesso do Supabase com filtro de data (ad_insights).');

  return NextResponse.json({
    ads: adsWithInsights,
    meta: {
      totalSpend: totalMetrics.totalSpend,
      totalImpressions: totalMetrics.totalImpressions,
      totalClicks: totalMetrics.totalClicks,
      totalLeads: totalMetrics.totalLeads,
      averageCTR,
      averageCPC,
      averageCPM,
      count: adsWithInsights.length,
      responseTime,
      filters: { campaignId, adsetId, status, startDate, endDate, limit },
      dataSource: 'ad_insights'
    }
  });
}

export async function POST(request: NextRequest) {
  return handleRequest(request, true);
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
} 