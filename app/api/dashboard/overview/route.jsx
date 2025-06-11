import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    console.log('Buscando dados do dashboard...');
    
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Buscar métricas de campanhas
    const [
      { count: totalCampaigns },
      { count: activeCampaigns }
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
    ]);

    // Buscar métricas de leads da tabela ads
    let adsQuery = supabase
      .from('ads')
      .select('leads_count, spend, impressions, clicks, created_at, status');

    if (dateFrom) {
      adsQuery = adsQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      adsQuery = adsQuery.lt('created_at', dateTo);
    }

    const { data: adsData, error: adsError } = await adsQuery;
    if (adsError) throw adsError;

    console.log('adsData length:', adsData.length);
    console.log('Primeiros 5 adsData entries:', adsData.slice(0, 5));

    // Agregar dados de leads da tabela ads
    const leadsMetrics = adsData.reduce((acc, entry) => {
      acc.totalLeads += (entry.leads_count || 0);
      acc.totalSpend += (parseFloat(entry.spend) || 0);
      acc.totalImpressions += (parseInt(entry.impressions) || 0);
      acc.totalClicks += (parseInt(entry.clicks) || 0);
      return acc;
    }, { totalLeads: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });

    // Buscar métricas de anunciantes
    const [
      { count: totalAdvertisers },
      { count: activeAdvertisers }
    ] = await Promise.all([
      supabase.from('advertisers').select('*', { count: 'exact', head: true }),
      supabase.from('advertisers').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    // Calcular métricas derivadas
    const ctr = leadsMetrics.totalImpressions > 0 
      ? (leadsMetrics.totalClicks / leadsMetrics.totalImpressions) * 100 
      : 0;

    const conversionRate = leadsMetrics.totalClicks > 0 
      ? (leadsMetrics.totalLeads / leadsMetrics.totalClicks) * 100 
      : 0;

    // Buscar atividade recente (leads dos últimos 7 dias da tabela ads)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLeads } = await supabase
      .from('ads')
      .select('leads_count, spend, impressions, clicks, created_at, status')
      .eq('status', 'ACTIVE')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

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

    if (leadsMetrics.totalLeads > 10) {
      alerts.push({
        type: 'info',
        title: `${leadsMetrics.totalLeads} novos leads`,
        message: 'Você tem leads aguardando contato.',
        action: 'Ver leads',
        href: '/leads'
      });
    }

    if (conversionRate < 5 && leadsMetrics.totalLeads > 20) {
      alerts.push({
        type: 'warning',
        title: 'Taxa de conversão baixa',
        message: `Taxa atual: ${conversionRate.toFixed(1)}%. Meta: 5%+`,
        action: 'Ver performance',
        href: '/performance'
      });
    }

    console.log('Dados recuperados com sucesso!');
    
    return NextResponse.json({
      metrics: {
        campaigns: { total: totalCampaigns || 0, active: activeCampaigns || 0 },
        leads: { 
          total: leadsMetrics.totalLeads || 0, 
          new: leadsMetrics.totalLeads || 0, // Usando totalLeads como newLeads por enquanto
          converted: leadsMetrics.totalLeads || 0, // Usando totalLeads como convertedLeads por enquanto
          conversion_rate: conversionRate
        },
        advertisers: { total: totalAdvertisers || 0, active: activeAdvertisers || 0 },
        performance: { 
          spend: leadsMetrics.totalSpend, 
          impressions: leadsMetrics.totalImpressions, 
          clicks: leadsMetrics.totalClicks, 
          ctr: ctr 
        }
      },
      recentActivity: recentLeads || [],
      alerts,
      overviewData: adsData.map(ad => ({
        date: ad.created_at.split('T')[0],
        total: ad.leads_count || 0
      }))
    });
  } catch (error) {
    console.error('Erro completo:', {
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