// API de Performance usando adset_insights
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'ACTIVE';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const offset = (page - 1) * limit;

    console.log('Performance API: Iniciando busca', { page, limit, offset, status, startDate, endDate });

    if (startDate && endDate) {
      console.log('Performance API: Aplicando filtros de data', { startDate, endDate });
      
      // Buscar dados do período específico usando adset_insights
      const { data: periodData, error: periodError } = await supabase
        .from('adset_insights')
        .select(`
          adset_id,
          date,
          leads,
          spend,
          impressions,
          clicks,
          adset_name
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

      // Buscar campanhas ativas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status
        `)
        .eq('status', status);

      if (campaignsError) {
        console.error('Performance API: Erro ao buscar campanhas', { error: campaignsError });
        return NextResponse.json(
          { error: 'Erro interno do servidor', details: campaignsError },
          { status: 500 }
        );
      }

      // Agrupar dados por campanha baseado no nome do adset
      const campaignDataMap = new Map();
      
      (periodData || []).forEach(insight => {
        // Tentar encontrar a campanha baseada no nome do adset
        const campaign = campaigns?.find(c => 
          insight.adset_name?.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(insight.adset_name?.toLowerCase() || '')
        );
        
        if (campaign) {
          const campaignId = campaign.id;
          
          if (!campaignDataMap.has(campaignId)) {
            campaignDataMap.set(campaignId, {
              id: campaignId,
              name: campaign.name,
              status: campaign.status,
              leads: 0,
              spend: 0,
              impressions: 0,
              clicks: 0
            });
          }
          
          const data = campaignDataMap.get(campaignId);
          data.leads += Number(insight.leads) || 0;
          data.spend += Number(insight.spend) || 0;
          data.impressions += Number(insight.impressions) || 0;
          data.clicks += Number(insight.clicks) || 0;
        }
      });

      const campaignsArray = Array.from(campaignDataMap.values());
      const total = campaignsArray.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedCampaigns = campaignsArray.slice(offset, offset + limit);

      const transformedCampaigns = paginatedCampaigns.map(campaign => {
        const leads = Number(campaign.leads) || 0;
        const spend = Number(campaign.spend) || 0;
        const impressions = Number(campaign.impressions) || 0;
        const clicks = Number(campaign.clicks) || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpl = leads > 0 ? spend / leads : 0;
        const roi = spend > 0 ? ((leads * 100) / spend) : 0;
        
        return {
          id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
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
          total,
          totalPages
        }
      };

      console.log('Performance API: Busca concluída', { 
        totalCampaigns: transformedCampaigns.length,
        total,
        page,
        limit,
        hasDateFilter: true
      });

      return NextResponse.json(response);
    }

    let campaignsQuery = supabase
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        spend,
        impressions,
        clicks,
        leads,
        data_start_date,
        data_end_date
      `);

    if (status) {
      campaignsQuery = campaignsQuery.eq('status', status);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery
      .order('data_start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (campaignsError) {
      console.error('Performance API: Erro ao buscar campanhas', { error: campaignsError });
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: campaignsError },
        { status: 500 }
      );
    }

    let countQuery = supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Performance API: Erro ao contar registros', { error: countError });
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: countError },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const transformedCampaigns = (campaigns || []).map(campaign => {
      const leads = Number(campaign.leads) || 0;
      const spend = Number(campaign.spend) || 0;
      const impressions = Number(campaign.impressions) || 0;
      const clicks = Number(campaign.clicks) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = leads > 0 ? spend / leads : 0;
      const roi = spend > 0 ? ((leads * 100) / spend) : 0;
      
      return {
        id: campaign.id,
        campaign_name: campaign.name,
        status: campaign.status,
        leads,
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        cpl: Math.round(cpl * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        data_start_date: campaign.data_start_date,
        data_end_date: campaign.data_end_date
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
        total,
        totalPages
      }
    };

    console.log('Performance API: Busca concluída', { 
      totalCampaigns: transformedCampaigns.length,
      total,
      page,
      limit,
      hasDateFilter: false
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
