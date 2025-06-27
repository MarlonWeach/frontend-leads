import { useState, useEffect, useCallback } from 'react';

interface UsageData {
  date: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  estimatedCost: number;
  model: string;
}

interface BillingData {
  success: boolean;
  data: {
    currentPeriod: {
      startDate: string;
      endDate: string;
      totalCost: number;
      totalTokens: number;
      totalRequests: number;
    };
    dailyUsage: UsageData[];
    limits: {
      softLimit: number;
      hardLimit: number;
      usagePercentage: number;
    };
    alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      threshold: number;
    }>;
  };
  source: 'openai_api' | 'local_estimation';
  lastUpdated: string;
}

interface UseOpenAIBillingOptions {
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOpenAIBillingReturn {
  data: BillingData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: string | null;
}

export function useOpenAIBilling(options: UseOpenAIBillingOptions = {}): UseOpenAIBillingReturn {
  const {
    days = 7,
    autoRefresh = false,
    refreshInterval = 10 * 60 * 1000 // 10 minutos
  } = options;

  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/billing?days=${days}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados de billing');
      }

      setData(result);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBillingData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBillingData]);

  return {
    data,
    loading,
    error,
    refresh: fetchBillingData,
    lastUpdated
  };
}

// Hook auxiliar para estatísticas de billing
export function useBillingStats(data: BillingData | null) {
  if (!data?.data) {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      averageCostPerDay: 0,
      averageTokensPerDay: 0,
      averageRequestsPerDay: 0,
      usagePercentage: 0,
      daysRemaining: 0,
      projectedMonthlyCost: 0
    };
  }

  const { currentPeriod, dailyUsage, limits } = data.data;
  const days = dailyUsage.length;

  const averageCostPerDay = days > 0 ? currentPeriod.totalCost / days : 0;
  const averageTokensPerDay = days > 0 ? currentPeriod.totalTokens / days : 0;
  const averageRequestsPerDay = days > 0 ? currentPeriod.totalRequests / days : 0;

  // Projeção mensal baseada na média diária
  const projectedMonthlyCost = averageCostPerDay * 30;

  // Calcular dias restantes até atingir o limite
  const remainingBudget = limits.softLimit - currentPeriod.totalCost;
  const daysRemaining = averageCostPerDay > 0 ? Math.floor(remainingBudget / averageCostPerDay) : Infinity;

  return {
    totalCost: currentPeriod.totalCost,
    totalTokens: currentPeriod.totalTokens,
    totalRequests: currentPeriod.totalRequests,
    averageCostPerDay,
    averageTokensPerDay,
    averageRequestsPerDay,
    usagePercentage: limits.usagePercentage,
    daysRemaining: Math.max(0, daysRemaining),
    projectedMonthlyCost
  };
}

// Hook para gerenciar configurações de limites
export function useBillingLimits() {
  const [softLimit, setSoftLimit] = useState(50);
  const [hardLimit, setHardLimit] = useState(100);

  // Carregar configurações salvas
  useEffect(() => {
    const savedSoftLimit = localStorage.getItem('openai_soft_limit');
    const savedHardLimit = localStorage.getItem('openai_hard_limit');

    if (savedSoftLimit) {
      setSoftLimit(parseFloat(savedSoftLimit));
    }
    if (savedHardLimit) {
      setHardLimit(parseFloat(savedHardLimit));
    }
  }, []);

  const updateSoftLimit = useCallback((limit: number) => {
    setSoftLimit(limit);
    localStorage.setItem('openai_soft_limit', limit.toString());
  }, []);

  const updateHardLimit = useCallback((limit: number) => {
    setHardLimit(limit);
    localStorage.setItem('openai_hard_limit', limit.toString());
  }, []);

  return {
    softLimit,
    hardLimit,
    updateSoftLimit,
    updateHardLimit
  };
} 