import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    console.log('Buscando dados do dashboard com filtros:', { dateFrom, dateTo });

    // Buscar ads ativos
    const { data: activeAds, error: adsError } = await supabase
      .from('ads')
      .select('ad_id')
      .eq('status', 'ACTIVE');
    if (adsError) throw adsError;
    const activeAdIds = (activeAds || []).map(ad => ad.ad_id).filter(Boolean);

    // Consulta para dados de leads e performance da tabela meta_leads com filtros de data e ads ativos
    let metaLeadsQuery = supabase
      .from('meta_leads')
      .select(`
        lead_count,
        spend,
        impressions,
        clicks,
        created_time,
        ad_id,
        adset_id,
        campaign_id,
        ad_name
      `);

    if (activeAdIds.length > 0) {
      metaLeadsQuery = metaLeadsQuery.in('ad_id', activeAdIds);
    } else {
      // Se não houver ads ativos, retorna vazio
      return NextResponse.json({
        metrics: {
          campaigns: { total: 0, active: 0 },
          leads: { total: 0, new: 0, converted: 0, conversion_rate: 0 },
          advertisers: { total: 0, active: 0 },
          performance: { spend: 0, impressions: 0, clicks: 0, ctr: 0 }
        },
        recentActivity: [],
        alerts: [{
          type: 'warning',
          title: 'Nenhum anúncio ativo',
          message: 'Não há anúncios ativos no momento.',
          action: 'Ver campanhas',
          href: '/campaigns'
        }],
        overviewData: []
      });
    }

    if (dateFrom) {
      metaLeadsQuery = metaLeadsQuery.gte('created_time', dateFrom);
    }
    if (dateTo) {
      metaLeadsQuery = metaLeadsQuery.lte('created_time', dateTo);
    }

    const { data: metaLeadsData, error: metaLeadsError } = await metaLeadsQuery;
    if (metaLeadsError) throw metaLeadsError;

    console.log('Dados recuperados da meta_leads:', {
      total: metaLeadsData.length,
      sample: metaLeadsData.slice(0, 3)
    });

    // Agregação de dados da meta_leads
    const aggregatedLeadsData = metaLeadsData.reduce((acc, entry) => {
      acc.totalLeads += (entry.lead_count || 0);
      acc.totalSpend += (parseFloat(entry.spend) || 0);
      acc.totalImpressions += (parseInt(entry.impressions) || 0);
      acc.totalClicks += (parseInt(entry.clicks) || 0);
      return acc;
    }, { totalLeads: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });

    // Buscar leads dos últimos 30 dias para métrica de leads recentes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLeadsData, error: recentError } = await supabase
      .from('meta_leads')
      .select('lead_count, created_time')
      .gte('created_time', thirtyDaysAgo.toISOString());
    
    if (recentError) throw recentError;

    const recentLeads = recentLeadsData.reduce((sum, entry) => sum + (entry.lead_count || 0), 0);

    // Calcular métricas derivadas
    const ctr = aggregatedLeadsData.totalImpressions > 0 
      ? (aggregatedLeadsData.totalClicks / aggregatedLeadsData.totalImpressions) * 100 
      : 0;

    const conversionRate = aggregatedLeadsData.totalClicks > 0 
      ? (aggregatedLeadsData.totalLeads / aggregatedLeadsData.totalClicks) * 100 
      : 0;

    // Buscar métricas de campanhas
    const [
      { count: totalCampaigns },
      { count: activeCampaigns }
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
    ]);

    // Buscar métricas de anunciantes
    const [
      { count: totalAdvertisers },
      { count: activeAdvertisers }
    ] = await Promise.all([
      supabase.from('advertisers').select('*', { count: 'exact', head: true }),
      supabase.from('advertisers').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    // Gerar alertas baseados nas métricas
    const alerts = [];
    
    if (activeCampaigns === 0) {
      alerts.push({
        type: 'warning',
        title: 'Nenhuma campanha ativa',
        message: 'Você não tem campanhas ativas no momento.',
        action: 'Ativar campanhas',
        href: '/campaigns'
      });
    }

    if (aggregatedLeadsData.totalLeads > 10) {
      alerts.push({
        type: 'info',
        title: `${aggregatedLeadsData.totalLeads} novos leads`,
        message: 'Você tem leads aguardando contato.',
        action: 'Ver leads',
        href: '/leads'
      });
    }

    if (conversionRate < 5 && aggregatedLeadsData.totalLeads > 20) {
      alerts.push({
        type: 'warning',
        title: 'Taxa de conversão baixa',
        message: `Taxa atual: ${conversionRate.toFixed(1)}%. Meta: 5%+`,
        action: 'Ver performance',
        href: '/performance'
      });
    }

    // Preparar dados de atividade recente
    const recentActivity = metaLeadsData
      .sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
      .slice(0, 10)
      .map(entry => ({
        id: entry.ad_id,
        type: 'lead',
        value: entry.lead_count,
        timestamp: entry.created_time,
        metadata: {
          spend: entry.spend,
          impressions: entry.impressions,
          clicks: entry.clicks
        }
      }));

    return NextResponse.json({
      metrics: {
        campaigns: { 
          total: totalCampaigns || 0, 
          active: activeCampaigns || 0,
          active_vs_previous_month: 0 // Placeholder para tendência
        },
        leads: { 
          total: aggregatedLeadsData.totalLeads || 0,
          new: aggregatedLeadsData.totalLeads || 0, // Usando totalLeads como newLeads
          converted: aggregatedLeadsData.totalLeads || 0, // Usando totalLeads como convertedLeads
          conversion_rate: parseFloat(conversionRate.toFixed(2)),
          total_vs_previous_month: 0 // Placeholder para tendência
        },
        advertisers: { 
          total: totalAdvertisers || 0, 
          active: activeAdvertisers || 0,
          registered: totalAdvertisers || 0,
          total_vs_previous_month: 0 // Placeholder para tendência
        },
        performance: { 
          spend: aggregatedLeadsData.totalSpend,
          impressions: aggregatedLeadsData.totalImpressions,
          clicks: aggregatedLeadsData.totalClicks,
          ctr: parseFloat(ctr.toFixed(2)),
          spend_vs_previous_month: 0 // Placeholder para tendência
        }
      },
      recentActivity,
      alerts,
      overviewData: metaLeadsData.map(entry => ({
        date: entry.created_time.split('T')[0],
        total: entry.lead_count || 0,
        spend: entry.spend || 0,
        impressions: entry.impressions || 0,
        clicks: entry.clicks || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar dados do overview:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados do overview',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
} 