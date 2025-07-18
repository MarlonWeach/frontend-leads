import { PeriodComparison, AggregatedMetrics, CampaignData } from '../types/comparisons';

export interface PeriodCalculationData {
  metrics: AggregatedMetrics;
  campaigns: CampaignData[];
}

/**
 * Calcula comparações entre dois períodos
 */
export const calculateComparisons = (
  currentData: PeriodCalculationData,
  previousData: PeriodCalculationData
): PeriodComparison[] => {
  const metrics = [
    { key: 'totalLeads', name: 'leads' },
    { key: 'totalSpend', name: 'spend' },
    { key: 'totalImpressions', name: 'impressions' },
    { key: 'totalClicks', name: 'clicks' },
    { key: 'averageCTR', name: 'ctr' },
    { key: 'averageCPL', name: 'cpl' },
    { key: 'averageROI', name: 'roi' }
  ];
  
  return metrics.map(({ key, name }) => {
    const current = currentData.metrics[key as keyof AggregatedMetrics] || 0;
    const previous = previousData.metrics[key as keyof AggregatedMetrics] || 0;
    const variation = current - previous;
    const variationPercent = previous > 0 ? (variation / previous) * 100 : 0;
    
    return {
      metric: name,
      current: Number(current),
      previous: Number(previous),
      variation: Number(variation),
      variationPercent: Number(variationPercent),
      trend: getTrend(variationPercent)
    };
  });
};

/**
 * Determina a tendência baseada na variação percentual
 */
const getTrend = (variationPercent: number): 'up' | 'down' | 'stable' => {
  if (variationPercent > 5) return 'up';
  if (variationPercent < -5) return 'down';
  return 'stable';
};

/**
 * Calcula período anterior baseado na duração do período atual
 */
export const calculatePreviousPeriod = (
  startDate: string,
  endDate: string
): { start: string; end: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = end.getTime() - start.getTime();
  
  // O período anterior termina 1 dia antes do período atual começar
  const previousEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const previousStart = new Date(previousEnd.getTime() - duration);
  
  return {
    start: previousStart.toISOString().split('T')[0],
    end: previousEnd.toISOString().split('T')[0]
  };
};

/**
 * Calcula métricas agregadas a partir de dados de campanhas
 */
export const calculateAggregatedMetrics = (campaigns: any[]): AggregatedMetrics => {
  if (!campaigns || campaigns.length === 0) {
    return {
      totalLeads: 0,
      totalSpend: 0,
      averageCTR: 0,
      averageCPL: 0,
      averageROI: 0,
      totalImpressions: 0,
      totalClicks: 0
    };
  }

  const totals = campaigns.reduce((acc, campaign) => {
    const leads = Number(campaign.leads) || 0;
    const spend = Number(campaign.spend) || 0;
    const impressions = Number(campaign.impressions) || 0;
    const clicks = Number(campaign.clicks) || 0;

    return {
      leads: acc.leads + leads,
      spend: acc.spend + spend,
      impressions: acc.impressions + impressions,
      clicks: acc.clicks + clicks
    };
  }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });

  // Calcular métricas derivadas
  const averageCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const averageCPL = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const averageROI = totals.spend > 0 ? (totals.leads / totals.spend) * 100 : 0;

  return {
    totalLeads: totals.leads,
    totalSpend: Number(totals.spend.toFixed(2)),
    averageCTR: Number(averageCTR.toFixed(2)),
    averageCPL: Number(averageCPL.toFixed(2)),
    averageROI: Number(averageROI.toFixed(2)),
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks
  };
};

/**
 * Avalia a qualidade dos dados baseado na completude
 */
export const assessDataQuality = (
  currentData: PeriodCalculationData,
  previousData: PeriodCalculationData
): 'complete' | 'partial' | 'limited' => {
  const currentCampaigns = currentData.campaigns.length;
  const previousCampaigns = previousData.campaigns.length;
  
  if (currentCampaigns === 0 && previousCampaigns === 0) {
    return 'limited';
  }
  
  if (currentCampaigns > 0 && previousCampaigns > 0) {
    return 'complete';
  }
  
  return 'partial';
};

/**
 * Gera chave de cache baseada nos parâmetros
 */
export const generateCacheKey = (
  startDate: string,
  endDate: string,
  granularity: string = 'campaign',
  campaignIds?: string[]
): string => {
  const campaignIdsStr = campaignIds ? campaignIds.sort().join(',') : 'all';
  return `comparisons:${startDate}:${endDate}:${granularity}:${campaignIdsStr}`;
}; 