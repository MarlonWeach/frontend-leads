import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, format } from 'date-fns';
import { buildHistoricalDateRange } from '@/utils/forecastDateRanges';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const createSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

import { ForecastRequest, ForecastResponse, ForecastData, FORECAST_METRICS } from '../../../../src/types/forecast';
import { serverCache } from '../../../../src/utils/server-cache';

// Cache TTL
const CACHE_TTL = 60; // CORREÇÃO: 1 minuto para atualizações mais frequentes
const HISTORICAL_WINDOW_DAYS = 30;
const MIN_SEASONALITY_DAYS = 21;
const MIN_SEASONALITY_STRENGTH = 0.08;
const SCENARIO_FACTORS = {
  conservative: 0.9,
  realistic: 1,
  optimistic: 1.1
};
const ACCURACY_VALIDATION_DAYS = 7;
const ACCURACY_THRESHOLD = {
  healthy: 0.2,
  warning: 0.35
};

// Bounds realistas para cada métrica de marketing digital
const METRIC_BOUNDS = {
  leads: { min: 0, max: 10000 }, // 0 a 10k leads por dia
  spend: { min: 0, max: 100000 }, // R$ 0 a 100k gastos por dia
  ctr: { min: 0, max: 15 }, // 0% a 15% CTR (valores acima são suspeitos)
  cpl: { min: 1, max: 1000 }, // R$ 1 a R$ 1000 CPL
  impressions: { min: 0, max: 10000000 }, // 0 a 10M impressões por dia
  clicks: { min: 0, max: 500000 } // 0 a 500k cliques por dia
};

/**
 * Detectar outliers usando o método IQR (Interquartile Range)
 */
const detectOutliers = (data: number[]): number[] => {
  if (data.length < 4) return data; // Dados insuficientes para detecção
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return data.filter(value => value >= lowerBound && value <= upperBound);
};

/**
 * Validar e limpar dados
 */
const validateAndCleanData = (data: number[], metricName: string): number[] => {
  const bounds = METRIC_BOUNDS[metricName as keyof typeof METRIC_BOUNDS];
  if (!bounds) return data;
  
  // Filtrar valores impossíveis
  let cleanData = data.filter(value => 
    value >= bounds.min && 
    value <= bounds.max && 
    !isNaN(value) && 
    isFinite(value)
  );
  
  // Remover outliers se temos dados suficientes
  if (cleanData.length >= 4) {
    cleanData = detectOutliers(cleanData);
  }
  
  return cleanData;
};

/**
 * Aplicar constraints de negócio
 */
const applyBusinessConstraints = (prediction: number, metricName: string): number => {
  const bounds = METRIC_BOUNDS[metricName as keyof typeof METRIC_BOUNDS];
  if (!bounds) return prediction;
  
  return Math.max(bounds.min, Math.min(bounds.max, prediction));
};

/**
 * Calcular tendência linear simples
 */
const calculateLinearTrend = (data: number[]): { slope: number; intercept: number } => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };

  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

type WeeklySeasonality = {
  enabled: boolean;
  strength: number;
  weekdayMultipliers: number[];
  monthlyMultipliers: number[];
  weeklyStrength: number;
  monthlyStrength: number;
};

type AccuracyMetrics = {
  mape: number;
  sampleSize: number;
  status: 'healthy' | 'warning' | 'critical';
};

type PredictiveAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  title: string;
  message: string;
};

type BudgetRecommendation = {
  id: string;
  action: 'increase' | 'decrease' | 'maintain';
  scope: 'global' | 'campaign' | 'adset';
  reason: string;
  expectedImpact: string;
};

const calculateAccuracyMetrics = (actual: number[], predicted: number[]): AccuracyMetrics => {
  const sampleSize = Math.min(actual.length, predicted.length);
  if (sampleSize === 0) {
    return {
      mape: 0,
      sampleSize: 0,
      status: 'critical'
    };
  }

  const safePairs = Array.from({ length: sampleSize }, (_, index) => ({
    actual: actual[index] ?? 0,
    predicted: predicted[index] ?? 0
  }));

  const mapeValues = safePairs
    .filter(pair => pair.actual !== 0)
    .map(pair => Math.abs((pair.actual - pair.predicted) / pair.actual));
  const mape =
    mapeValues.length > 0
      ? mapeValues.reduce((sum, value) => sum + value, 0) / mapeValues.length
      : 0;

  let status: 'healthy' | 'warning' | 'critical' = 'critical';
  if (mape <= ACCURACY_THRESHOLD.healthy) status = 'healthy';
  else if (mape <= ACCURACY_THRESHOLD.warning) status = 'warning';

  return {
    mape: Number(mape.toFixed(4)),
    sampleSize,
    status
  };
};

const roundByMetric = (value: number, metricName: string): number => {
  if (!isFinite(value)) return 0;
  switch (metricName) {
    case 'leads':
    case 'impressions':
    case 'clicks':
      return Math.round(value);
    case 'spend':
    case 'cpl':
    case 'ctr':
      return Math.round(value * 100) / 100;
    default:
      return value;
  }
};

const fetchContractRemainingLeads = async (params: {
  referenceDate: string;
  adsetId?: string;
  campaignId?: string;
}): Promise<{ remainingLeads: number; scope: 'global' | 'campaign' | 'adset' } | null> => {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  let targetAdsetIds: string[] | null = null;
  let scope: 'global' | 'campaign' | 'adset' = 'global';

  if (params.adsetId) {
    targetAdsetIds = [params.adsetId];
    scope = 'adset';
  } else if (params.campaignId) {
    scope = 'campaign';
    const { data: campaignRows } = await supabase
      .from('v_ml_adset_daily_series')
      .select('adset_id')
      .eq('campaign_id', params.campaignId)
      .limit(5000);

    const ids = Array.from(new Set((campaignRows || []).map(row => row.adset_id).filter(Boolean)));
    targetAdsetIds = ids;
  }

  let goalsQuery = supabase
    .from('adset_goals')
    .select('adset_id, volume_contracted, volume_captured, contract_start_date, contract_end_date')
    .lte('contract_start_date', params.referenceDate)
    .gte('contract_end_date', params.referenceDate);

  if (targetAdsetIds && targetAdsetIds.length > 0) {
    goalsQuery = goalsQuery.in('adset_id', targetAdsetIds);
  } else if (targetAdsetIds && targetAdsetIds.length === 0) {
    return { remainingLeads: 0, scope };
  }

  const { data: goals } = await goalsQuery;
  if (!goals || goals.length === 0) return null;

  const remainingLeads = goals.reduce((sum, goal) => {
    const contracted = Number(goal.volume_contracted) || 0;
    const captured = Number(goal.volume_captured) || 0;
    return sum + Math.max(0, contracted - captured);
  }, 0);

  return { remainingLeads, scope };
};

const applyLeadContractConstraint = (
  forecast: { [key: string]: ForecastData[] },
  remainingLeads: number
) => {
  const leadsForecast = forecast.leads;
  if (!leadsForecast || leadsForecast.length === 0) return;

  let remaining = Math.max(0, remainingLeads);
  const dayScaleFactors: number[] = [];

  leadsForecast.forEach((point, index) => {
    const original = Math.max(0, Number(point.predicted) || 0);
    const capped = Math.min(original, remaining);
    const factor = original > 0 ? capped / original : 0;
    dayScaleFactors[index] = factor;

    point.predicted = roundByMetric(capped, 'leads');
    point.min = roundByMetric(Math.min(point.min * factor, point.predicted), 'leads');
    point.max = roundByMetric(Math.min(point.max * factor, point.predicted), 'leads');

    remaining -= capped;
  });

  (['spend', 'impressions', 'clicks'] as const).forEach(metricName => {
    const metricForecast = forecast[metricName];
    if (!metricForecast) return;

    metricForecast.forEach((point, index) => {
      const factor = dayScaleFactors[index] ?? 1;
      point.predicted = roundByMetric(point.predicted * factor, metricName);
      point.min = roundByMetric(point.min * factor, metricName);
      point.max = roundByMetric(point.max * factor, metricName);
    });
  });

  if (forecast.cpl && forecast.spend) {
    forecast.cpl.forEach((point, index) => {
      const leads = forecast.leads[index]?.predicted || 0;
      const spend = forecast.spend[index]?.predicted || 0;
      if (leads > 0) {
        const recomputedCpl = spend / leads;
        point.predicted = roundByMetric(recomputedCpl, 'cpl');
      }
    });
  }
};

const calculateRelativeDeltaPercent = (globalValue: number, segmentedValue: number): number => {
  if (!isFinite(globalValue) || globalValue === 0) return 0;
  return Number((((segmentedValue - globalValue) / globalValue) * 100).toFixed(2));
};

const buildPredictiveAlerts = (
  metricsSummary: Record<string, any>,
  accuracyByMetric: Record<string, AccuracyMetrics>
): PredictiveAlert[] => {
  const alerts: PredictiveAlert[] = [];

  Object.entries(metricsSummary).forEach(([metric, summary]) => {
    const trend = summary?.trend;
    const accuracy = accuracyByMetric[metric];

    if (trend === 'down' && (metric === 'leads' || metric === 'clicks')) {
      alerts.push({
        id: `trend-down-${metric}`,
        severity: 'warning',
        metric,
        title: `Queda projetada em ${metric}`,
        message: `A tendência prevista para ${metric} está em queda no horizonte atual.`
      });
    }

    if (metric === 'cpl' && trend === 'up') {
      alerts.push({
        id: `trend-up-cpl`,
        severity: 'critical',
        metric,
        title: 'CPL em alta',
        message: 'A previsão indica aumento de CPL; considere revisar segmentação e orçamento.'
      });
    }

    if (accuracy?.status === 'critical') {
      alerts.push({
        id: `accuracy-critical-${metric}`,
        severity: 'critical',
        metric,
        title: `Baixa confiabilidade em ${metric}`,
        message: `Erro percentual absoluto medio acima do limite critico para ${metric}. Recomenda-se retreino e revisao de premissas.`
      });
    } else if (accuracy?.status === 'warning') {
      alerts.push({
        id: `accuracy-warning-${metric}`,
        severity: 'warning',
        metric,
        title: `Atenção na acurácia de ${metric}`,
        message: `A acurácia de ${metric} está em faixa de alerta.`
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      id: 'forecast-stable',
      severity: 'info',
      metric: 'global',
      title: 'Forecast estável',
      message: 'Nenhum alerta crítico identificado no horizonte atual.'
    });
  }

  return alerts;
};

const buildBudgetRecommendations = (
  metricsSummary: Record<string, any>,
  adsetId?: string | null,
  campaignId?: string | null
): BudgetRecommendation[] => {
  const recommendations: BudgetRecommendation[] = [];
  const scope: 'global' | 'campaign' | 'adset' = adsetId
    ? 'adset'
    : campaignId
      ? 'campaign'
      : 'global';

  const leads = metricsSummary.leads;
  const cpl = metricsSummary.cpl;
  const spend = metricsSummary.spend;

  if (leads?.trend === 'up' && cpl?.trend !== 'up') {
    recommendations.push({
      id: 'budget-increase-opportunity',
      action: 'increase',
      scope,
      reason: 'Tendência favorável de leads com eficiência estável.',
      expectedImpact: 'Possível ganho de volume mantendo custo por lead em faixa controlada.'
    });
  }

  if (cpl?.trend === 'up' && spend?.trend !== 'up') {
    recommendations.push({
      id: 'budget-decrease-risk',
      action: 'decrease',
      scope,
      reason: 'CPL em deterioração sem melhora proporcional de volume.',
      expectedImpact: 'Redução de desperdício enquanto ajustes de segmentação/criativo são aplicados.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'budget-maintain-stable',
      action: 'maintain',
      scope,
      reason: 'Cenário sem sinais fortes de ganho ou risco no horizonte atual.',
      expectedImpact: 'Manutenção de estabilidade operacional com monitoramento contínuo.'
    });
  }

  return recommendations;
};

const calculateWeeklySeasonality = (
  data: number[],
  baseDate: Date
): WeeklySeasonality => {
  if (data.length < MIN_SEASONALITY_DAYS) {
    return {
      enabled: false,
      strength: 0,
      weekdayMultipliers: Array(7).fill(1),
      monthlyMultipliers: Array(31).fill(1),
      weeklyStrength: 0,
      monthlyStrength: 0
    };
  }

  const weekdayBuckets: number[][] = Array.from({ length: 7 }, () => []);
  const historyLength = data.length;

  data.forEach((value, index) => {
    const pointDate = addDays(baseDate, index - historyLength);
    const weekday = pointDate.getDay();
    weekdayBuckets[weekday].push(value);
  });

  const weekdayMeans = weekdayBuckets.map(bucket => {
    if (bucket.length === 0) return 0;
    return bucket.reduce((sum, value) => sum + value, 0) / bucket.length;
  });

  const globalMean = weekdayMeans.reduce((sum, value) => sum + value, 0) / 7;
  if (!isFinite(globalMean) || globalMean <= 0) {
    return {
      enabled: false,
      strength: 0,
      weekdayMultipliers: Array(7).fill(1),
      monthlyMultipliers: Array(31).fill(1),
      weeklyStrength: 0,
      monthlyStrength: 0
    };
  }

  const multipliers = weekdayMeans.map(value => {
    if (!isFinite(value) || value <= 0) return 1;
    return value / globalMean;
  });

  const variance =
    multipliers.reduce((sum, value) => sum + Math.pow(value - 1, 2), 0) / multipliers.length;
  const weeklyStrength = Math.sqrt(variance);

  const monthlyBuckets: number[][] = Array.from({ length: 31 }, () => []);
  data.forEach((value, index) => {
    const pointDate = addDays(baseDate, index - historyLength);
    const dayOfMonth = pointDate.getDate() - 1;
    monthlyBuckets[dayOfMonth].push(value);
  });

  const monthlyMeans = monthlyBuckets.map((bucket, index) => {
    if (bucket.length === 0) {
      return weekdayMeans[index % 7] || globalMean;
    }
    return bucket.reduce((sum, value) => sum + value, 0) / bucket.length;
  });

  const monthlyMultipliers = monthlyMeans.map(value => {
    if (!isFinite(value) || value <= 0) return 1;
    return value / globalMean;
  });

  const monthlyVariance =
    monthlyMultipliers.reduce((sum, value) => sum + Math.pow(value - 1, 2), 0) /
    monthlyMultipliers.length;
  const monthlyStrength = Math.sqrt(monthlyVariance);

  const enabled =
    weeklyStrength >= MIN_SEASONALITY_STRENGTH || monthlyStrength >= MIN_SEASONALITY_STRENGTH;
  const strength = Math.max(weeklyStrength, monthlyStrength);

  return {
    enabled,
    strength,
    weekdayMultipliers: enabled ? multipliers : Array(7).fill(1),
    monthlyMultipliers: enabled ? monthlyMultipliers : Array(31).fill(1),
    weeklyStrength,
    monthlyStrength
  };
};

/**
 * Calcular intervalo de confiança estatisticamente correto
 */
const calculateConfidenceInterval = (
  data: number[],
  prediction: number,
  daysAhead: number
): { min: number; max: number; confidence: 'high' | 'medium' | 'low' } => {
  if (data.length < 3) {
    return { min: prediction * 0.7, max: prediction * 1.3, confidence: 'low' };
  }

  // Calcular erro padrão da predição
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1);
  const stdError = Math.sqrt(variance);
  
  // Fator t-student para 95% de confiança (aproximação para n > 30, senão usar 2.0)
  const tFactor = n > 30 ? 1.96 : 2.0;
  
  // Intervalo de confiança considerando incerteza da predição
  const predictionError = stdError * Math.sqrt(1 + 1/n + Math.pow(daysAhead, 2) / (n * (n - 1) / 12));
  const margin = tFactor * predictionError;
  
  const min = Math.max(0, prediction - margin);
  const max = prediction + margin;

  // Determinar nível de confiança baseado na qualidade dos dados
  const coefficientOfVariation = stdError / Math.abs(mean);
  let confidence: 'high' | 'medium' | 'low';
  
  if (coefficientOfVariation < 0.15 && n >= 7) confidence = 'high';
  else if (coefficientOfVariation < 0.3 && n >= 5) confidence = 'medium';
  else confidence = 'low';

  return { min, max, confidence };
};

/**
 * Buscar dados históricos do Supabase com período focado na tendência recente
 */
const fetchHistoricalData = async (
  _startDate: string,
  endDate: string,
  metrics: string[],
  adsetId?: string,
  campaignId?: string
): Promise<{ [key: string]: number[] }> => {
  // Série base para forecasting: últimos 30 dias completos da view canônica da 27-1.
  const historicalDates = buildHistoricalDateRange(endDate, HISTORICAL_WINDOW_DAYS);
  const historicalStartDate = historicalDates[0];
  const finalEndDate = historicalDates[historicalDates.length - 1];

  console.log(
    `🔍 Baseline 27-2: ${historicalStartDate} até ${finalEndDate} | adset=${adsetId || 'ALL'} | campaign=${campaignId || 'ALL'}`
  );

  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Erro ao buscar dados históricos: Supabase indisponível');
  }

  let query = supabase
    .from('v_ml_adset_daily_series')
    .select('metric_date, adset_id, leads, spend, impressions, clicks')
    .gte('metric_date', historicalStartDate)
    .lte('metric_date', finalEndDate)
    .order('metric_date', { ascending: true });

  if (adsetId) {
    query = query.eq('adset_id', adsetId);
  }
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message?.includes('fetch failed')) {
      throw new Error('SUPABASE_FETCH_FAILED');
    }
    throw new Error(`Erro ao buscar dados históricos: ${error.message}`);
  }

  console.log(`📊 Dados históricos encontrados: ${data?.length || 0} registros da view v_ml_adset_daily_series`);

  // Agrupar dados por data
  const dailyData: { [date: string]: { leads: number; spend: number; impressions: number; clicks: number } } = {};
  
  data?.forEach(row => {
    const date = row.metric_date;
    if (!dailyData[date]) {
      dailyData[date] = {
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0
      };
    }
    
    dailyData[date].leads += Number(row.leads) || 0;
    dailyData[date].spend += Number(row.spend) || 0;
    dailyData[date].impressions += Number(row.impressions) || 0;
    dailyData[date].clicks += Number(row.clicks) || 0;
  });

  console.log(`📊 Dados agregados por data: ${Object.keys(dailyData).length} dias únicos (dias completos)`);

  // Calcular métricas derivadas com imputação de dias ausentes (série esparsa -> contínua).
  const allDates = historicalDates;
  const result: { [key: string]: number[] } = {};
  metrics.forEach(metric => {
    result[metric] = [];
  });

  console.log(`📅 Série contínua do baseline: ${allDates[0]} até ${allDates[allDates.length - 1]} (${allDates.length} dias)`);
  
  allDates.forEach(date => {
    const dayData = dailyData[date] ?? {
      leads: 0,
      spend: 0,
      impressions: 0,
      clicks: 0
    };
    
    if (metrics.includes('leads')) {
      result.leads.push(dayData.leads);
    }
    if (metrics.includes('spend')) {
      result.spend.push(dayData.spend);
    }
    if (metrics.includes('impressions')) {
      result.impressions.push(dayData.impressions);
    }
    if (metrics.includes('clicks')) {
      result.clicks.push(dayData.clicks);
    }
    if (metrics.includes('ctr')) {
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      result.ctr.push(ctr);
    }
    if (metrics.includes('cpl')) {
      const cpl = dayData.leads > 0 ? dayData.spend / dayData.leads : 0;
      result.cpl.push(cpl);
    }
  });

  // Log do resultado final
  console.log('📊 Resultado final por métrica:');
  Object.keys(result).forEach(metric => {
    const values = result[metric];
    const total = values.reduce((a, b) => a + b, 0);
    console.log(`  ${metric}: ${values.length} valores, total: ${total}`);
  });

  return result;
};

const fetchHistoricalDataFromMeta = async (
  endDate: string,
  metrics: string[]
): Promise<{ [key: string]: number[] }> => {
  const metaAccessToken =
    process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const metaAccountId =
    process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID || '';

  const result: { [key: string]: number[] } = {};
  metrics.forEach(metric => {
    result[metric] = [];
  });

  if (!metaAccessToken || !metaAccountId) {
    return result;
  }

  const metaHistoricalDates = buildHistoricalDateRange(endDate, 7);
  const historicalStartDate = metaHistoricalDates[0];
  const finalEndDate = metaHistoricalDates[metaHistoricalDates.length - 1];

  const normalizedAccountId = metaAccountId.startsWith('act_')
    ? metaAccountId
    : `act_${metaAccountId}`;
  const timeRange = encodeURIComponent(
    JSON.stringify({ since: historicalStartDate, until: finalEndDate })
  );
  const dailyData: Record<string, { leads: number; spend: number; impressions: number; clicks: number }> = {};

  let nextUrl: string | null =
    `https://graph.facebook.com/v25.0/${normalizedAccountId}/insights?fields=date_start,spend,impressions,clicks,actions,results&time_range=${timeRange}&time_increment=1&limit=500`;

  while (nextUrl) {
    const insightsRes: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${metaAccessToken}` }
    });
    const payload = await insightsRes.json();
    if (!insightsRes.ok) {
      throw new Error(payload?.error?.message || 'Erro ao buscar insights da Meta');
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    rows.forEach((insight: any) => {
      const date = insight.date_start || insight.date || historicalStartDate;
      if (!dailyData[date]) {
        dailyData[date] = { leads: 0, spend: 0, impressions: 0, clicks: 0 };
      }
      dailyData[date].spend += Number(insight.spend) || 0;
      dailyData[date].impressions += Number(insight.impressions) || 0;
      dailyData[date].clicks += Number(insight.clicks) || 0;

      const leadsFromResults = Array.isArray(insight.results)
        ? insight.results.reduce((acc: number, row: { indicator?: string; values?: Array<{ value?: string }> }) => {
            if (!row?.indicator?.toLowerCase().includes('lead')) return acc;
            return acc + (Number(row?.values?.[0]?.value) || 0);
          }, 0)
        : 0;
      const leadsFromActions = Array.isArray(insight.actions)
        ? insight.actions.reduce((acc: number, row: { action_type?: string; value?: string }) => {
            if (!row?.action_type?.toLowerCase().includes('lead')) return acc;
            return acc + (Number(row?.value) || 0);
          }, 0)
        : 0;

      dailyData[date].leads += Math.max(leadsFromResults, leadsFromActions);
    });

    nextUrl = payload?.paging?.next || null;
  }

  const sortedDates = Object.keys(dailyData).sort();
  sortedDates.forEach(date => {
    const dayData = dailyData[date];
    if (metrics.includes('leads')) result.leads.push(dayData.leads);
    if (metrics.includes('spend')) result.spend.push(dayData.spend);
    if (metrics.includes('impressions')) result.impressions.push(dayData.impressions);
    if (metrics.includes('clicks')) result.clicks.push(dayData.clicks);
    if (metrics.includes('ctr')) {
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      result.ctr.push(ctr);
    }
    if (metrics.includes('cpl')) {
      const cpl = dayData.leads > 0 ? dayData.spend / dayData.leads : 0;
      result.cpl.push(cpl);
    }
  });

  return result;
};

const persistAccuracySnapshot = async (payload: {
  adsetId: string | null;
  campaignId: string | null;
  metrics: string[];
  accuracy: Record<string, AccuracyMetrics>;
  segmentationComparison?: Record<
    string,
    {
      segmentedTotal: number;
      globalTotal: number;
      deltaPercent: number;
    }
  >;
}) => {
  const supabase = createSupabaseClient();
  if (!supabase) return;

  const averageMapeValues = Object.values(payload.accuracy).map(metric => metric.mape);
  const averageMape =
    averageMapeValues.length > 0
      ? averageMapeValues.reduce((sum, value) => sum + value, 0) / averageMapeValues.length
      : 0;

  const status =
    averageMape <= ACCURACY_THRESHOLD.healthy
      ? 'healthy'
      : averageMape <= ACCURACY_THRESHOLD.warning
        ? 'warning'
        : 'critical';

  // Persistência leve de histórico de accuracy para evolução da 27-6.
  await supabase.from('ai_analysis_logs').insert({
    analysis_type: 'forecast_accuracy',
    status,
    metadata: {
      adsetId: payload.adsetId,
      campaignId: payload.campaignId,
      metrics: payload.metrics,
      accuracy: payload.accuracy,
      segmentationComparison: payload.segmentationComparison,
      averageMape: Number(averageMape.toFixed(4)),
      createdAt: new Date().toISOString()
    }
  });
};

const persistPredictiveAlerts = async (payload: {
  alerts: PredictiveAlert[];
  adsetId: string | null;
  campaignId: string | null;
}) => {
  const supabase = createSupabaseClient();
  if (!supabase || payload.alerts.length === 0) return;

  const targetAdsetId = payload.adsetId || 'global';
  const cooldownThreshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  for (const alert of payload.alerts) {
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('adset_id', targetAdsetId)
      .eq('title', alert.title)
      .eq('alert_type', 'performance_anomaly')
      .in('status', ['active', 'acknowledged'])
      .gte('created_at', cooldownThreshold)
      .limit(1);

    if (existingAlerts && existingAlerts.length > 0) {
      continue;
    }

    await supabase.from('alerts').insert({
      alert_type: 'performance_anomaly',
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      adset_id: targetAdsetId,
      campaign_id: payload.campaignId,
      context: {
        source: 'forecast_predictive_alerts',
        metric: alert.metric,
        generatedAt: new Date().toISOString()
      },
      status: 'active'
    });
  }
};

/**
 * Calcular tendência com peso ponderado (dias recentes têm peso maior)
 */
const calculateWeightedTrend = (data: number[]): { 
  slope: number; 
  intercept: number; 
  acceleration: number;
  weightedAverage: number;
  recentTrend: 'accelerating' | 'decelerating' | 'stable';
} => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, acceleration: 0, weightedAverage: data[0] || 0, recentTrend: 'stable' };

  // PESO EXPONENCIAL MUITO AGRESSIVO: últimos dias dominam completamente
  const weights = data.map((_, i) => Math.pow(2.5, i)); // Peso cresce muito mais rápido
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  // Média ponderada (últimos dias têm peso gigantesco)
  const weightedAverage = data.reduce((sum, value, i) => sum + value * weights[i], 0) / totalWeight;
  
  console.log(`📊 Dados: [${data.join(', ')}]`);
  console.log(`⚖️ Pesos: [${weights.map(w => w.toFixed(1)).join(', ')}]`);
  console.log(`📈 Média ponderada: ${weightedAverage.toFixed(2)} (vs média simples: ${(data.reduce((a,b) => a+b, 0)/n).toFixed(2)})`);

  // Calcular tendência linear ponderada
  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((sum, x, i) => sum + x * weights[i], 0);
  const sumY = data.reduce((sum, y, i) => sum + y * weights[i], 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i] * weights[i], 0);
  const sumXX = xValues.reduce((sum, x, i) => sum + x * x * weights[i], 0);

  const slope = (totalWeight * sumXY - sumX * sumY) / (totalWeight * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / totalWeight;

  // DETECÇÃO DE ACELERAÇÃO MAIS SENSÍVEL: apenas últimos 2-3 dias vs anteriores
  let acceleration = 0;
  let recentTrend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
  
  if (n >= 4) {
    // Pegar últimos 2 dias vs 2 anteriores para ser mais responsivo
    const recent2 = data.slice(-2); // últimos 2 dias
    const previous2 = data.slice(-4, -2); // 2 dias anteriores
    
    const recentAvg = recent2.reduce((a, b) => a + b, 0) / recent2.length;
    const previousAvg = previous2.reduce((a, b) => a + b, 0) / previous2.length;
    
    acceleration = recentAvg - previousAvg;
    const accelerationPercent = previousAvg > 0 ? (acceleration / previousAvg) * 100 : 0;
    
    console.log(`🚀 Aceleração: últimos 2 dias (${recentAvg.toFixed(1)}) vs 2 anteriores (${previousAvg.toFixed(1)}) = ${accelerationPercent.toFixed(1)}%`);
    
    // Limites mais baixos para detectar mudanças mais rapidamente
    if (accelerationPercent > 10) recentTrend = 'accelerating';
    else if (accelerationPercent < -10) recentTrend = 'decelerating';
    else recentTrend = 'stable';
  }

  return { slope, intercept, acceleration, weightedAverage, recentTrend };
};

/**
 * Gerar previsões inteligentes com peso ponderado e detecção de tendências
 */
const generateIntelligentForecast = (
  rawHistoricalData: number[],
  daysToForecast: number,
  metricName: string,
  baseDate?: Date // Adicionar parâmetro para data base
): { points: ForecastData[]; seasonality: WeeklySeasonality } => {
  const historicalData = validateAndCleanData(rawHistoricalData, metricName);
  
  console.log(`📊 Forecast ${metricName}: ${rawHistoricalData.length} dados brutos → ${historicalData.length} dados limpos`);
  
  // Usar data base fornecida ou data atual como fallback
  const forecastBaseDate = baseDate || new Date();
  
  if (historicalData.length < 3) {
    // Usar último valor disponível como base para poucos dados
    const lastValue = historicalData[historicalData.length - 1] || 0;
    const fallbackValue = lastValue > 0 ? lastValue : 
                         metricName === 'leads' ? 50 : 
                         metricName === 'spend' ? 500 : 
                         metricName === 'ctr' ? 2.5 :
                         metricName === 'cpl' ? 15 : 
                         metricName === 'impressions' ? 5000 : 100;
    
    console.log(`⚠️ Poucos dados para ${metricName}. Usando último valor: ${lastValue} ou fallback: ${fallbackValue}`);
    
    const points = Array.from({ length: daysToForecast }, (_, i) => {
      const date = format(addDays(forecastBaseDate, i + 1), 'yyyy-MM-dd');
      const prediction = applyBusinessConstraints(fallbackValue, metricName);
      
      return {
        date,
        predicted: prediction,
        confidence: 'low' as const,
        min: prediction * 0.8,
        max: prediction * 1.2
      };
    });
    return {
      points,
      seasonality: {
        enabled: false,
        strength: 0,
        weekdayMultipliers: Array(7).fill(1),
        monthlyMultipliers: Array(31).fill(1),
        weeklyStrength: 0,
        monthlyStrength: 0
      }
    };
  }

  // ANÁLISE INTELIGENTE COM PESO PONDERADO
  const analysis = calculateWeightedTrend(historicalData);
  const { slope, intercept, acceleration, weightedAverage, recentTrend } = analysis;
  const weeklySeasonality = calculateWeeklySeasonality(historicalData, forecastBaseDate);
  
  console.log(`🎯 Análise ${metricName}:`);
  console.log(`   • Slope: ${slope.toFixed(4)}`);
  console.log(`   • Média ponderada: ${weightedAverage.toFixed(2)}`);
  console.log(`   • Aceleração: ${acceleration.toFixed(2)}`);
  console.log(`   • Tendência recente: ${recentTrend}`);

  // Gerar previsões baseadas na análise inteligente
  const forecast: ForecastData[] = [];
  const n = historicalData.length;
  
  for (let i = 1; i <= daysToForecast; i++) {
    const date = format(addDays(forecastBaseDate, i), 'yyyy-MM-dd');
    
    // BASE: Regressão linear ponderada
    let basePrediction = intercept + slope * (n - 1 + i);
    
    // APLICAR FATOR DE ACELERAÇÃO para dias recentes
    if (recentTrend === 'accelerating') {
      // Se está acelerando, aplicar fator de crescimento
      const accelerationFactor = 1 + (acceleration / weightedAverage) * 0.3; // 30% do impacto da aceleração
      basePrediction *= accelerationFactor;
      console.log(`🚀 Aplicando fator de aceleração ${accelerationFactor.toFixed(3)} ao dia ${i}`);
    } else if (recentTrend === 'decelerating') {
      // Se está desacelerando, aplicar fator de desaceleração
      const decelerationFactor = 1 + (acceleration / weightedAverage) * 0.2; // 20% do impacto da desaceleração
      basePrediction *= Math.max(0.7, decelerationFactor); // não deixar cair muito
      console.log(`📉 Aplicando fator de desaceleração ${decelerationFactor.toFixed(3)} ao dia ${i}`);
    }
    
    // Para primeiros dias, dar ainda mais peso à média recente
    if (i <= 3) {
      const recentWeight = Math.max(0.3, 0.8 - i * 0.1); // 80%, 70%, 60% de peso dos dados recentes
      basePrediction = basePrediction * (1 - recentWeight) + weightedAverage * recentWeight;
      console.log(`🎯 Dia ${i}: Aplicando peso recente ${(recentWeight*100).toFixed(0)}%, previsão: ${basePrediction.toFixed(2)}`);
    }

    if (weeklySeasonality.enabled) {
      const forecastDate = addDays(forecastBaseDate, i);
      const weekday = forecastDate.getDay();
      const weekdayFactor = weeklySeasonality.weekdayMultipliers[weekday] || 1;
      const monthDayFactor = weeklySeasonality.monthlyMultipliers[forecastDate.getDate() - 1] || 1;
      basePrediction *= weekdayFactor * monthDayFactor;
    }
    
    // Aplicar constraints de negócio
    let prediction = applyBusinessConstraints(basePrediction, metricName);
    
    // Ajustes específicos por métrica
    switch (metricName) {
      case 'leads':
      case 'impressions':
      case 'clicks':
        prediction = Math.round(prediction);
        break;
      case 'spend':
      case 'cpl':
        prediction = Math.round(prediction * 100) / 100;
        break;
      case 'ctr':
        prediction = Math.round(prediction * 100) / 100;
        break;
    }
    
    // Intervalo de confiança baseado na análise inteligente
    const confidenceInterval = calculateConfidenceInterval(historicalData, prediction, i);
    
    // Ajustar confiança baseada na qualidade da tendência
    let confidence: 'high' | 'medium' | 'low';
    if (historicalData.length >= 7 && (recentTrend === 'accelerating' || recentTrend === 'decelerating')) {
      confidence = 'high';
    } else if (historicalData.length >= 5) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    forecast.push({
      date,
      predicted: prediction,
      confidence,
      min: applyBusinessConstraints(confidenceInterval.min, metricName),
      max: applyBusinessConstraints(confidenceInterval.max, metricName)
    });
  }
  
  return {
    points: forecast,
    seasonality: weeklySeasonality
  };
};

/**
 * Endpoint POST para previsões de performance
 */
export async function POST(request: NextRequest) {
  try {
    const body: ForecastRequest = await request.json();
    const { startDate, endDate, metrics, daysToForecast = 7, adsetId, campaignId } = body;

    // Validar parâmetros
    if (!startDate || !endDate || !metrics || metrics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros startDate, endDate e metrics são obrigatórios'
      }, { status: 400 });
    }

    // Verificar cache
    const cacheKey = `forecast:${startDate}:${endDate}:${metrics.join(',')}:${daysToForecast}:${adsetId || 'all'}:${campaignId || 'all'}`;
    const cached = await serverCache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit para forecast: ${cacheKey}`);
      return NextResponse.json(cached);
    }

    console.log(`🔮 Forecast API: Gerando previsões para ${metrics.join(', ')}`);

    // Buscar dados históricos
    let historicalData: { [key: string]: number[] };
    try {
      historicalData = await fetchHistoricalData(startDate, endDate, metrics, adsetId, campaignId);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '';
      if (message.includes('SUPABASE_FETCH_FAILED')) {
        historicalData = await fetchHistoricalDataFromMeta(endDate, metrics);
      } else {
        throw fetchError;
      }
    }
    
    let globalHistoricalData: { [key: string]: number[] } | null = null;
    if (adsetId || campaignId) {
      globalHistoricalData = await fetchHistoricalData(startDate, endDate, metrics);
    }

    // Gerar previsões para cada métrica
    const forecast: { [key: string]: ForecastData[] } = {};
    const historical: { [key: string]: ForecastData[] } = {};
    const seasonalityByMetric: Record<string, WeeklySeasonality> = {};
    const accuracyByMetric: Record<string, AccuracyMetrics> = {};
    const segmentationComparison: Record<
      string,
      {
        segmentedTotal: number;
        globalTotal: number;
        deltaPercent: number;
      }
    > = {};
    
    const historicalDates = buildHistoricalDateRange(endDate, HISTORICAL_WINDOW_DAYS);

    metrics.forEach(metric => {
      const data = historicalData[metric] || [];
      
      // CORREÇÃO: Usar a data do período selecionado como base para previsões
      const baseDate = new Date(endDate + 'T00:00:00');
      
      const metricHistoricalDates = historicalDates.slice(-data.length);

      // Histórico: usa o mesmo período consultado para evitar deslocar labels por data do servidor.
      historical[metric] = data.map((value, index) => {
        const dateStr = metricHistoricalDates[index];
        return {
          date: dateStr,
          predicted: value,
          confidence: 'high' as const,
          min: value,
          max: value,
          actual: value
        };
      });
      // Previsão: começa no dia seguinte ao período selecionado
      const forecastResult = generateIntelligentForecast(data, daysToForecast, metric, baseDate);
      forecast[metric] = forecastResult.points;
      seasonalityByMetric[metric] = forecastResult.seasonality;

      const validationHistory = data.slice(0, Math.max(0, data.length - ACCURACY_VALIDATION_DAYS));
      const validationActual = data.slice(-ACCURACY_VALIDATION_DAYS);
      const validationBaseDate = addDays(baseDate, -ACCURACY_VALIDATION_DAYS);
      const validationForecast = generateIntelligentForecast(
        validationHistory,
        validationActual.length,
        metric,
        validationBaseDate
      );
      const validationPredicted = validationForecast.points.map(point => point.predicted);
      accuracyByMetric[metric] = calculateAccuracyMetrics(validationActual, validationPredicted);
    });

    const contractConstraint = await fetchContractRemainingLeads({
      referenceDate: endDate,
      adsetId,
      campaignId
    });
    if (contractConstraint && contractConstraint.remainingLeads >= 0) {
      applyLeadContractConstraint(forecast, contractConstraint.remainingLeads);
    }

    // Calcular métricas agregadas com análise de tendência melhorada
    const metricsSummary: any = {};
    
    metrics.forEach(metric => {
      const forecastData = forecast[metric];
      const total = forecastData.reduce((sum, day) => sum + day.predicted, 0);
      const average = total / forecastData.length;
      const min = Math.min(...forecastData.map(d => d.predicted));
      const max = Math.max(...forecastData.map(d => d.predicted));
      
      // Determinar tendência usando slope estatístico
      const metricHistoricalData = historicalData[metric] || [];
      const cleanedData = validateAndCleanData(metricHistoricalData, metric);
      
      let trend: 'up' | 'down' | 'stable';
      let confidence: 'high' | 'medium' | 'low' = 'low';
      
      if (cleanedData.length >= 3) {
        const { slope } = calculateLinearTrend(cleanedData);
        const meanValue = cleanedData.reduce((a, b) => a + b, 0) / cleanedData.length;
        
        // Calcular significância do slope (% de mudança por dia)
        const slopePercent = meanValue > 0 ? (slope / meanValue) * 100 : 0;
        
        // Thresholds baseados no tipo de métrica
        const thresholds = metric === 'ctr' || metric === 'cpl' ? 
          { up: 2, down: -2 } : // Métricas de eficiência: ±2%
          { up: 5, down: -5 };  // Métricas de volume: ±5%
        
        if (slopePercent > thresholds.up) trend = 'up';
        else if (slopePercent < thresholds.down) trend = 'down';
        else trend = 'stable';
        
        // Confidence baseado na qualidade dos dados
        if (cleanedData.length >= 7 && Math.abs(slopePercent) > 1) confidence = 'high';
        else if (cleanedData.length >= 4) confidence = 'medium';
        else confidence = 'low';
        
        console.log(`📈 Tendência ${metric}: slope=${slope.toFixed(4)}, slope%=${slopePercent.toFixed(2)}%, trend=${trend}, confidence=${confidence}`);
      } else {
        trend = 'stable';
        confidence = 'low';
      }
      
      // CORREÇÃO CRÍTICA: Para CTR e CPL, usar AVERAGE como métrica principal
      if (metric === 'ctr' || metric === 'cpl') {
        const conservative = average * SCENARIO_FACTORS.conservative;
        const realistic = average * SCENARIO_FACTORS.realistic;
        const optimistic = average * SCENARIO_FACTORS.optimistic;
        metricsSummary[metric] = {
          trend,
          confidence,
          next7Days: {
            average: Number(average.toFixed(2)), // MÉTRICA PRINCIPAL para CTR/CPL
            total: Number(total.toFixed(2)),     // Manter para compatibilidade
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2))
          },
          scenarios: {
            conservative: Number(conservative.toFixed(2)),
            realistic: Number(realistic.toFixed(2)),
            optimistic: Number(optimistic.toFixed(2))
          }
        };
      } else {
        // Para leads, spend, impressions, clicks: manter total como principal
        const conservative = total * SCENARIO_FACTORS.conservative;
        const realistic = total * SCENARIO_FACTORS.realistic;
        const optimistic = total * SCENARIO_FACTORS.optimistic;
        metricsSummary[metric] = {
          trend,
          confidence,
          next7Days: {
            total: Math.round(total),              // MÉTRICA PRINCIPAL para volume
            average: Number(average.toFixed(2)),
            min: Math.round(min),
            max: Math.round(max)
          },
          scenarios: {
            conservative: Math.round(conservative),
            realistic: Math.round(realistic),
            optimistic: Math.round(optimistic)
          }
        };
      }

      if (globalHistoricalData) {
        const globalMetricData = globalHistoricalData[metric] || [];
        const globalForecastResult = generateIntelligentForecast(
          globalMetricData,
          daysToForecast,
          metric,
          new Date(endDate + 'T00:00:00')
        );
        const globalTotal = globalForecastResult.points.reduce((sum, day) => sum + day.predicted, 0);
        segmentationComparison[metric] = {
          segmentedTotal: Number(total.toFixed(2)),
          globalTotal: Number(globalTotal.toFixed(2)),
          deltaPercent: calculateRelativeDeltaPercent(globalTotal, total)
        };
      }
    });

    const predictiveAlerts = buildPredictiveAlerts(metricsSummary, accuracyByMetric);
    const budgetRecommendations = buildBudgetRecommendations(
      metricsSummary,
      adsetId || null,
      campaignId || null
    );

    const response: ForecastResponse = {
      success: true,
      data: {
        historical: historical as any,
        forecast: forecast as any,
        metrics: metricsSummary,
        metadata: {
          generatedAt: new Date().toISOString(),
          historicalDays: Object.values(historicalData)[0]?.length || 0,
          forecastDays: daysToForecast,
          aiUsed: true,
          baselineModel: 'forecast_baseline_v1',
          source: 'v_ml_adset_daily_series',
          adsetId: adsetId || null,
          campaignId: campaignId || null,
          seasonality: seasonalityByMetric,
          scenarioModel: 'forecast_scenarios_v1',
          accuracy: accuracyByMetric,
          contractConstraint: contractConstraint
            ? {
                enabled: true,
                remainingLeads: contractConstraint.remainingLeads,
                scope: contractConstraint.scope
              }
            : {
                enabled: false,
                remainingLeads: 0,
                scope: adsetId ? 'adset' : campaignId ? 'campaign' : 'global'
              },
          predictiveAlerts,
          budgetRecommendations,
          segmentationComparison: Object.keys(segmentationComparison).length > 0 ? segmentationComparison : undefined
        }
      }
    };

    // Salvar no cache
    await serverCache.set(cacheKey, response, CACHE_TTL);

    try {
      await persistAccuracySnapshot({
        adsetId: adsetId || null,
        campaignId: campaignId || null,
        metrics,
        accuracy: accuracyByMetric,
        segmentationComparison:
          Object.keys(segmentationComparison).length > 0 ? segmentationComparison : undefined
      });
    } catch (persistError) {
      console.warn('⚠️ Falha ao persistir histórico de accuracy:', persistError);
    }

    try {
      await persistPredictiveAlerts({
        alerts: predictiveAlerts,
        adsetId: adsetId || null,
        campaignId: campaignId || null
      });
    } catch (alertPersistError) {
      console.warn('⚠️ Falha ao persistir alertas preditivos:', alertPersistError);
    }

    console.log(`✅ Forecast gerado com sucesso para ${metrics.length} métricas`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro na API de forecast:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
} 