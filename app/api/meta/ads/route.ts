import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../src/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // 1. Buscar todos os ad_insights no período
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
      `);
    if (startDate && endDate) {
      insightsQuery = insightsQuery.gte('date', startDate).lte('date', endDate);
    }
    const { data: insightsData, error: insightsError } = await insightsQuery;
    if (insightsError) {
      logger.error({ error: insightsError }, 'Erro ao buscar insights de ads');
      throw new Error(`Erro ao buscar insights de ads: ${insightsError.message}`);
    }
    if (!insightsData || insightsData.length === 0) {
      return NextResponse.json({ ads: [], meta: { count: 0, responseTime: Date.now() - startTime } });
    }

    // 2. Agrupar métricas por ad_id
    const metricsByAd: Record<string, any> = {};
    for (const insight of insightsData) {
      if (!metricsByAd[insight.ad_id]) {
        metricsByAd[insight.ad_id] = {
          ad_id: insight.ad_id,
          spend: 0,
          impressions: 0,
          clicks: 0,
          reach: 0,
          leads: 0,
          dates: [],
        };
      }
      metricsByAd[insight.ad_id].spend += parseFloat(insight.spend || 0);
      metricsByAd[insight.ad_id].impressions += parseInt(insight.impressions || 0);
      metricsByAd[insight.ad_id].clicks += parseInt(insight.clicks || 0);
      metricsByAd[insight.ad_id].reach += parseInt(insight.reach || 0);
      metricsByAd[insight.ad_id].leads += parseInt(insight.leads || 0);
      metricsByAd[insight.ad_id].dates.push(insight.date);
    }
    const adIds = Object.keys(metricsByAd).slice(0, limit);

    // 3. Buscar identificação dos ads
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status, campaign_id, adset_id')
      .in('ad_id', adIds);
    if (adsError) {
      logger.error({ error: adsError }, 'Erro ao buscar dados dos ads');
      throw new Error(`Erro ao buscar dados dos ads: ${adsError.message}`);
    }
    const adsMap = new Map();
    adsData?.forEach(ad => adsMap.set(ad.ad_id, ad));

    // 4. Montar resposta final
    const adsWithMetrics = adIds.map(ad_id => {
      const ad = adsMap.get(ad_id) || { ad_id, name: '', status: '', campaign_id: null, adset_id: null };
      const m = metricsByAd[ad_id];
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      const cpc = m.clicks > 0 ? m.spend / m.clicks : 0;
      const cpm = m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0;
      const cpl = m.leads > 0 ? m.spend / m.leads : 0;
      return {
        ad_id: ad.ad_id,
        name: ad.name,
        status: ad.status,
        campaign_id: ad.campaign_id,
        adset_id: ad.adset_id,
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        reach: m.reach,
        leads: m.leads,
        ctr,
        cpc,
        cpm,
        cpl,
        dates: m.dates
      };
    });

    return NextResponse.json({
      ads: adsWithMetrics,
      meta: {
        count: adsWithMetrics.length,
        responseTime: Date.now() - startTime
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Erro interno na rota /api/meta/ads');
    return NextResponse.json({ error: 'Erro interno no servidor', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleRequest(request, true);
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
} 