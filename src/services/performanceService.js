import { supabase } from '../lib/supabaseClient';

export async function fetchPerformanceMetrics(filters = {}) {
  try {
    console.log('📊 Buscando métricas de performance...');
    
    // Buscar campanhas
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*');

    // Aplicar filtros
    if (filters.campaign_id) {
      campaignsQuery = campaignsQuery.eq('id', filters.campaign_id);
    }
    
    if (filters.status) {
      campaignsQuery = campaignsQuery.eq('status', filters.status);
    }
    
    if (filters.objective) {
      campaignsQuery = campaignsQuery.eq('objective', filters.objective);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('❌ Erro ao buscar campanhas:', campaignsError);
      return {
        campaigns: [],
        metrics: getEmptyMetrics()
      };
    }

    // Buscar todos os adsets de uma vez
    const campaignIds = campaigns?.map(c => c.id) || [];
    let adsetsData = [];
    let adsData = [];

    if (campaignIds.length > 0) {
      // Buscar adsets
      const { data: adsets, error: adsetsError } = await supabase
        .from('adsets')
        .select('*')
        .in('campaign_id', campaignIds);

      if (!adsetsError && adsets) {
        adsetsData = adsets;
        
        // Buscar ads
        const adsetIds = adsets.map(a => a.id);
        if (adsetIds.length > 0) {
          const { data: ads, error: adsError } = await supabase
            .from('ads')
            .select('*')
            .in('adset_id', adsetIds);
          
          if (!adsError && ads) {
            adsData = ads;
          }
        }
      }
    }

    // Montar estrutura completa
    const campaignsWithDetails = (campaigns || []).map(campaign => {
      // Filtrar adsets desta campanha
      const campaignAdsets = adsetsData.filter(adset => adset.campaign_id === campaign.id);
      
      // Para cada adset, adicionar seus ads
      const adsetsWithAds = campaignAdsets.map(adset => {
        const adsetAds = adsData.filter(ad => ad.adset_id === adset.id);
        return {
          ...adset,
          ads: adsetAds
        };
      });

      return {
        ...campaign,
        adsets: adsetsWithAds
      };
    });

    // Calcular métricas
    const metrics = calculateDetailedMetrics(campaignsWithDetails);
    
    console.log('✅ Dados carregados:', {
      campanhas: campaigns?.length || 0,
      adsets: adsetsData.length,
      ads: adsData.length
    });
    
    return {
      campaigns: campaignsWithDetails,
      metrics
    };
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return {
      campaigns: [],
      metrics: getEmptyMetrics()
    };
  }
}

function getEmptyMetrics() {
  return {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: '0.00',
    totalAdsets: 0,
    totalAds: 0,
    campaignsByStatus: {},
    campaignsByObjective: {},
    budgetByStatus: {}
  };
}

function calculateDetailedMetrics(campaigns) {
  const metrics = {
    totalCampaigns: campaigns.length,
    activeCampaigns: 0,
    totalBudget: 0,
    totalAdsets: 0,
    totalAds: 0,
    campaignsByStatus: {},
    campaignsByObjective: {},
    budgetByStatus: {}
  };

  campaigns.forEach(campaign => {
    // Contar campanhas ativas
    if (campaign.status === 'ACTIVE') {
      metrics.activeCampaigns++;
    }

    // Agrupar por status
    if (!metrics.campaignsByStatus[campaign.status]) {
      metrics.campaignsByStatus[campaign.status] = 0;
      metrics.budgetByStatus[campaign.status] = 0;
    }
    metrics.campaignsByStatus[campaign.status]++;

    // Agrupar por objetivo
    if (campaign.objective) {
      if (!metrics.campaignsByObjective[campaign.objective]) {
        metrics.campaignsByObjective[campaign.objective] = 0;
      }
      metrics.campaignsByObjective[campaign.objective]++;
    }

    // Processar adsets e calcular budgets
    if (campaign.adsets && Array.isArray(campaign.adsets)) {
      metrics.totalAdsets += campaign.adsets.length;
      
      campaign.adsets.forEach(adset => {
        // Somar budgets (considerando que podem estar em centavos)
        const dailyBudget = parseFloat(adset.daily_budget || 0);
        const lifetimeBudget = parseFloat(adset.lifetime_budget || 0);
        
        // Usar o maior valor entre daily e lifetime
        const budget = Math.max(dailyBudget, lifetimeBudget) / 100; // Dividir por 100 se estiver em centavos
        
        metrics.totalBudget += budget;
        metrics.budgetByStatus[campaign.status] += budget;
        
        // Contar ads
        if (adset.ads && Array.isArray(adset.ads)) {
          metrics.totalAds += adset.ads.length;
        }
      });
    }
  });

  // Formatar valores monetários
  metrics.totalBudget = metrics.totalBudget.toFixed(2);
  Object.keys(metrics.budgetByStatus).forEach(status => {
    metrics.budgetByStatus[status] = metrics.budgetByStatus[status].toFixed(2);
  });

  return metrics;
}

// Função para exportar dados completos
export async function exportPerformanceData(format = 'csv') {
  try {
    const { campaigns, metrics } = await fetchPerformanceMetrics();
    
    if (format === 'csv') {
      const csvHeader = 'Campaign Name,Status,Objective,Budget,Adsets,Ads\n';
      const csvRows = campaigns.map(campaign => {
        const budget = campaign.adsets?.reduce((sum, adset) => {
          const dailyBudget = parseFloat(adset.daily_budget || 0);
          const lifetimeBudget = parseFloat(adset.lifetime_budget || 0);
          return sum + Math.max(dailyBudget, lifetimeBudget) / 100;
        }, 0) || 0;
        
        const totalAds = campaign.adsets?.reduce((sum, adset) => sum + (adset.ads?.length || 0), 0) || 0;
        
        return `"${campaign.name}","${campaign.status}","${campaign.objective || 'N/A'}","R$ ${budget.toFixed(2)}","${campaign.adsets?.length || 0}","${totalAds}"`;
      }).join('\n');
      
      return csvHeader + csvRows;
    }
    
    // Retornar JSON
    return { campaigns, metrics };
  } catch (error) {
    console.error('❌ Erro ao exportar:', error);
    return format === 'csv' ? '' : { campaigns: [], metrics: getEmptyMetrics() };
  }
}

// Função para buscar métricas por advertiser
export async function fetchMetricsByAdvertiser(advertiserId) {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('advertiser_id', advertiserId);

    if (error) throw error;

    return fetchPerformanceMetrics({ campaign_ids: campaigns?.map(c => c.id) || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar por advertiser:', error);
    return {
      campaigns: [],
      metrics: getEmptyMetrics()
    };
  }
}