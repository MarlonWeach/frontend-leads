import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const fetchAdsets = async ({ campaignId, startDate, endDate, status, limit = 100 }) => {
  try {
    console.log('useAdsetsData: Fazendo requisição para API', { campaignId, startDate, endDate, status, limit });
    
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
        limit
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro ao buscar adsets: ${response.status} - ${errorData.details || errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    console.log('useAdsetsData: Dados recebidos', { 
      count: data.adsets?.length || 0, 
      responseTime: data.meta?.responseTime,
      filters: data.meta?.filters 
    });
    
    return data.adsets || [];
  } catch (error) {
    console.error('useAdsetsData: Erro ao buscar adsets:', error);
    throw error;
  }
};

export const useAdsetsData = ({ 
  campaignId = null, 
  startDate = null, 
  endDate = null,
  status = null,
  limit = 100
} = {}) => {
  const [adsets, setAdsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usar React Query para cache e gerenciamento de estado
  const {
    data: adsetsData,
    isLoading,
    error: queryError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adsets', campaignId, startDate, endDate, status, limit],
    queryFn: () => fetchAdsets({ campaignId, startDate, endDate, status, limit }),
    staleTime: 2 * 60 * 1000, // 2 minutos (dados podem mudar frequentemente)
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Atualizar estado local quando os dados mudarem
  useEffect(() => {
    if (adsetsData) {
      setAdsets(adsetsData);
      console.log('useAdsetsData: Estado atualizado', { count: adsetsData.length });
    }
  }, [adsetsData]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (queryError) {
      setError(queryError);
      console.error('useAdsetsData: Erro do React Query:', queryError);
    }
  }, [queryError]);

  // Função para atualizar manualmente
  const refreshAdsets = async () => {
    try {
      console.log('useAdsetsData: Atualização manual solicitada');
      setLoading(true);
      setError(null);
      await refetch();
    } catch (err) {
      setError(err);
      console.error('useAdsetsData: Erro na atualização manual:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas agregadas dos dados já agregados da API
  const aggregatedMetrics = adsets.reduce((acc, adset) => {
    return {
      totalAdsets: acc.totalAdsets + 1,
      totalSpend: acc.totalSpend + (parseFloat(adset.spend) || 0),
      totalImpressions: acc.totalImpressions + (parseInt(adset.impressions) || 0),
      totalClicks: acc.totalClicks + (parseInt(adset.clicks) || 0),
      totalLeads: acc.totalLeads + (parseInt(adset.leads) || 0),
    };
  }, {
    totalAdsets: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
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
      ? (aggregatedMetrics.totalLeads / aggregatedMetrics.clicks) * 100 
      : 0,
  };

  return {
    adsets,
    loading: loading || isFetching,
    error,
    metrics,
    refreshAdsets,
    refetch,
    isFetching,
  };
};

export default useAdsetsData; 