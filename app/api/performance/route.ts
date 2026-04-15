import { NextRequest, NextResponse } from 'next/server';
import { formatInTimeZone } from 'date-fns-tz';
import { supabaseServer as supabase } from '../../../src/lib/supabaseServer';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'ALL';
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const offset = (page - 1) * limit;

    // Se não há filtro de data, aplicar filtro padrão dos últimos 7 dias
    if (!startDate || !endDate) {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      const SAO_PAULO_TZ = 'America/Sao_Paulo';
      startDate = formatInTimeZone(sevenDaysAgo, SAO_PAULO_TZ, 'yyyy-MM-dd');
      endDate = formatInTimeZone(today, SAO_PAULO_TZ, 'yyyy-MM-dd');
    }

    const fromDate = startDate;
    const toDate = endDate;

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
      throw periodError;
    }

    const adsetIds = Array.from(new Set((periodData || []).map(d => d.adset_id).filter(Boolean)));
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      throw adsetsError;
    }

    const adsetToCampaignMap = new Map<string, string>();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

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
      throw campaignsError;
    }

    const campaignDataMap = new Map<string, {
      campaign_id: string;
      campaign_name: string;
      campaign_status: string;
      total_leads: number;
      total_spend: number;
      total_impressions: number;
      total_clicks: number;
    }>();

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
        if (!data) {
          return;
        }
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

    return NextResponse.json({
      campaigns: paginatedCampaigns,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      source: 'supabase'
    });

  } catch (error) {
    console.error('Performance API: erro interno', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', source: 'supabase' },
      { status: 500 }
    );
  }
} 