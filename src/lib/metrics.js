/**
 * Calcula métricas de performance a partir dos dados brutos
 * @param {Object} data - Dados brutos da API
 * @returns {Object} Métricas calculadas
 */
export function calculateMetrics(data) {
  if (!data) {
    return {
      ctr: 0,
      cpm: 0,
      cpl: 0,
      totalLeads: 0,
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0
    };
  }

  const {
    spend = 0,
    impressions = 0,
    clicks = 0,
    leads = 0
  } = data;

  // Cálculo das métricas
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpl = leads > 0 ? spend / leads : 0;

  return {
    ctr,
    cpm,
    cpl,
    totalLeads: leads,
    totalSpend: spend,
    totalImpressions: impressions,
    totalClicks: clicks
  };
}

/**
 * Formata um número com separadores de milhar
 * @param {number} number - Número a ser formatado
 * @returns {string} Número formatado
 */
export function formatNumber(number) {
  return new Intl.NumberFormat('pt-BR').format(number);
}

/**
 * Formata um valor monetário em reais
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em reais
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
} 