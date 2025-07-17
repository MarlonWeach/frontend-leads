import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PerformanceInsight, 
  PeriodComparison, 
  DateRange, 
  InsightConfig,
  PerformanceMetric 
} from '@/types/insights';
import { processMetrics, calculateVariation } from '@/utils/performanceAnalysis';
import { usePerformanceData } from './usePerformanceData';
import { supabase } from '@/lib/supabaseClient';

interface UsePerformanceInsightsProps {
  dateRange: DateRange;
  config?: InsightConfig;
}

interface UsePerformanceInsightsReturn {
  insights: PerformanceInsight[];
  comparison: PeriodComparison | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DEFAULT_CONFIG: InsightConfig = {
  threshold: 10,
  maxInsights: 5,
  enableAI: false
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Hook para análise de insights de performance
 * Compara métricas entre períodos e gera insights automáticos
 */
export const usePerformanceInsights = ({
  dateRange,
  config = DEFAULT_CONFIG
}: UsePerformanceInsightsProps): UsePerformanceInsightsReturn => {
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentFilters = useMemo(() => ({
    startDate: toISODate(dateRange.start),
    endDate: toISODate(dateRange.end)
  }), [dateRange.start, dateRange.end]);

  const previousPeriod = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const previousEnd = new Date(dateRange.start);
    const previousStart = new Date(previousEnd.getTime() - duration);
    
    return {
      start: previousStart,
      end: previousEnd
    };
  }, [dateRange.start, dateRange.end]);

  const previousFilters = useMemo(() => ({
    startDate: toISODate(previousPeriod.start),
    endDate: toISODate(previousPeriod.end)
  }), [previousPeriod.start, previousPeriod.end]);

  // Buscar dados de performance por campanha
  const { data: currentData, loading: currentLoading, error: currentError } = usePerformanceData(currentFilters.startDate, currentFilters.endDate);
  const { data: previousData, loading: previousLoading, error: previousError } = usePerformanceData(previousFilters.startDate, previousFilters.endDate);

  const loading = currentLoading || previousLoading;
  const combinedError = currentError || previousError;

  // Função para buscar nomes das campanhas
  const fetchCampaignNames = async (campaignIds: string[]): Promise<Record<string, string>> => {
    if (campaignIds.length === 0) return {};
    
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('id', campaignIds);

      if (error) {
        console.warn('Erro ao buscar nomes das campanhas:', error);
        return {};
      }

      const campaignMap: Record<string, string> = {};
      campaigns?.forEach(campaign => {
        campaignMap[campaign.id] = campaign.name;
      });

      return campaignMap;
    } catch (err) {
      console.warn('Erro ao buscar nomes das campanhas:', err);
      return {};
    }
  };

  useEffect(() => {
    console.log('🔍 [DEBUG] usePerformanceInsights useEffect:', {
      currentData: currentData?.length || 0,
      previousData: previousData?.length || 0,
      loading,
      dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() },
      previousPeriod: { start: previousPeriod.start.toISOString(), end: previousPeriod.end.toISOString() }
    });

    if (currentData && previousData && !loading) {
      try {
        // Se não há dados suficientes, criar insights informativos
        if (currentData.length === 0 && previousData.length === 0) {
          console.log('🔍 [DEBUG] Sem dados para análise - criando insight informativo');
          const infoInsights: PerformanceInsight[] = [{
            id: 'no-data-info',
            type: 'info',
            title: 'Sem dados para análise',
            description: 'Não há dados suficientes na tabela campaign_insights para gerar insights automáticos. Os insights aparecerão quando houver dados de campanhas para comparar.',
            metric: 'geral',
            variation: 0,
            suggestedAction: 'Aguarde a sincronização de dados ou verifique se há campanhas ativas no período selecionado.',
            priority: 'low',
            timestamp: new Date()
          }];
          
          setInsights(infoInsights);
          return;
        }

        console.log('🔍 [DEBUG] Calculando métricas agregadas...');
        // Calcular métricas agregadas para ambos os períodos
        const currentMetrics = calculateAggregatedMetrics(currentData);
        const previousMetrics = calculateAggregatedMetrics(previousData);
        
        console.log('🔍 [DEBUG] Métricas calculadas:', {
          current: currentMetrics,
          previous: previousMetrics
        });

        // Calcular variações
        const performanceMetrics = calculatePerformanceMetrics(currentMetrics, previousMetrics);
        console.log('🔍 [DEBUG] Variações calculadas:', performanceMetrics);

        // Gerar insights
        const generatedInsights = processMetrics(performanceMetrics, {
          threshold: 10,
          maxInsights: 5,
          enableAI: false
        });
        
        console.log('🔍 [DEBUG] Insights gerados:', generatedInsights);
        
        setInsights(generatedInsights);
      } catch (error) {
        console.error('🔍 [DEBUG] Erro ao gerar insights:', error);
        setError('Erro ao calcular insights');
      }
    } else {
      console.log('🔍 [DEBUG] Aguardando dados ou carregando...');
    }
  }, [currentData, previousData, loading, dateRange.start, dateRange.end, previousPeriod.start, previousPeriod.end]);

  useEffect(() => {
    if (combinedError) {
      setError(combinedError);
    }
  }, [combinedError]);

  const refresh = useCallback(() => {}, []);

  return {
    insights,
    comparison: null, // Não implementado para unitário
    loading,
    error,
    refresh
  };
};

// Helper functions

/**
 * Calcula métricas agregadas para um conjunto de dados
 */
const calculateAggregatedMetrics = (data: any[]) => {
  const totals = data.reduce((acc, item) => {
    acc.leads += item.leads || 0;
    acc.spend += item.spend || 0;
    acc.impressions += item.impressions || 0;
    acc.clicks += item.clicks || 0;
    return acc;
  }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });

  // Calcular métricas derivadas
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;

  return {
    ...totals,
    ctr,
    cpl
  };
};

/**
 * Calcula variações de performance entre dois períodos
 */
const calculatePerformanceMetrics = (current: any, previous: any): PerformanceMetric[] => {
  const calculateVariation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  return [
    {
      name: 'leads',
      value: current.leads,
      previousValue: previous.leads,
      variation: current.leads - previous.leads,
      variationPercent: calculateVariation(current.leads, previous.leads),
      isSignificant: Math.abs(calculateVariation(current.leads, previous.leads)) >= 10,
      unit: 'leads'
    },
    {
      name: 'spend',
      value: current.spend,
      previousValue: previous.spend,
      variation: current.spend - previous.spend,
      variationPercent: calculateVariation(current.spend, previous.spend),
      isSignificant: Math.abs(calculateVariation(current.spend, previous.spend)) >= 10,
      unit: 'R$'
    },
    {
      name: 'impressions',
      value: current.impressions,
      previousValue: previous.impressions,
      variation: current.impressions - previous.impressions,
      variationPercent: calculateVariation(current.impressions, previous.impressions),
      isSignificant: Math.abs(calculateVariation(current.impressions, previous.impressions)) >= 10,
      unit: 'impressões'
    },
    {
      name: 'clicks',
      value: current.clicks,
      previousValue: previous.clicks,
      variation: current.clicks - previous.clicks,
      variationPercent: calculateVariation(current.clicks, previous.clicks),
      isSignificant: Math.abs(calculateVariation(current.clicks, previous.clicks)) >= 10,
      unit: 'cliques'
    },
    {
      name: 'ctr',
      value: current.ctr,
      previousValue: previous.ctr,
      variation: current.ctr - previous.ctr,
      variationPercent: calculateVariation(current.ctr, previous.ctr),
      isSignificant: Math.abs(calculateVariation(current.ctr, previous.ctr)) >= 10,
      unit: '%'
    },
    {
      name: 'cpl',
      value: current.cpl,
      previousValue: previous.cpl,
      variation: current.cpl - previous.cpl,
      variationPercent: calculateVariation(current.cpl, previous.cpl),
      isSignificant: Math.abs(calculateVariation(current.cpl, previous.cpl)) >= 10,
      unit: 'R$'
    }
  ];
}; 