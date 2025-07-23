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

// Cache TTL
const CACHE_TTL = 60; // CORREÇÃO: 1 minuto para atualizações mais frequentes

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
 * Buscar dados históricos do Supabase com período focado na tendência recente
 */
const fetchHistoricalData = async (
  startDate: string,
  endDate: string,
  metrics: string[]
): Promise<{ [key: string]: number[] }> => {
  // CORREÇÃO CRÍTICA: Excluir o dia atual da análise por estar incompleto
  // Usar apenas dias completos para análise de tendências precisas
  const endDateTime = new Date(endDate);
  const yesterday = new Date(endDateTime);
  yesterday.setDate(endDateTime.getDate() - 1); // Último dia completo
  
  const recentStartDate = new Date(yesterday);
  recentStartDate.setDate(yesterday.getDate() - 6); // 7 dias completos (excluindo hoje)
  
  const historicalStartDate = recentStartDate.toISOString().split('T')[0];
  const finalEndDate = yesterday.toISOString().split('T')[0];
  
  console.log(`🔍 Buscando dados completos: ${historicalStartDate} até ${finalEndDate} (7 dias completos, excluindo hoje que está incompleto)`);
  
  const { data, error } = await supabase
    .from('adset_insights')
    .select('date, leads, spend, impressions, clicks')
    .gte('date', historicalStartDate)
    .lte('date', finalEndDate) // Excluir hoje
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar dados históricos: ${error.message}`);
  }

  console.log(`📊 Dados históricos encontrados: ${data?.length || 0} registros da tabela adset_insights`);

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

  console.log(`📊 Dados agregados por data: ${Object.keys(dailyData).length} dias únicos (dias completos)`);

  // Calcular métricas derivadas e organizar em arrays ordenados por data
  const result: { [key: string]: number[] } = {};
  metrics.forEach(metric => {
    result[metric] = [];
  });

  // Ordenar datas e processar
  const sortedDates = Object.keys(dailyData).sort();
  console.log(`📅 Período de análise: ${sortedDates[0]} até ${sortedDates[sortedDates.length - 1]}`);
  
  sortedDates.forEach(date => {
    const dayData = dailyData[date];
    
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
  metricName: string
): ForecastData[] => {
  const historicalData = validateAndCleanData(rawHistoricalData, metricName);
  
  console.log(`📊 Forecast ${metricName}: ${rawHistoricalData.length} dados brutos → ${historicalData.length} dados limpos`);
  
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
    
    return Array.from({ length: daysToForecast }, (_, i) => {
      const date = format(addDays(new Date(), i + 1), 'yyyy-MM-dd');
      const prediction = applyBusinessConstraints(fallbackValue, metricName);
      
      return {
        date,
        predicted: prediction,
        confidence: 'low' as const,
        min: prediction * 0.8,
        max: prediction * 1.2
      };
    });
  }

  // ANÁLISE INTELIGENTE COM PESO PONDERADO
  const analysis = calculateWeightedTrend(historicalData);
  const { slope, intercept, acceleration, weightedAverage, recentTrend } = analysis;
  
  console.log(`🎯 Análise ${metricName}:`);
  console.log(`   • Slope: ${slope.toFixed(4)}`);
  console.log(`   • Média ponderada: ${weightedAverage.toFixed(2)}`);
  console.log(`   • Aceleração: ${acceleration.toFixed(2)}`);
  console.log(`   • Tendência recente: ${recentTrend}`);

  // Gerar previsões baseadas na análise inteligente
  const forecast: ForecastData[] = [];
  const n = historicalData.length;
  
  for (let i = 1; i <= daysToForecast; i++) {
    const date = format(addDays(new Date(), i), 'yyyy-MM-dd');
    
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
      // Definir ontem e amanhã
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      // Histórico: do (yesterday - (data.length - 1)) até ontem
      historical[metric] = data.map((value, index) => {
        const dateObj = new Date(yesterday);
        dateObj.setDate(yesterday.getDate() - (data.length - 1 - index));
        const dateStr = dateObj.toISOString().split('T')[0];
        return {
          date: dateStr,
          predicted: value,
          confidence: 'high' as const,
          min: value,
          max: value,
          actual: value
        };
      });
      // Previsão: começa em amanhã (today + 1)
      forecast[metric] = generateIntelligentForecast(data, daysToForecast, metric);
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
      
      // CORREÇÃO CRÍTICA: Para CTR e CPL, usar AVERAGE como métrica principal
      if (metric === 'ctr' || metric === 'cpl') {
        metricsSummary[metric] = {
          trend,
          confidence,
          next7Days: {
            average: Number(average.toFixed(2)), // MÉTRICA PRINCIPAL para CTR/CPL
            total: Number(total.toFixed(2)),     // Manter para compatibilidade
            min: Number(min.toFixed(2)),
            max: Number(max.toFixed(2))
          }
        };
      } else {
        // Para leads, spend, impressions, clicks: manter total como principal
        metricsSummary[metric] = {
          trend,
          confidence,
          next7Days: {
            total: Math.round(total),              // MÉTRICA PRINCIPAL para volume
            average: Number(average.toFixed(2)),
            min: Math.round(min),
            max: Math.round(max)
          }
        };
      }
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
          aiUsed: true // Agora usando algoritmo de análise inteligente
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