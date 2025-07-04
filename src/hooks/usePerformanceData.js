// hooks/usePerformanceData.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePerformanceData(dateFrom, dateTo) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gerar dados mockados para teste (vou usar dados reais depois)
      const mockData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        mockData.push({
          date: date.toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'short' 
          }).replace(' de ', ' '),
          spend: Math.random() * 1000 + 500,
          impressions: Math.random() * 10000 + 5000,
          clicks: Math.random() * 500 + 100,
          leads: Math.random() * 50 + 10
        });
      }

      setData(mockData);
    } catch (err) {
      setError(err.message || err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return { data, isLoading: loading, error, refetch: fetchPerformanceData };
}

// Função para processar os dados e calcular métricas
function processPerformanceData(campaigns) {
  // Métricas agregadas
  const aggregatedMetrics = campaigns.reduce((acc, campaign) => {
    const campaignSpend = parseFloat(campaign.spend) || 0;
    const campaignImpressions = parseInt(campaign.impressions) || 0;
    const campaignClicks = parseInt(campaign.clicks) || 0;
    
    // Somar adsets
    const adsetMetrics = campaign.adsets?.reduce((adsetAcc, adset) => ({
      spend: adsetAcc.spend + (parseFloat(adset.spend) || 0),
      impressions: adsetAcc.impressions + (parseInt(adset.impressions) || 0),
      clicks: adsetAcc.clicks + (parseInt(adset.clicks) || 0),
    }), { spend: 0, impressions: 0, clicks: 0 }) || { spend: 0, impressions: 0, clicks: 0 };

    // Somar ads
    const adMetrics = campaign.ads?.reduce((adAcc, ad) => ({
      spend: adAcc.spend + (parseFloat(ad.spend) || 0),
      impressions: adAcc.impressions + (parseInt(ad.impressions) || 0),
      clicks: adAcc.clicks + (parseInt(ad.clicks) || 0),
    }), { spend: 0, impressions: 0, clicks: 0 }) || { spend: 0, impressions: 0, clicks: 0 };

    return {
      spend: acc.spend + campaignSpend + adsetMetrics.spend + adMetrics.spend,
      impressions: acc.impressions + campaignImpressions + adsetMetrics.impressions + adMetrics.impressions,
      clicks: acc.clicks + campaignClicks + adsetMetrics.clicks + adMetrics.clicks,
    };
  }, { spend: 0, impressions: 0, clicks: 0 });

  // Calcular métricas derivadas
  const derivedMetrics = {
    cpm: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.impressions * 1000) : 0,
    ctr: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions * 100) : 0,
    cpc: aggregatedMetrics.clicks > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.clicks) : 0,
  };

  // Dados para gráficos de tendência (agrupar por data)
  const trendData = generateTrendData(campaigns);

  // Dados para comparação por campanha
  const campaignComparison = campaigns.map(campaign => {
    const totalSpend = parseFloat(campaign.spend) || 0;
    const totalImpressions = parseInt(campaign.impressions) || 0;
    const totalClicks = parseInt(campaign.clicks) || 0;
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions * 1000) : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
      cpc: totalClicks > 0 ? (totalSpend / totalClicks) : 0,
    };
  });

  return {
    aggregatedMetrics: { ...aggregatedMetrics, ...derivedMetrics },
    trendData,
    campaignComparison,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
  };
}

// Função para gerar dados de tendência
function generateTrendData(campaigns) {
  const dateMap = new Map();

  campaigns.forEach(campaign => {
    // Simular dados diários baseados na data de criação/atualização
    // Em produção, você teria uma tabela separada para métricas diárias
    const startDate = new Date(campaign.created_time);
    const endDate = new Date(campaign.updated_time || Date.now());
    
    // Gerar pontos de dados para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          spend: 0,
          impressions: 0,
          clicks: 0,
        });
      }
      
      // Distribuir métricas ao longo dos dias (simulação)
      const dailySpend = (parseFloat(campaign.spend) || 0) / 7;
      const dailyImpressions = (parseInt(campaign.impressions) || 0) / 7;
      const dailyClicks = (parseInt(campaign.clicks) || 0) / 7;
      
      const existing = dateMap.get(dateStr);
      dateMap.set(dateStr, {
        date: dateStr,
        spend: existing.spend + dailySpend,
        impressions: existing.impressions + dailyImpressions,
        clicks: existing.clicks + dailyClicks,
      });
    }
  });

  return Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Função auxiliar para calcular limite de data
function getDateLimit(dateRange) {
  const now = new Date();
  switch (dateRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

// Função para exportar dados como CSV
export function exportPerformanceData(data, filename = 'performance_report.csv') {
  if (!data) return;

  const headers = [
    'Campanha',
    'Status',
    'Gasto',
    'Impressões',
    'Cliques',
    'CPM',
    'CTR (%)',
    'CPC'
  ];

  const rows = data.campaignComparison.map(campaign => [
    campaign.name,
    campaign.status,
    campaign.spend.toFixed(2),
    campaign.impressions,
    campaign.clicks,
    campaign.cpm.toFixed(2),
    campaign.ctr.toFixed(2),
    campaign.cpc.toFixed(2)
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Função para buscar dados de leads (para implementação futura)
export async function fetchLeadsData(campaignIds = []) {
  try {
    // Esta função será implementada quando integrarmos com Lead Forms API
    // Por enquanto, retorna dados simulados
    
    const { data: leads, error } = await supabase
      .from('leads') // Tabela que você criará para armazenar leads
      .select('*')
      .in('campaign_id', campaignIds);

    if (error) throw error;
    
    return leads;
  } catch (error) {
    console.error('Erro ao buscar dados de leads:', error);
    return [];
  }
}

// Função para configurar alertas de performance
export async function setupPerformanceAlerts(alerts) {
  try {
    const { data, error } = await supabase
      .from('performance_alerts') // Tabela para alertas
      .upsert(alerts);

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao configurar alertas:', error);
    throw error;
  }
}

// Hook para alertas de performance
export function usePerformanceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkAlerts = async (performanceData) => {
    if (!performanceData) return;

    const newAlerts = [];
    const { campaignComparison } = performanceData;

    campaignComparison.forEach(campaign => {
      // Alerta: CPC muito alto
      if (campaign.cpc > 5.00) {
        newAlerts.push({
          type: 'warning',
          campaign: campaign.name,
          message: `CPC alto: R$ ${campaign.cpc.toFixed(2)}`,
          metric: 'cpc',
          value: campaign.cpc
        });
      }

      // Alerta: CTR muito baixo
      if (campaign.ctr < 1.0 && campaign.impressions > 1000) {
        newAlerts.push({
          type: 'warning',
          campaign: campaign.name,
          message: `CTR baixo: ${campaign.ctr.toFixed(2)}%`,
          metric: 'ctr',
          value: campaign.ctr
        });
      }

      // Alerta: Campanha sem impressões
      if (campaign.status === 'ACTIVE' && campaign.impressions === 0) {
        newAlerts.push({
          type: 'error',
          campaign: campaign.name,
          message: 'Campanha ativa sem impressões',
          metric: 'impressions',
          value: campaign.impressions
        });
      }

      // Alerta: Gasto muito alto sem resultados
      if (campaign.spend > 500 && campaign.clicks < 10) {
        newAlerts.push({
          type: 'error',
          campaign: campaign.name,
          message: `Alto gasto com poucos cliques: R$ ${campaign.spend.toFixed(2)}`,
          metric: 'spend',
          value: campaign.spend
        });
      }
    });

    setAlerts(newAlerts);
    return newAlerts;
  };

  return { alerts, checkAlerts, loading };
}

// Função para comparar performance com período anterior
export async function compareWithPreviousPeriod(currentData, days = 7) {
  try {
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    // Buscar dados do período anterior
    const { data: previousCampaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .gte('updated_time', previousPeriodStart.toISOString())
      .lte('updated_time', previousPeriodEnd.toISOString());

    if (error) throw error;

    const previousMetrics = processPerformanceData(previousCampaigns || []);
    
    // Calcular variações percentuais
    const comparisons = {
      spend: calculatePercentageChange(currentData.aggregatedMetrics.spend, previousMetrics.aggregatedMetrics.spend),
      impressions: calculatePercentageChange(currentData.aggregatedMetrics.impressions, previousMetrics.aggregatedMetrics.impressions),
      clicks: calculatePercentageChange(currentData.aggregatedMetrics.clicks, previousMetrics.aggregatedMetrics.clicks),
      cpm: calculatePercentageChange(currentData.aggregatedMetrics.cpm, previousMetrics.aggregatedMetrics.cpm),
      ctr: calculatePercentageChange(currentData.aggregatedMetrics.ctr, previousMetrics.aggregatedMetrics.ctr),
      cpc: calculatePercentageChange(currentData.aggregatedMetrics.cpc, previousMetrics.aggregatedMetrics.cpc),
    };

    return {
      current: currentData.aggregatedMetrics,
      previous: previousMetrics.aggregatedMetrics,
      comparisons
    };
  } catch (error) {
    console.error('Erro ao comparar com período anterior:', error);
    return null;
  }
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Exemplo de uso no componente React
/*
// No seu componente de dashboard:

import { usePerformanceData, usePerformanceAlerts, exportPerformanceData } from '../hooks/usePerformanceData';

export default function PerformanceDashboard() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7d'
  });

  const { data, loading, error, refetch } = usePerformanceData(filters);
  const { alerts, checkAlerts } = usePerformanceAlerts();

  useEffect(() => {
    if (data) {
      checkAlerts(data);
    }
  }, [data]);

  const handleExport = () => {
    if (data) {
      exportPerformanceData(data, `performance_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    // Seu JSX do dashboard aqui
    // Use data.aggregatedMetrics, data.trendData, data.campaignComparison
  );
}
*/