import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForecastResponse, ForecastRequest, UseForecastOptions, FORECAST_METRICS, ForecastData } from '../types/forecast';

interface ForecastDataMap {
  [key: string]: ForecastData[];
}

interface UsePerformanceForecastReturn {
  data: ForecastResponse['data'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  metrics: typeof FORECAST_METRICS;
}

/**
 * Hook para buscar previsões de performance
 */
export const usePerformanceForecast = (options: UseForecastOptions): UsePerformanceForecastReturn => {
  const { dateRange, config, enabled = true } = options;
  
  // Configuração padrão
  const defaultConfig = {
    historicalDays: 30,
    forecastDays: 7,
    confidenceThreshold: 0.1,
    enableAI: false
  };
  
  const finalConfig = { ...defaultConfig, ...config };

  // Preparar parâmetros da requisição
  const requestParams = useMemo((): ForecastRequest => {
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    
    return {
      startDate,
      endDate,
      metrics: Object.keys(FORECAST_METRICS), // Todas as métricas disponíveis
      daysToForecast: finalConfig.forecastDays
    };
  }, [dateRange.start, dateRange.end, finalConfig.forecastDays]);

  // Query para buscar previsões
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['performance-forecast', requestParams],
    queryFn: async (): Promise<ForecastResponse> => {
      const res = await fetch('/api/performance/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ ERRO NA RESPOSTA:', errorData);
        throw new Error(errorData.error || 'Erro ao buscar previsões');
      }

      const jsonData = await res.json();
      return jsonData;
    },
    enabled: enabled && !!dateRange.start && !!dateRange.end,
    staleTime: 60 * 1000, // 1 minuto
    retry: 2,
    retryDelay: 1000,
  });

  // Processar resposta
  const processedData = useMemo(() => {
    if (!response?.success || !response.data) {
      return null;
    }

    return response.data;
  }, [response]);

  // Processar erro
  const errorMessage = useMemo(() => {
    if (error instanceof Error) {
      return error.message;
    }
    return null;
  }, [error]);

  return {
    data: processedData,
    loading: isLoading,
    error: errorMessage,
    refetch,
    metrics: FORECAST_METRICS
  };
};

// Função auxiliar para formatar datas
function format(date: Date, formatString: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return formatString
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day);
} 