// API de Performance usando relacionamentos entre tabelas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MetaCampaignsService } from '../../../src/services/meta/campaigns';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

function createEmptyResponse(page: number, limit: number) {
  return NextResponse.json({
    campaigns: [],
    metrics: {
      totalLeads: 0,
      totalSpend: 0,
      averageCTR: 0,
      averageCPL: 0,
      averageROI: 0,
      totalImpressions: 0,
      totalClicks: 0
    },
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0
    }
  });
}

async function buildMetaPerformanceResponse(
  page: number,
  limit: number,
  status: string,
  startDate: string,
  endDate: string
) {
  const metaAccessToken =
    process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const metaAccountId =
    process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID || '';

  if (!metaAccessToken || !metaAccountId) {
    return createEmptyResponse(page, limit);
  }

  const campaignsService = new MetaCampaignsService({
    accessToken: metaAccessToken,
    accountId: metaAccountId
  });

  const allCampaigns = await campaignsService.getCampaigns();
  const filteredCampaigns =
    status === 'ALL' ? allCampaigns : allCampaigns.filter(campaign => campaign.status === status);

  const campaignsWithMetrics = await Promise.all(
    filteredCampaigns.map(async campaign => {
      try {
        const insights = await campaignsService.getCampaignInsights(campaign.id, startDate, endDate);
        const aggregated = (insights || []).reduce(
          (
            acc: { leads: number; spend: number; impressions: number; clicks: number },
            insight: {
              spend?: string | number;
              impressions?: string | number;
              clicks?: string | number;
              results?: Array<{ indicator?: string; values?: Array<{ value?: string }> }>;
              actions?: Array<{ action_type?: string; value?: string }>;
            }
          ) => {
            acc.spend += Number(insight.spend) || 0;
            acc.impressions += Number(insight.impressions) || 0;
            acc.clicks += Number(insight.clicks) || 0;

            const leadsFromResults = Array.isArray(insight.results)
              ? insight.results.reduce(
                  (
                    resultAcc: number,
                    result: { indicator?: string; values?: Array<{ value?: string }> }
                  ) => {
                    if (!result?.indicator?.toLowerCase().includes('lead')) {
                      return resultAcc;
                    }
                    const resultValue = Number(result?.values?.[0]?.value) || 0;
                    return resultAcc + resultValue;
                  },
                  0
                )
              : 0;
            const leadsFromActions = Array.isArray(insight.actions)
              ? insight.actions.reduce(
                  (
                    actionAcc: number,
                    action: { action_type?: string; value?: string }
                  ) => {
                    if (!action?.action_type?.toLowerCase().includes('lead')) {
                      return actionAcc;
                    }
                  const actionValue = Number(action?.value) || 0;
                  return actionAcc + actionValue;
                  },
                  0
                )
              : 0;

            acc.leads += Math.max(leadsFromResults, leadsFromActions);
            return acc;
          },
          { leads: 0, spend: 0, impressions: 0, clicks: 0 }
        );

        const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
        const cpl = aggregated.leads > 0 ? aggregated.spend / aggregated.leads : 0;
        const roi = aggregated.spend > 0 ? (aggregated.leads * 100) / aggregated.spend : 0;

        return {
          id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          leads: aggregated.leads,
          spend: aggregated.spend,
          impressions: aggregated.impressions,
          clicks: aggregated.clicks,
          ctr: Math.round(ctr * 100) / 100,
          cpl: Math.round(cpl * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          data_start_date: startDate,
          data_end_date: endDate
        };
      } catch {
        return {
          id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          leads: 0,
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpl: 0,
          roi: 0,
          data_start_date: startDate,
          data_end_date: endDate
        };
      }
    })
  );

  const totalLeads = campaignsWithMetrics.reduce((sum, campaign) => sum + campaign.leads, 0);
  const totalSpend = campaignsWithMetrics.reduce((sum, campaign) => sum + campaign.spend, 0);
  const totalImpressions = campaignsWithMetrics.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const totalClicks = campaignsWithMetrics.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const averageROI = totalSpend > 0 ? (totalLeads * 100) / totalSpend : 0;

  const total = campaignsWithMetrics.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedCampaigns = campaignsWithMetrics.slice(offset, offset + limit);

  return NextResponse.json({
    campaigns: paginatedCampaigns,
    metrics: {
      totalLeads,
      totalSpend,
      averageCTR: Math.round(averageCTR * 100) / 100,
      averageCPL: Math.round(averageCPL * 100) / 100,
      averageROI: Math.round(averageROI * 100) / 100,
      totalImpressions,
      totalClicks
    },
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'ALL';
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const offset = (page - 1) * limit;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return createEmptyResponse(page, limit);
    }

    // Criar cliente Supabase sem realtime para evitar warning de critical dependency
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
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

    // Se não há filtro de data, aplicar filtro padrão dos últimos 7 dias
    if (!startDate || !endDate) {
      // CORREÇÃO CRÍTICA: Usar timezone São Paulo para evitar offset de datas
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6); // 7 dias incluindo hoje
      
      // Converter para timezone São Paulo para manter consistência
      const { formatInTimeZone } = require('date-fns-tz');
      const SAO_PAULO_TZ = 'America/Sao_Paulo';
      
      startDate = formatInTimeZone(sevenDaysAgo, SAO_PAULO_TZ, 'yyyy-MM-dd');
      endDate = formatInTimeZone(today, SAO_PAULO_TZ, 'yyyy-MM-dd');
    }

    const fromDate = startDate as string;
    const toDate = endDate as string;

    console.log('Performance API: Iniciando busca', { page, limit, offset, status, startDate: fromDate, endDate: toDate });
    console.log('Performance API: Aplicando filtros de data', { startDate: fromDate, endDate: toDate });

    // Estratégia: Buscar dados usando relacionamentos entre tabelas
    // 1. Primeiro, buscar insights de adset com dados no período
    // 2. Fazer JOIN com adsets para obter campaign_id
    // 3. Fazer JOIN com campaigns para obter informações da campanha
    
    // Buscar dados do período específico usando adset_insights
    const { data: periodData, error: periodError } = await supabase
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
      .gte('date', fromDate)
      .lte('date', toDate);

    if (periodError) {
      console.error('Performance API: Erro ao buscar dados do período', { error: periodError });
      if (periodError.message?.includes('fetch failed')) {
        return await buildMetaPerformanceResponse(page, limit, status, fromDate, toDate);
      }
      throw periodError;
    }

    // Buscar adsets para obter campaign_id
    const adsetIds = Array.from(new Set((periodData || []).map(d => d.adset_id).filter(Boolean)));
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      console.error('Performance API: Erro ao buscar adsets', { error: adsetsError });
      if (adsetsError.message?.includes('fetch failed')) {
        return await buildMetaPerformanceResponse(page, limit, status, fromDate, toDate);
      }
      throw adsetsError;
    }

    // Criar mapa de adset_id para campaign_id
    const adsetToCampaignMap = new Map();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

    // Buscar campanhas
    const campaignIdsFromInsights = Array.from(
      new Set((periodData || []).map(d => d.campaign_id).filter(Boolean))
    );
    const campaignIdsFromAdsets = Array.from(new Set(adsetToCampaignMap.values())).filter(id => id);
    const campaignIds = Array.from(new Set([...campaignIdsFromInsights, ...campaignIdsFromAdsets]));
    const campaignsQuery = supabase
      .from('campaigns')
      .select('id, name, status');

    if (campaignIds.length > 0) {
      campaignsQuery.in('id', campaignIds);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('Performance API: Erro ao buscar campanhas', { error: campaignsError });
      if (campaignsError.message?.includes('fetch failed')) {
        return await buildMetaPerformanceResponse(page, limit, status, fromDate, toDate);
      }
      throw campaignsError;
    }

    // Agrupar dados por campanha
    const campaignDataMap = new Map();
    
    (periodData || []).forEach(insight => {
      const campaignId = insight.campaign_id || adsetToCampaignMap.get(insight.adset_id);
      if (campaignId) {
        const campaign = campaigns?.find(c => c.id === campaignId);
        const campaignStatus = campaign?.status || 'UNKNOWN';

        if (status !== 'ALL' && campaignStatus !== status) {
          return;
        }

        if (!campaignDataMap.has(campaignId)) {
          campaignDataMap.set(campaignId, {
            campaign_id: campaignId,
            campaign_name: campaign?.name || campaignId,
            campaign_status: campaignStatus,
            total_leads: 0,
            total_spend: 0,
            total_impressions: 0,
            total_clicks: 0
          });
        }

        const data = campaignDataMap.get(campaignId);
        data.total_leads += Number(insight.leads) || 0;
        data.total_spend += Number(insight.spend) || 0;
        data.total_impressions += Number(insight.impressions) || 0;
        data.total_clicks += Number(insight.clicks) || 0;
      }
    });

    const campaignData = Array.from(campaignDataMap.values());

    if (!campaignData || campaignData.length === 0) {
      return createEmptyResponse(page, limit);
    }

    const transformedCampaigns = campaignData.map(campaign => {
      const leads = Number(campaign.total_leads) || 0;
      const spend = Number(campaign.total_spend) || 0;
      const impressions = Number(campaign.total_impressions) || 0;
      const clicks = Number(campaign.total_clicks) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = leads > 0 ? spend / leads : 0;
      const roi = spend > 0 ? ((leads * 100) / spend) : 0;
      
      return {
        id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        status: campaign.campaign_status,
        leads,
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        cpl: Math.round(cpl * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        data_start_date: fromDate,
        data_end_date: toDate
      };
    });

    const totalLeads = transformedCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
    const totalSpend = transformedCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const totalImpressions = transformedCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
    const totalClicks = transformedCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);

    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const averageROI = totalSpend > 0 ? ((totalLeads * 100) / totalSpend) : 0;

    const metrics = {
      totalLeads,
      totalSpend,
      averageCTR: Math.round(averageCTR * 100) / 100,
      averageCPL: Math.round(averageCPL * 100) / 100,
      averageROI: Math.round(averageROI * 100) / 100,
      totalImpressions,
      totalClicks
    };

    // Aplicar paginação
    const total = transformedCampaigns.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedCampaigns = transformedCampaigns.slice(offset, offset + limit);

    console.log('Performance API: Dados processados com sucesso', {
      totalCampaigns: total,
      page,
      limit,
      totalPages,
      metrics
    });

    return NextResponse.json({
      campaigns: paginatedCampaigns,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Performance API: Erro interno', { error });
    const message = (error as { message?: string })?.message || '';
    if (message.includes('fetch failed')) {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || 'ALL';
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      return await buildMetaPerformanceResponse(page, limit, status, startDate, endDate);
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 