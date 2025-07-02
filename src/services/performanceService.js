import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';

// Função auxiliar para validar datas
function validateDates(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return false;
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  return !isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to;
}

// Função auxiliar para formatar data para ISO
function formatDate(date) {
  return new Date(date).toISOString();
}

export async function fetchPerformanceMetrics(filters = {}) {
  try {
    console.log('📊 Iniciando busca de métricas...', { filters });
    
    // Validar datas
    if (filters.date_from && filters.date_to && !validateDates(filters.date_from, filters.date_to)) {
      throw new Error('Datas inválidas ou período incorreto');
    }

    // Formatar datas para ISO
    const formattedFilters = {
      ...filters,
      date_from: filters.date_from ? formatDate(filters.date_from) : undefined,
      date_to: filters.date_to ? formatDate(filters.date_to) : undefined
    };

    // Buscar campanhas SEM filtro de data
    let campaignsQuery = supabase
      .from('campaigns')
      .select(`
        *,
        adsets (
          *,
          ads (*)
        )
      `);

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
      throw new Error(`Erro ao buscar campanhas: ${campaignsError.message}`);
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('ℹ️ Nenhuma campanha encontrada para os filtros:', formattedFilters);
      return {
        campaigns: [],
        metrics: getEmptyMetrics()
      };
    }

    // Calcular métricas com validação de dados
    const metrics = calculateDetailedMetrics(campaigns);
    
    console.log('✅ Dados carregados com sucesso:', {
      campanhas: campaigns.length,
      adsets: campaigns.reduce((sum, c) => sum + (c.adsets?.length || 0), 0),
      ads: campaigns.reduce((sum, c) => 
        sum + c.adsets?.reduce((s, a) => s + (a.ads?.length || 0), 0) || 0, 0)
    });
    
    return {
      campaigns,
      metrics
    };
  } catch (error) {
    logger.error({
      msg: 'Erro ao buscar métricas de performance',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filters
    });
    
    // Retornar erro estruturado
    return {
      error: {
        message: error.message || 'Erro desconhecido ao buscar métricas',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || {}
      },
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

// Função auxiliar para validar métricas
function validateMetrics(metrics) {
  const requiredFields = [
    'totalCampaigns',
    'activeCampaigns',
    'totalBudget',
    'totalAdsets',
    'totalAds'
  ];

  return requiredFields.every(field => 
    typeof metrics[field] !== 'undefined' && 
    !isNaN(metrics[field])
  );
}

function calculateDetailedMetrics(campaigns) {
  if (!Array.isArray(campaigns)) {
    logger.error({
      msg: 'Dados de campanhas inválidos para cálculo de métricas',
      campaignsType: typeof campaigns,
      campaignsLength: campaigns?.length
    });
    return getEmptyMetrics();
  }

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

  try {
    campaigns.forEach(campaign => {
      if (!campaign) return;

      // Contar campanhas ativas
      if (campaign.status === 'ACTIVE') {
        metrics.activeCampaigns++;
      }

      // Agrupar por status com validação
      const status = campaign.status || 'UNKNOWN';
      if (!metrics.campaignsByStatus[status]) {
        metrics.campaignsByStatus[status] = 0;
        metrics.budgetByStatus[status] = 0;
      }
      metrics.campaignsByStatus[status]++;

      // Agrupar por objetivo com validação
      const objective = campaign.objective || 'UNKNOWN';
      if (!metrics.campaignsByObjective[objective]) {
        metrics.campaignsByObjective[objective] = 0;
      }
      metrics.campaignsByObjective[objective]++;

      // Processar adsets e calcular budgets com validação
      if (campaign.adsets && Array.isArray(campaign.adsets)) {
        metrics.totalAdsets += campaign.adsets.length;
        
        campaign.adsets.forEach(adset => {
          if (!adset) return;

          // Validar e converter budgets
          const dailyBudget = parseFloat(adset.daily_budget || 0);
          const lifetimeBudget = parseFloat(adset.lifetime_budget || 0);
          
          if (isNaN(dailyBudget) || isNaN(lifetimeBudget)) {
            logger.warn({
              msg: 'Budget inválido para adset',
              adsetId: adset.id,
              dailyBudget: adset.daily_budget,
              lifetimeBudget: adset.lifetime_budget
            });
            return;
          }

          // Usar o maior valor entre daily e lifetime
          const budget = Math.max(dailyBudget, lifetimeBudget) / 100;
          
          metrics.totalBudget += budget;
          metrics.budgetByStatus[status] += budget;
          
          // Contar ads com validação
          if (adset.ads && Array.isArray(adset.ads)) {
            metrics.totalAds += adset.ads.length;
          }
        });
      }
    });

    // Validar métricas calculadas
    if (!validateMetrics(metrics)) {
      logger.error({
        msg: 'Métricas inválidas calculadas',
        metrics
      });
      return getEmptyMetrics();
    }

    // Formatar valores monetários
    metrics.totalBudget = Number(metrics.totalBudget.toFixed(2));
    Object.keys(metrics.budgetByStatus).forEach(status => {
      metrics.budgetByStatus[status] = Number(metrics.budgetByStatus[status].toFixed(2));
    });

    return metrics;
  } catch (error) {
    logger.error({
      msg: 'Erro ao calcular métricas detalhadas',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      campaignsCount: campaigns.length
    });
    return getEmptyMetrics();
  }
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