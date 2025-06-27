// API de Performance usando relacionamentos entre tabelas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

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
      sevenDaysAgo.setDate(today.getDate() - 6); // 7 dias incluindo hoje
      
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }

    console.log('Performance API: Iniciando busca', { page, limit, offset, status, startDate, endDate });
    console.log('Performance API: Aplicando filtros de data', { startDate, endDate });

    // Estratégia: Buscar dados usando relacionamentos entre tabelas
    // 1. Primeiro, buscar insights de adset com dados no período
    // 2. Fazer JOIN com adsets para obter campaign_id
    // 3. Fazer JOIN com campaigns para obter informações da campanha
    
    // Buscar dados do período específico usando adset_insights
    const { data: periodData, error: periodError } = await supabase
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

    if (periodError) {
      console.error('Performance API: Erro ao buscar dados do período', { error: periodError });
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: periodError },
        { status: 500 }
      );
    }

    // Buscar adsets para obter campaign_id
    const adsetIds = [...new Set((periodData || []).map(d => d.adset_id))];
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      console.error('Performance API: Erro ao buscar adsets', { error: adsetsError });
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: adsetsError },
        { status: 500 }
      );
    }

    // Criar mapa de adset_id para campaign_id
    const adsetToCampaignMap = new Map();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

    // Buscar campanhas
    const campaignIds = [...new Set(adsetToCampaignMap.values())].filter(id => id);
    let campaignsQuery = supabase
      .from('campaigns')
      .select('id, name, status');

    if (status !== 'ALL') {
      campaignsQuery = campaignsQuery.eq('status', status);
    }

    if (campaignIds.length > 0) {
      campaignsQuery = campaignsQuery.in('id', campaignIds);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('Performance API: Erro ao buscar campanhas', { error: campaignsError });
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: campaignsError },
        { status: 500 }
      );
    }

    // Agrupar dados por campanha
    const campaignDataMap = new Map();
    
    (periodData || []).forEach(insight => {
      const campaignId = adsetToCampaignMap.get(insight.adset_id);
      if (campaignId) {
        const campaign = campaigns?.find(c => c.id === campaignId);
        if (campaign) {
          if (!campaignDataMap.has(campaignId)) {
            campaignDataMap.set(campaignId, {
              campaign_id: campaignId,
              campaign_name: campaign.name,
              campaign_status: campaign.status,
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
      }
    });

    const campaignData = Array.from(campaignDataMap.values());

    if (!campaignData || campaignData.length === 0) {
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
        data_start_date: startDate,
        data_end_date: endDate
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

    const response = {
      campaigns: transformedCampaigns,
      metrics,
      pagination: {
        page,
        limit,
        total: transformedCampaigns.length,
        totalPages: Math.ceil(transformedCampaigns.length / limit)
      }
    };

    console.log('Performance API: Busca concluída', { 
      totalCampaigns: transformedCampaigns.length,
      page,
      limit,
      hasDateFilter: true,
      period: `${startDate} a ${endDate}`,
      statusFilter: status
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance API: Erro inesperado', { error });
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
} 