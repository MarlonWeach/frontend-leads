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
    if (currentData && previousData && !loading) {
      try {
        // Se não há dados suficientes, criar insights informativos
        if (currentData.length === 0 && previousData.length === 0) {
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
          setError(null);
          return;
        }

        // Agrupar por campaign_id
        const groupByCampaign = (arr: any[]) => {
          const map = new Map<string, any[]>();
          arr.forEach(item => {
            if (!map.has(item.campaign_id)) map.set(item.campaign_id, []);
            map.get(item.campaign_id)!.push(item);
          });
          return map;
        };
        const currentMap = groupByCampaign(currentData);
        const previousMap = groupByCampaign(previousData);

        const allCampaignIds = Array.from(new Set([
          ...Array.from(currentMap.keys()),
          ...Array.from(previousMap.keys())
        ]));

        // Se não há campanhas, criar insight informativo
        if (allCampaignIds.length === 0) {
          const infoInsights: PerformanceInsight[] = [{
            id: 'no-campaigns-info',
            type: 'info',
            title: 'Nenhuma campanha encontrada',
            description: 'Não foram encontradas campanhas com dados para análise no período selecionado.',
            metric: 'geral',
            variation: 0,
            suggestedAction: 'Verifique se há campanhas ativas ou ajuste o período de análise.',
            priority: 'low',
            timestamp: new Date()
          }];
          
          setInsights(infoInsights);
          setError(null);
          return;
        }

        // Buscar nomes das campanhas
        fetchCampaignNames(allCampaignIds).then(campaignNames => {
          const allInsights: PerformanceInsight[] = [];
          allCampaignIds.forEach(campaignId => {
            // Agregar métricas do período
            const aggregate = (arr: any[]) => arr.reduce((acc, item) => {
              acc.leads += item.leads || 0;
              acc.spend += item.spend || 0;
              acc.impressions += item.impressions || 0;
              acc.clicks += item.clicks || 0;
              return acc;
            }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });

            const current = aggregate(currentMap.get(campaignId) || []);
            const previous = aggregate(previousMap.get(campaignId) || []);

            // Calcular métricas derivadas
            current.ctr = current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0;
            current.cpl = current.leads > 0 ? current.spend / current.leads : 0;
            previous.ctr = previous.impressions > 0 ? (previous.clicks / previous.impressions) * 100 : 0;
            previous.cpl = previous.leads > 0 ? previous.spend / previous.leads : 0;

            // Gerar métricas para comparação
            const metrics: PerformanceMetric[] = [
              { name: 'leads', value: current.leads, previousValue: previous.leads, variation: current.leads - previous.leads, variationPercent: calculateVariation(current.leads, previous.leads), isSignificant: false, unit: 'leads' },
              { name: 'spend', value: current.spend, previousValue: previous.spend, variation: current.spend - previous.spend, variationPercent: calculateVariation(current.spend, previous.spend), isSignificant: false, unit: 'R$' },
              { name: 'impressions', value: current.impressions, previousValue: previous.impressions, variation: current.impressions - previous.impressions, variationPercent: calculateVariation(current.impressions, previous.impressions), isSignificant: false, unit: 'impressões' },
              { name: 'clicks', value: current.clicks, previousValue: previous.clicks, variation: current.clicks - previous.clicks, variationPercent: calculateVariation(current.clicks, previous.clicks), isSignificant: false, unit: 'cliques' },
              { name: 'ctr', value: current.ctr, previousValue: previous.ctr, variation: current.ctr - previous.ctr, variationPercent: calculateVariation(current.ctr, previous.ctr), isSignificant: false, unit: '%' },
              { name: 'cpl', value: current.cpl, previousValue: previous.cpl, variation: current.cpl - previous.cpl, variationPercent: calculateVariation(current.cpl, previous.cpl), isSignificant: false, unit: 'R$' },
            ];

            // Marcar métricas significativas
            metrics.forEach(m => { m.isSignificant = Math.abs(m.variationPercent) >= config.threshold; });

            // Gerar insights para métricas significativas
            const campaignInsights = processMetrics(metrics, config).map(insight => ({
              ...insight,
              campaignId,
              campaignName: campaignNames[campaignId] || campaignId,
            }));

            allInsights.push(...campaignInsights);
          });

          setInsights(allInsights);
          setError(null);
        });
      } catch (err) {
        console.error('❌ Erro ao processar insights:', err);
        setError(err instanceof Error ? err.message : 'Erro ao processar insights');
        setInsights([]);
      }
    }
  }, [currentData, previousData, loading, dateRange.start, dateRange.end, previousPeriod.start, previousPeriod.end, config]);

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