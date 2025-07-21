import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, format, subDays } from 'date-fns';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

// Criar cliente Supabase para o servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

import { ForecastRequest, ForecastResponse, ForecastData, FORECAST_METRICS } from '../../../../src/types/forecast';
import { serverCache } from '../../../../src/utils/server-cache';

const CACHE_TTL = 60 * 60; // 1 hora

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
 * Buscar dados históricos do Supabase
 */
const fetchHistoricalData = async (
  startDate: string,
  endDate: string,
  metrics: string[]
): Promise<{ [key: string]: number[] }> => {
  const { data, error } = await supabase
    .from('campaign_insights')
    .select('date, leads, spend, impressions, clicks')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar dados históricos: ${error.message}`);
  }

  // Agrupar dados por data
  const dailyData: { [date: string]: any } = {};
  
  data?.forEach(row => {
    const date = row.date;
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

  // Calcular métricas derivadas e preparar arrays
  const result: { [key: string]: number[] } = {};
  
  metrics.forEach(metric => {
    result[metric] = [];
  });

  // Ordenar datas e extrair valores
  const sortedDates = Object.keys(dailyData).sort();
  
  sortedDates.forEach(date => {
    const dayData = dailyData[date];
    
    // Leads
    if (metrics.includes('leads')) {
      result.leads.push(dayData.leads);
    }
    
    // Spend
    if (metrics.includes('spend')) {
      result.spend.push(dayData.spend);
    }
    
    // Impressions
    if (metrics.includes('impressions')) {
      result.impressions.push(dayData.impressions);
    }
    
    // Clicks
    if (metrics.includes('clicks')) {
      result.clicks.push(dayData.clicks);
    }
    
    // CTR
    if (metrics.includes('ctr')) {
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      result.ctr.push(ctr);
    }
    
    // CPL
    if (metrics.includes('cpl')) {
      const cpl = dayData.leads > 0 ? dayData.spend / dayData.leads : 0;
      result.cpl.push(cpl);
    }
  });

  return result;
};

/**
 * Gerar previsões para uma métrica com validação e constraints
 */
const generateForecast = (
  rawHistoricalData: number[],
  daysToForecast: number,
  metricName: string
): ForecastData[] => {
  // Validar e limpar dados históricos
  const historicalData = validateAndCleanData(rawHistoricalData, metricName);
  
  console.log(`📊 Forecast ${metricName}: ${rawHistoricalData.length} dados brutos → ${historicalData.length} dados limpos`);
  
  if (historicalData.length < 2) {
    // Dados insuficientes - usar valor padrão conservador
    const fallbackValue = metricName === 'leads' ? 10 : 
                         metricName === 'spend' ? 100 : 
                         metricName === 'ctr' ? 2 :
                         metricName === 'cpl' ? 50 : 
                         metricName === 'impressions' ? 1000 : 50;
    
    return Array.from({ length: daysToForecast }, (_, i) => {
      const date = format(addDays(new Date(), i + 1), 'yyyy-MM-dd');
      const prediction = applyBusinessConstraints(fallbackValue, metricName);
      
      return {
        date,
        predicted: prediction,
        confidence: 'low' as const,
        min: prediction * 0.5,
        max: prediction * 2
      };
    });
  }

  // Calcular tendência linear
  const { slope, intercept } = calculateLinearTrend(historicalData);
  
  // Gerar previsões
  const forecast: ForecastData[] = [];
  const n = historicalData.length;
  
  for (let i = 1; i <= daysToForecast; i++) {
    const date = format(addDays(new Date(), i), 'yyyy-MM-dd');
    
    // CORREÇÃO CRÍTICA: Fórmula correta de regressão linear
    const basePrediction = intercept + slope * (n - 1 + i);
    
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
        prediction = Math.round(prediction * 100) / 100; // 2 casas decimais
        break;
      case 'ctr':
        prediction = Math.round(prediction * 100) / 100; // 2 casas decimais
        break;
    }
    
    const confidenceInterval = calculateConfidenceInterval(historicalData, prediction, i);
    
    // Aplicar constraints também nos intervalos
    const constrainedMin = applyBusinessConstraints(confidenceInterval.min, metricName);
    const constrainedMax = applyBusinessConstraints(confidenceInterval.max, metricName);
    
    forecast.push({
      date,
      predicted: prediction,
      confidence: confidenceInterval.confidence,
      min: constrainedMin,
      max: constrainedMax
    });
  }
  
  return forecast;
};

/**
 * Endpoint POST para previsões de performance
 */
export async function POST(request: NextRequest) {
  try {
    const body: ForecastRequest = await request.json();
    const { startDate, endDate, metrics, daysToForecast = 7 } = body;

    // Validar parâmetros
    if (!startDate || !endDate || !metrics || metrics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros startDate, endDate e metrics são obrigatórios'
      }, { status: 400 });
    }

    // Verificar cache
    const cacheKey = `forecast:${startDate}:${endDate}:${metrics.join(',')}:${daysToForecast}`;
    const cached = await serverCache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit para forecast: ${cacheKey}`);
      return NextResponse.json(cached);
    }

    console.log(`🔮 Forecast API: Gerando previsões para ${metrics.join(', ')}`);

    // Buscar dados históricos
    const historicalData = await fetchHistoricalData(startDate, endDate, metrics);
    
    // Gerar previsões para cada métrica
    const forecast: { [key: string]: ForecastData[] } = {};
    const historical: { [key: string]: ForecastData[] } = {};
    
    metrics.forEach(metric => {
      const data = historicalData[metric] || [];
      
      // Preparar dados históricos
      historical[metric] = data.map((value, index) => {
        const date = format(addDays(new Date(startDate), index), 'yyyy-MM-dd');
        return {
          date,
          predicted: value,
          confidence: 'high' as const,
          min: value,
          max: value,
          actual: value
        };
      });
      
      // Gerar previsões
      forecast[metric] = generateForecast(data, daysToForecast, metric);
    });

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
      
      metricsSummary[metric] = {
        trend,
        confidence,
        next7Days: {
          total,
          average,
          min,
          max
        }
      };
    });

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
          aiUsed: false // Por enquanto usando apenas algoritmo linear
        }
      }
    };

    // Salvar no cache
    await serverCache.set(cacheKey, response, CACHE_TTL);

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