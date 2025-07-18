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
 * Calcular intervalo de confiança
 */
const calculateConfidenceInterval = (
  data: number[],
  prediction: number,
  daysAhead: number
): { min: number; max: number; confidence: 'high' | 'medium' | 'low' } => {
  if (data.length < 3) {
    return { min: prediction * 0.8, max: prediction * 1.2, confidence: 'low' };
  }

  // Calcular desvio padrão dos dados históricos
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  // Intervalo de confiança baseado no desvio padrão e dias à frente
  const uncertainty = stdDev * Math.sqrt(daysAhead) * 0.5;
  const min = Math.max(0, prediction - uncertainty);
  const max = prediction + uncertainty;

  // Determinar nível de confiança baseado na variabilidade dos dados
  const coefficientOfVariation = stdDev / mean;
  let confidence: 'high' | 'medium' | 'low';
  
  if (coefficientOfVariation < 0.2) confidence = 'high';
  else if (coefficientOfVariation < 0.5) confidence = 'medium';
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
 * Gerar previsões para uma métrica
 */
const generateForecast = (
  historicalData: number[],
  daysToForecast: number,
  metricName: string
): ForecastData[] => {
  if (historicalData.length < 3) {
    // Dados insuficientes - retornar previsões baseadas na média
    const average = historicalData.length > 0 
      ? historicalData.reduce((a, b) => a + b, 0) / historicalData.length 
      : 0;
    
    return Array.from({ length: daysToForecast }, (_, i) => {
      const date = format(addDays(new Date(), i + 1), 'yyyy-MM-dd');
      return {
        date,
        predicted: average,
        confidence: 'low' as const,
        min: average * 0.5,
        max: average * 1.5
      };
    });
  }

  // Calcular tendência linear
  const { slope, intercept } = calculateLinearTrend(historicalData);
  
  // Gerar previsões
  const forecast: ForecastData[] = [];
  
  for (let i = 1; i <= daysToForecast; i++) {
    const date = format(addDays(new Date(), i), 'yyyy-MM-dd');
    const basePrediction = intercept + slope * (historicalData.length + i);
    
    // Aplicar ajustes baseados na métrica
    let prediction = basePrediction;
    
    // Ajustes específicos por métrica
    switch (metricName) {
      case 'leads':
        prediction = Math.max(0, Math.round(prediction));
        break;
      case 'spend':
        prediction = Math.max(0, prediction);
        break;
      case 'ctr':
        prediction = Math.max(0, Math.min(100, prediction));
        break;
      case 'cpl':
        prediction = Math.max(0, prediction);
        break;
      case 'impressions':
        prediction = Math.max(0, Math.round(prediction));
        break;
      case 'clicks':
        prediction = Math.max(0, Math.round(prediction));
        break;
    }
    
    const confidenceInterval = calculateConfidenceInterval(historicalData, prediction, i);
    
    forecast.push({
      date,
      predicted: prediction,
      confidence: confidenceInterval.confidence,
      min: confidenceInterval.min,
      max: confidenceInterval.max
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

    // Calcular métricas agregadas
    const metricsSummary: any = {};
    
    metrics.forEach(metric => {
      const forecastData = forecast[metric];
      const total = forecastData.reduce((sum, day) => sum + day.predicted, 0);
      const average = total / forecastData.length;
      const min = Math.min(...forecastData.map(d => d.predicted));
      const max = Math.max(...forecastData.map(d => d.predicted));
      
      // Determinar tendência
      const metricHistoricalData = historicalData[metric] || [];
      const recentTrend = metricHistoricalData.length >= 7 
        ? metricHistoricalData.slice(-7).reduce((a, b) => a + b, 0) / 7
        : metricHistoricalData.length > 0 
          ? metricHistoricalData.reduce((a, b) => a + b, 0) / metricHistoricalData.length 
          : 0;
      
      let trend: 'up' | 'down' | 'stable';
      if (average > recentTrend * 1.1) trend = 'up';
      else if (average < recentTrend * 0.9) trend = 'down';
      else trend = 'stable';
      
      metricsSummary[metric] = {
        trend,
        confidence: forecastData[0]?.confidence || 'low',
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