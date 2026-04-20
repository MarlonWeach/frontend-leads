import { useState, useEffect, useCallback } from 'react';

export function useCampaignsData(dateFrom, dateTo) {
  const [campaigns, setCampaigns] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const withTimeout = async (promise, timeoutMs = 45000) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Tempo limite excedido ao buscar dados')), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchCampaigns = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = dateFrom.split('T')[0];
      const endDate = dateTo.split('T')[0];

      const response = await withTimeout(
        fetch(`/api/performance?startDate=${startDate}&endDate=${endDate}&page=1&limit=500&status=ALL`)
      );
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.details || payload?.error || 'Falha ao buscar performance');
      }

      const mappedCampaigns = (payload.campaigns || []).map((item) => ({
        id: item.id,
        name: item.campaign_name || item.name || item.id,
        status: item.status || 'ACTIVE',
        effective_status: item.status || 'ACTIVE',
        spend: Number(item.spend || 0),
        impressions: Number(item.impressions || 0),
        clicks: Number(item.clicks || 0),
        leads: Number(item.leads || 0),
        ctr: Number(item.ctr || 0),
        cpl: Number(item.cpl || 0),
        is_active: (item.status || '').toUpperCase() === 'ACTIVE'
      }));

      const apiMetrics = payload.metrics || {};
      setSummaryMetrics({
        total: payload.pagination?.total || mappedCampaigns.length,
        active: mappedCampaigns.filter(c => c.is_active).length,
        spend: apiMetrics.totalSpend || 0,
        impressions: apiMetrics.totalImpressions || 0,
        clicks: apiMetrics.totalClicks || 0,
        leads: apiMetrics.totalLeads || 0,
        ctr: apiMetrics.averageCTR || 0,
        cpl: apiMetrics.averageCPL || 0
      });
      setCampaigns(mappedCampaigns);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      if (String(err?.message || '').includes('Tempo limite')) {
        console.warn('Performance / campanhas: tempo limite ao buscar dados (tente recarregar).', err.message);
      } else {
        console.error('Erro ao carregar campanhas:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const refetch = useCallback(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    summaryMetrics,
    loading,
    error,
    lastUpdate,
    refetch
  };
} 