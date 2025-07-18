import { useState, useEffect, useCallback } from 'react';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache em memória para os dados
const cache = new Map();

function generateCacheKey(filters) {
  return `ads_${JSON.stringify(filters)}`;
}

function isCacheValid(cacheEntry) {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

const fetchAds = async ({ campaignId, adsetId, startDate, endDate, status, limit = 1000 }) => {
  const response = await fetch('/api/meta/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, adsetId, startDate, endDate, status, limit })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erro ao buscar ads: ${response.status} - ${errorData.details || errorData.error || 'Erro desconhecido'}`);
  }
  const data = await response.json();
  return data.ads || [];
};

export const useAdsData = (filters = {}) => {
  const {
    campaignId = null,
    adsetId = null,
    startDate = null,
    endDate = null,
    status = 'ACTIVE',
    limit = 1000
  } = filters;

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = generateCacheKey(filters);
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && isCacheValid(cachedData)) {
        setAds(cachedData.data);
        setLoading(false);
        return;
      }
      
      const data = await fetchAds({ campaignId, adsetId, startDate, endDate, status, limit });
      
      // Cache dos dados
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      setAds(data);
    } catch (err) {
      setError(err.message || 'Erro ao buscar dados');
      console.error('Erro ao buscar ads:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, adsetId, startDate, endDate, status, limit, filters]);

  // Função para atualizar manualmente
  const refreshAds = async () => {
    setIsFetching(true);
    try {
      // Limpar cache para forçar nova busca
      const cacheKey = generateCacheKey(filters);
      cache.delete(cacheKey);
      
      await fetchData();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar dados');
    } finally {
      setIsFetching(false);
    }
  };

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Métricas agregadas
  const totalSpend = ads.reduce((acc, ad) => acc + (parseFloat(ad.spend) || 0), 0);
  const totalImpressions = ads.reduce((acc, ad) => acc + (parseInt(ad.impressions) || 0), 0);
  const totalClicks = ads.reduce((acc, ad) => acc + (parseInt(ad.clicks) || 0), 0);
  const totalLeads = ads.reduce((acc, ad) => acc + (parseInt(ad.leads) || 0), 0);

  const metrics = {
    totalAds: ads.length,
    totalSpend,
    totalImpressions,
    totalClicks,
    totalLeads,
    // Cálculo correto das médias agregadas baseado nos totais
    averageCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    averageCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
    averageCPM: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    averageCPL: totalLeads > 0 ? totalSpend / totalLeads : 0
  };

  return { ads, loading, error, metrics, refreshAds, isFetching };
}; 