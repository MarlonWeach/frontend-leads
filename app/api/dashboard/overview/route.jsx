import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('Buscando dados do dashboard...');
    
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    console.log('Filtros de data recebidos:', { dateFrom, dateTo });

    // Buscar métricas de campanhas
    const [
      { count: totalCampaigns },
      { count: activeCampaigns }
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
    ]);

    // Buscar dados reais da tabela meta_leads (dados da Meta API)
    let metaLeadsQuery = supabase
      .from('meta_leads')
      .select('lead_count, spend, impressions, clicks, created_time, ad_id, ad_name, campaign_name');

    // CORREÇÃO: Aplicar filtros de data corretamente
    // created_time representa a data de início do período de relatório da Meta API
    if (dateFrom && dateTo) {
      // Converter para data local para comparação correta
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      console.log('Aplicando filtros de data:', {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      });

      metaLeadsQuery = metaLeadsQuery
        .gte('created_time', fromDate.toISOString().split('T')[0])
        .lte('created_time', toDate.toISOString().split('T')[0]);
    } else {
      // Se não há filtros, usar apenas os últimos 30 dias por padrão
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      metaLeadsQuery = metaLeadsQuery
        .gte('created_time', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data: metaLeadsData, error: metaLeadsError } = await metaLeadsQuery;
    if (metaLeadsError) throw metaLeadsError;

    console.log('metaLeadsData length:', metaLeadsData?.length || 0);
    console.log('Primeiros 5 metaLeadsData entries:', metaLeadsData?.slice(0, 5) || []);

    // Agregar dados de leads da tabela meta_leads (dados reais da Meta API)
    // IMPORTANTE: Agora calculando apenas do período filtrado
    const leadsMetrics = (metaLeadsData || []).reduce((acc, entry) => {
      acc.totalLeads += (entry.lead_count || 0);
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

    // Buscar atividade recente (leads dos últimos 7 dias da tabela meta_leads)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLeads } = await supabase
      .from('meta_leads')
      .select('lead_count, spend, impressions, clicks, created_time, ad_name, campaign_name')
      .gte('created_time', sevenDaysAgo.toISOString().split('T')[0])
      .order('created_time', { ascending: false })
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

    console.log('Dados recuperados com sucesso da Meta API!');
    console.log('Métricas calculadas:', {
      totalLeads: leadsMetrics.totalLeads,
      totalSpend: leadsMetrics.totalSpend,
      totalImpressions: leadsMetrics.totalImpressions,
      totalClicks: leadsMetrics.totalClicks,
      ctr: ctr,
      conversionRate: conversionRate
    });
    
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
      overviewData: (metaLeadsData || []).map(lead => ({
        date: lead.created_time.split('T')[0],
        total: lead.lead_count || 0
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