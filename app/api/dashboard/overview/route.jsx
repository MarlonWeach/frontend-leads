import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 [DIAGNÓSTICO] GET /api/dashboard/overview chamado');
    
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    console.log('🔍 [DEBUG] Filtros recebidos na API:', { dateFrom, dateTo });

    // 1. Fetch all campaigns to get their names, IDs, and statuses
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name, status');
    if (campaignsError) throw campaignsError;
    
    const activeCampaignIds = campaigns.filter(c => c.status === 'ACTIVE').map(c => c.id);
    const campaignIdToNameMap = new Map(campaigns.map(c => [c.id, c.name]));

    // 2. Build adset_insights query with date filters (usando mesma estratégia da performance)
    console.log('🔍 [DASHBOARD] Buscando adset_insights com filtros:', { dateFrom, dateTo });
    
    let adsetInsightsQuery = supabase
        .from('adset_insights')
        .select('adset_id, date, leads, spend, impressions, clicks');

    // Aplicar filtros de data apenas se não forem null ou vazios
    if (dateFrom && dateFrom !== 'null' && dateFrom.trim() !== '') {
      adsetInsightsQuery = adsetInsightsQuery.gte('date', dateFrom);
    }
    
    if (dateTo && dateTo !== 'null' && dateTo.trim() !== '') {
      adsetInsightsQuery = adsetInsightsQuery.lte('date', dateTo);
    }

    // Se não há filtros de data, usar apenas os últimos 30 dias por padrão
    if ((!dateFrom || dateFrom === 'null' || dateFrom.trim() === '') && 
        (!dateTo || dateTo === 'null' || dateTo.trim() === '')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const defaultDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      
      console.log('🔍 [DASHBOARD] Usando filtro padrão de 30 dias:', { defaultDateFrom });
      adsetInsightsQuery = adsetInsightsQuery.gte('date', defaultDateFrom);
    }

    const { data: adsetInsightsData, error: adsetInsightsError } = await adsetInsightsQuery;
    
    console.log('🔍 [DASHBOARD] Resultado da query adset_insights:', {
      dataLength: adsetInsightsData?.length || 0,
      error: adsetInsightsError,
      sampleData: adsetInsightsData?.slice(0, 3),
      dateFrom,
      dateTo
    });
    
    if (adsetInsightsError) {
      console.error('Erro ao buscar adset_insights:', adsetInsightsError);
      throw adsetInsightsError;
    }

    // 3. Buscar adsets para obter campaign_id (mesma estratégia da performance)
    const adsetIds = Array.from(new Set((adsetInsightsData || []).map(d => d.adset_id)));
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      console.error('Erro ao buscar adsets:', adsetsError);
      throw adsetsError;
    }

    // Criar mapa de adset_id para campaign_id
    const adsetToCampaignMap = new Map();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

    // 4. Aggregate all metrics from adset_insights in the period
    const metricsAggregation = (adsetInsightsData || []).reduce((acc, entry) => {
        acc.totalLeads += (parseInt(entry.leads) || 0);
        acc.totalSpend += (parseFloat(entry.spend) || 0);
        acc.totalImpressions += (parseInt(entry.impressions) || 0);
        acc.totalClicks += (parseInt(entry.clicks) || 0);
        return acc;
    }, { totalLeads: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });

    const ctr = metricsAggregation.totalImpressions > 0 ? (metricsAggregation.totalClicks / metricsAggregation.totalImpressions) * 100 : 0;
    const conversionRate = metricsAggregation.totalClicks > 0 ? (metricsAggregation.totalLeads / metricsAggregation.totalClicks) * 100 : 0;
    
    // 5. Calculate campaignDistribution (for pie chart - only ACTIVE campaigns)
    const leadsByActiveCampaign = (adsetInsightsData || [])
        .reduce((acc, entry) => {
            const campaignId = adsetToCampaignMap.get(entry.adset_id);
            if (campaignId && activeCampaignIds.includes(campaignId)) {
                const campaignName = campaignIdToNameMap.get(campaignId) || 'Desconhecido';
                acc[campaignName] = (acc[campaignName] || 0) + (parseInt(entry.leads) || 0);
            }
            return acc;
        }, {});

    const campaignDistribution = Object.entries(leadsByActiveCampaign)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);

    // 6. Calculate overviewData (for line chart - leads per day)
    const leadsPerDay = (adsetInsightsData || []).reduce((acc, entry) => {
        const date = entry.date;
        acc[date] = (acc[date] || 0) + (parseInt(entry.leads) || 0);
        return acc;
    }, {});

    const overviewData = Object.entries(leadsPerDay).map(([date, total]) => ({ date, total }));

    // 7. Get other general metrics
    const { count: totalCampaigns } = await supabase.from('campaigns').select('*', { count: 'exact', head: true });
    const { count: activeCampaigns } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    
    const { count: totalAdsets } = await supabase.from('adsets').select('*', { count: 'exact', head: true });
    const { count: activeAdsets } = await supabase.from('adsets').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    
    const { count: totalAds } = await supabase.from('ads').select('*', { count: 'exact', head: true });
    const { count: activeAds } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');

    // 8. Get recent activity (leads from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLeads } = await supabase
        .from('adset_insights')
        .select('adset_id, date, leads, spend, impressions, clicks')
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

    // 9. Generate alerts based on metrics
    const alerts = [];
    
    if (activeCampaignIds.length === 0) {
      alerts.push({
        type: 'warning',
        title: 'Nenhuma campanha ativa',
        message: 'Você não tem campanhas ativas no momento.',
        action: 'Ativar campanhas',
        href: '/campaigns'
      });
    }

    if (metricsAggregation.totalLeads > 10) {
      alerts.push({
        type: 'info',
        title: `${metricsAggregation.totalLeads} novos leads`,
        message: 'Você tem leads aguardando contato.',
        action: 'Ver leads',
        href: '/leads'
      });
    }

    if (conversionRate < 5 && metricsAggregation.totalLeads > 20) {
      alerts.push({
        type: 'warning',
        title: 'Taxa de conversão baixa',
        message: `Taxa atual: ${conversionRate.toFixed(1)}%. Meta: 5%+`,
        action: 'Ver performance',
        href: '/performance'
      });
    }

    console.log('🔍 [DASHBOARD] Dados recuperados com sucesso!');
    console.log('🔍 [DASHBOARD] Métricas calculadas:', {
      totalLeads: metricsAggregation.totalLeads,
      totalSpend: metricsAggregation.totalSpend,
      totalImpressions: metricsAggregation.totalImpressions,
      totalClicks: metricsAggregation.totalClicks,
      ctr: ctr,
      conversionRate: conversionRate
    });
    
    return NextResponse.json({
      metrics: {
        campaigns: { total: totalCampaigns || 0, active: activeCampaignIds.length },
        adsets: { total: totalAdsets || 0, active: activeAdsets || 0 },
        ads: { total: totalAds || 0, active: activeAds || 0 },
        leads: { 
          total: metricsAggregation.totalLeads || 0, 
          new: metricsAggregation.totalLeads || 0,
          converted: metricsAggregation.totalLeads || 0,
          conversion_rate: conversionRate
        },
        spend: { total: metricsAggregation.totalSpend, today: 0 },
        impressions: { total: metricsAggregation.totalImpressions, today: 0 },
        clicks: { total: metricsAggregation.totalClicks, today: 0 },
        ctr: { average: ctr, trend: 0 }
      },
      recentActivity: recentLeads || [],
      alerts,
      overviewData: overviewData.sort((a, b) => new Date(b.date) - new Date(a.date)),
      campaignDistribution
    });
  } catch (error) {
    console.error('🔍 [DASHBOARD] Erro completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados do dashboard',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
