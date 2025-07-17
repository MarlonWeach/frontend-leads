import { PerformanceMetric, PerformanceInsight, InsightConfig } from '../types/insights';

/**
 * Calcula a variação percentual entre dois valores
 */
export const calculateVariation = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Verifica se uma variação é significativa baseada no threshold
 */
export const isSignificantChange = (variation: number, threshold: number = 10): boolean => {
  return Math.abs(variation) >= threshold;
};

/**
 * Categoriza um insight baseado na variação e métrica
 */
export const categorizeInsight = (
  variation: number, 
  metric: string
): 'success' | 'warning' | 'info' | 'critical' => {
  const absVariation = Math.abs(variation);
  
  // Métricas onde redução é positiva
  const positiveReductionMetrics = ['cpl', 'spend'];
  const isPositiveReduction = positiveReductionMetrics.includes(metric.toLowerCase());
  
  // Determina se a variação é positiva ou negativa
  const isPositive = isPositiveReduction ? variation < 0 : variation > 0;
  
  if (absVariation >= 50) {
    return isPositive ? 'success' : 'critical';
  } else if (absVariation >= 25) {
    return isPositive ? 'success' : 'warning';
  } else if (absVariation >= 10) {
    return isPositive ? 'info' : 'warning';
  } else {
    return 'info';
  }
};

/**
 * Gera título para insight baseado na métrica e variação
 */
export const generateInsightTitle = (metric: string, variation: number): string => {
  const absVariation = Math.abs(variation);
  const isPositive = variation > 0;
  
  const metricNames: Record<string, string> = {
    cpl: 'CPL',
    ctr: 'CTR',
    leads: 'Leads',
    spend: 'Gastos',
    impressions: 'Impressões',
    clicks: 'Cliques'
  };
  
  const metricName = metricNames[metric.toLowerCase()] || metric;
  
  if (absVariation >= 50) {
    return isPositive 
      ? `${metricName} Aumentou Significativamente`
      : `${metricName} Reduziu Significativamente`;
  } else if (absVariation >= 25) {
    return isPositive 
      ? `${metricName} Aumentou Consideravelmente`
      : `${metricName} Reduziu Consideravelmente`;
  } else {
    return isPositive 
      ? `${metricName} Aumentou`
      : `${metricName} Reduziu`;
  }
};

/**
 * Gera sugestão de ação baseada na métrica e variação
 */
export const generateSuggestedAction = (metric: string, variation: number): string => {
  const isPositive = variation > 0;
  const absVariation = Math.abs(variation);
  
  const metricNames: Record<string, string> = {
    cpl: 'CPL',
    ctr: 'CTR',
    leads: 'Leads',
    spend: 'Gastos',
    impressions: 'Impressões',
    clicks: 'Cliques'
  };
  
  const metricName = metricNames[metric.toLowerCase()] || metric;
  
  if (metric.toLowerCase() === 'cpl') {
    return isPositive 
      ? 'Revisar estratégia de segmentação e criativos para reduzir custos'
      : 'Aumentar investimento para aproveitar a eficiência';
  } else if (metric.toLowerCase() === 'ctr') {
    return isPositive 
      ? 'Manter estratégia atual, criativos estão performando bem'
      : 'Revisar criativos e segmentação para melhorar engajamento';
  } else if (metric.toLowerCase() === 'leads') {
    return isPositive 
      ? 'Aumentar investimento para gerar mais leads'
      : 'Investigar possíveis problemas na conversão';
  } else if (metric.toLowerCase() === 'spend') {
    return isPositive 
      ? 'Monitorar ROI para garantir eficiência do investimento'
      : 'Considerar aumentar orçamento se performance for boa';
  } else {
    return isPositive 
      ? 'Manter estratégia atual'
      : 'Investigar possíveis problemas';
  }
};

/**
 * Determina prioridade do insight baseado na magnitude da variação
 */
export const determinePriority = (variation: number): 'high' | 'medium' | 'low' => {
  const absVariation = Math.abs(variation);
  
  if (absVariation >= 50) return 'high';
  if (absVariation >= 25) return 'medium';
  return 'low';
};

/**
 * Processa métricas e gera insights
 */
export const processMetrics = (
  metrics: PerformanceMetric[], 
  config: InsightConfig = { threshold: 10, maxInsights: 5, enableAI: false }
): PerformanceInsight[] => {
  const significantMetrics = metrics.filter(metric => 
    isSignificantChange(metric.variationPercent, config.threshold)
  );
  
  // Ordena por magnitude da variação (maior primeiro)
  const sortedMetrics = significantMetrics.sort((a, b) => 
    Math.abs(b.variationPercent) - Math.abs(a.variationPercent)
  );
  
  // Limita ao número máximo de insights
  const limitedMetrics = sortedMetrics.slice(0, config.maxInsights);
  
  const insights = limitedMetrics.map(metric => ({
    id: `insight-${metric.name}-${Date.now()}`,
    type: categorizeInsight(metric.variationPercent, metric.name),
    title: generateInsightTitle(metric.name, metric.variationPercent),
    description: `${metric.name} variou ${metric.variationPercent.toFixed(1)}% (de ${metric.previousValue.toLocaleString()} para ${metric.value.toLocaleString()})`,
    metric: metric.name,
    variation: metric.variationPercent,
    suggestedAction: generateSuggestedAction(metric.name, metric.variationPercent),
    priority: determinePriority(metric.variationPercent),
    timestamp: new Date()
  }));
  
  return insights;
};

/**
 * Formata número para exibição
 */
export const formatNumber = (value: number, unit?: string): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit || ''}`;
  } else {
    return value.toLocaleString();
  }
};

/**
 * Formata variação percentual
 */
export const formatVariation = (variation: number): string => {
  const sign = variation > 0 ? '+' : '';
  return `${sign}${variation.toFixed(1)}%`;
}; 