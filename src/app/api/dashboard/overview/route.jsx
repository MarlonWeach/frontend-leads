import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/utils/logger";
import { getCachedData } from "@/utils/cache";
import { getCacheStats, getCacheMetrics, invalidateAllCache } from "@/utils/cache";

// LOG FORA DA FUNÇÃO PARA VERIFICAR SE O ARQUIVO ESTÁ SENDO CARREGADO
console.log('🔍 [DIAGNÓSTICO] Arquivo route.jsx carregado:', new Date().toISOString());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cacheAction = searchParams.get('cache');
  const timestamp = searchParams.get('t');
  
  console.log('🔍 [DIAGNÓSTICO] Dashboard Overview - Parâmetros recebidos:', { cacheAction, timestamp });
  
  const { logger } = await import('../../utils/logger');
  const { supabase } = await import('../../../../lib/supabaseClient');
  const { getCachedData } = await import('../../utils/cache');

  // LOGS DETALHADOS DE DIAGNÓSTICO
  console.log('🔍 [DIAGNÓSTICO] GET /api/dashboard/overview chamado');
  console.log('🔍 [DIAGNÓSTICO] request.url:', request.url);
  
  // Forçar execução adicionando timestamp
  const requestTimestamp = Date.now();
  console.log('🔍 [DIAGNÓSTICO] Timestamp:', requestTimestamp);
  
  try {
    const url = new URL(request.url);
    console.log('🔍 [DIAGNÓSTICO] url:', url.toString());
    const { searchParams: urlSearchParams } = url;
    console.log('🔍 [DIAGNÓSTICO] searchParams:', Object.fromEntries(urlSearchParams.entries()));
    const urlCacheAction = urlSearchParams.get('cache');
    console.log('🔍 [DIAGNÓSTICO] cacheAction:', urlCacheAction);
    
    // Se for uma ação de cache, processar e retornar
    if (urlCacheAction === 'stats') {
      console.log('🔍 [DIAGNÓSTICO] Processando cache=stats');
      try {
        const { getCacheStats, getCacheMetrics } = await import('../../utils/cache');
        const { logger } = await import('../../utils/logger');
        
        logger.info('Cache stats requested via dashboard overview');
        
        const stats = getCacheStats();
        const metrics = getCacheMetrics();
        
        console.log('🔍 [DIAGNÓSTICO] Cache stats obtidos:', { stats, metrics });
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          stats,
          metrics,
          debug: { cacheAction: urlCacheAction, timestamp }
        });
      } catch (error) {
        console.log('🔍 [DIAGNÓSTICO] Erro ao processar cache:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to get cache stats',
            timestamp: new Date().toISOString(),
            debug: { cacheAction: urlCacheAction, timestamp }
          },
          { status: 500 }
        );
      }
    }
    
    if (urlCacheAction === 'invalidate') {
      console.log('🔍 [DIAGNÓSTICO] Processando cache=invalidate');
      try {
        const { invalidateAllCache } = await import('../../utils/cache');
        const { logger } = await import('../../utils/logger');
        
        logger.info('Cache invalidate requested via dashboard overview');
        
        const result = invalidateAllCache();
        
        console.log('🔍 [DIAGNÓSTICO] Cache invalidado:', result);
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          result,
          debug: { cacheAction: urlCacheAction, timestamp }
        });
      } catch (error) {
        console.log('🔍 [DIAGNÓSTICO] Erro ao invalidar cache:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to invalidate cache',
            timestamp: new Date().toISOString(),
            debug: { cacheAction: urlCacheAction, timestamp }
          },
          { status: 500 }
        );
      }
    }
    
    console.log('🔍 [DIAGNÓSTICO] Processando fluxo normal do dashboard');
    
  } catch (err) {
    console.log('🔍 [DIAGNÓSTICO] Erro ao processar URL:', err);
  }

  // Se não for ação de cache, continuar com a lógica original do dashboard
  try {
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    logger.info({ dateFrom, dateTo }, 'Buscando dados do dashboard com filtros');

    // Usar cache inteligente para buscar dados do dashboard
    const dashboardData = await getCachedData(
      'dashboard_overview',
      async () => {
        // 1. Fetch all campaigns to get their names, IDs, and statuses
        const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('id, name, status');
        if (campaignsError) throw campaignsError;
        
        const activeCampaignIds = campaigns.filter(c => c.status === 'ACTIVE').map(c => c.id);
        const campaignIdToNameMap = new Map(campaigns.map(c => [c.id, c.name]));

        // 2. Build meta_leads query with date filters
        let metaLeadsQuery = supabase
            .from('meta_leads')
            .select('lead_count, spend, impressions, clicks, created_time, ad_id, adset_id, campaign_id, ad_name')
            .not('campaign_id', 'is', null);

        if (dateFrom) metaLeadsQuery = metaLeadsQuery.gte('created_time', dateFrom);
        if (dateTo) metaLeadsQuery = metaLeadsQuery.lte('created_time', dateTo);

        const { data: metaLeadsData, error: metaLeadsError } = await metaLeadsQuery;
        if (metaLeadsError) {
          logger.error({ error: metaLeadsError }, 'Error fetching meta_leads data');
          throw metaLeadsError;
        }

        // 3. Aggregate all metrics from all leads in the period
        const metricsAggregation = (metaLeadsData || []).reduce((acc, entry) => {
            acc.totalLeads += (entry.lead_count || 0);
            acc.totalSpend += (parseFloat(entry.spend) || 0);
            acc.totalImpressions += (parseInt(entry.impressions) || 0);
            acc.totalClicks += (parseInt(entry.clicks) || 0);
            return acc;
        }, { totalLeads: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });

        const ctr = metricsAggregation.totalImpressions > 0 ? (metricsAggregation.totalClicks / metricsAggregation.totalImpressions) * 100 : 0;
        const conversionRate = metricsAggregation.totalClicks > 0 ? (metricsAggregation.totalLeads / metricsAggregation.totalClicks) * 100 : 0;
        
        // 4. Calculate campaignDistribution (for pie chart - only ACTIVE campaigns)
        const leadsByActiveCampaign = (metaLeadsData || [])
            .filter(lead => activeCampaignIds.includes(lead.campaign_id))
            .reduce((acc, lead) => {
                const campaignName = campaignIdToNameMap.get(lead.campaign_id) || 'Desconhecido';
                acc[campaignName] = (acc[campaignName] || 0) + (lead.lead_count || 0);
                return acc;
            }, {});

        const campaignDistribution = Object.entries(leadsByActiveCampaign)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);

        // 5. Calculate overviewData (for line chart - leads per day)
        const leadsPerDay = (metaLeadsData || []).reduce((acc, lead) => {
            const date = lead.created_time.split('T')[0];
            acc[date] = (acc[date] || 0) + (lead.lead_count || 0);
            return acc;
        }, {});

        const overviewData = Object.entries(leadsPerDay).map(([date, total]) => ({ date, total }));

        // 6. Get other general metrics
        const { count: totalCampaigns } = await supabase.from('campaigns').select('*', { count: 'exact', head: true });
        const { count: totalAdvertisers } = await supabase.from('advertisers').select('*', { count: 'exact', head: true });

        const metrics = {
            campaigns: { total: totalCampaigns || 0, active: activeCampaignIds.length },
            leads: {
                total: metricsAggregation.totalLeads,
                new: metricsAggregation.totalLeads, // Assuming all in range are new for this view
                converted: metricsAggregation.totalLeads, // Placeholder
                conversion_rate: parseFloat(conversionRate.toFixed(2)),
            },
            advertisers: { total: totalAdvertisers || 0, active: totalAdvertisers || 0 }, // Placeholder for active
            performance: {
                spend: metricsAggregation.totalSpend,
                impressions: metricsAggregation.totalImpressions,
                clicks: metricsAggregation.totalClicks,
                ctr: parseFloat(ctr.toFixed(2)),
            }
        };
        
        // 7. Prepare recent activity
        const recentActivity = (metaLeadsData || [])
            .sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
            .slice(0, 10)
            .map(entry => ({
                ...entry,
                campaign_name: campaignIdToNameMap.get(entry.campaign_id) || 'Desconhecido'
            }));
            
        // 8. Alerts
        const alerts = [];
        if (activeCampaignIds.length === 0) {
          alerts.push({ type: 'warning', title: 'Nenhuma campanha ativa', message: 'Você não tem campanhas ativas no momento.' });
        }
        if (metrics.leads.total > 10) {
          alerts.push({ type: 'info', title: `${metrics.leads.total} novos leads`, message: 'Você tem leads aguardando contato.', action: 'Ver leads', href: '/leads' });
        }
        if (conversionRate > 0 && conversionRate < 5) {
          alerts.push({ type: 'warning', title: 'Taxa de conversão baixa', message: `Taxa atual: ${conversionRate.toFixed(1)}%. Meta: 5%+`, action: 'Ver performance', href: '/performance'});
        }

        return {
          metrics,
          campaignDistribution,
          overviewData,
          recentActivity,
          alerts
        };
      },
      { ttl: 300 } // 5 minutos de cache
    );

    return NextResponse.json(dashboardData);
  } catch (error) {
    logger.error({ error }, 'Error in dashboard overview API');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
