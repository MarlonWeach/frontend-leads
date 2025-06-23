import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const fetchAdsets = async ({ campaignId, startDate, endDate, status, hasImpressions }) => {
  try {
    const response = await fetch('/api/meta/adsets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        startDate,
        endDate,
        status,
        hasImpressions
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar adsets: ${response.status}`);
    }

    const data = await response.json();
    return data.adsets || [];
  } catch (error) {
    console.error('Erro ao buscar adsets:', error);
    throw error;
  }
};

export const useAdsetsData = ({ 
  campaignId = null, 
  startDate = null, 
  endDate = null,
  status = null,
  hasImpressions = true // Por padrão, mostrar apenas adsets com impressões nos últimos 30 dias
} = {}) => {
  const [adsets, setAdsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usar React Query para cache e gerenciamento de estado
  const {
    data: adsetsData,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['adsets', campaignId, startDate, endDate, status, hasImpressions],
    queryFn: () => fetchAdsets({ campaignId, startDate, endDate, status, hasImpressions }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Atualizar estado local quando os dados mudarem
  useEffect(() => {
    if (adsetsData) {
      setAdsets(adsetsData);
    }
  }, [adsetsData]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (queryError) {
      setError(queryError);
    }
  }, [queryError]);

  // Função para atualizar manualmente
  const refreshAdsets = async () => {
    try {
      setLoading(true);
      setError(null);
      await refetch();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas agregadas
  const aggregatedMetrics = adsets.reduce((acc, adset) => {
    const insights = adset.insights || [];
    const totalInsights = insights.reduce((sum, insight) => ({
      spend: sum.spend + (insight.spend || 0),
      impressions: sum.impressions + (insight.impressions || 0),
      clicks: sum.clicks + (insight.clicks || 0),
      results: sum.results + (insight.results || 0),
    }), { spend: 0, impressions: 0, clicks: 0, results: 0 });

    return {
      totalAdsets: acc.totalAdsets + 1,
      totalSpend: acc.totalSpend + totalInsights.spend,
      totalImpressions: acc.totalImpressions + totalInsights.impressions,
      totalClicks: acc.totalClicks + totalInsights.clicks,
      totalResults: acc.totalResults + totalInsights.results,
    };
  }, {
    totalAdsets: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalResults: 0,
  });

  // Calcular métricas derivadas
  const metrics = {
    ...aggregatedMetrics,
    ctr: aggregatedMetrics.impressions > 0 
      ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100 
      : 0,
    cpc: aggregatedMetrics.clicks > 0 
      ? aggregatedMetrics.spend / aggregatedMetrics.clicks 
      : 0,
    cpm: aggregatedMetrics.impressions > 0 
      ? (aggregatedMetrics.spend / aggregatedMetrics.impressions) * 1000 
      : 0,
    conversionRate: aggregatedMetrics.clicks > 0 
      ? (aggregatedMetrics.results / aggregatedMetrics.clicks) * 100 
      : 0,
  };

  return {
    adsets,
    loading,
    error,
    metrics,
    refreshAdsets,
    refetch,
  };
};

export default useAdsetsData; 