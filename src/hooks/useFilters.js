import { useState, useCallback, useEffect } from 'react';

// Valores padrão dos filtros
const DEFAULT_FILTERS = {
  dateRange: {
    preset: '7d',
    startDate: null,
    endDate: null,
    compareWithPrevious: false
  },
  metrics: {
    spend: true,
    impressions: true,
    clicks: true,
    leads: true,
    ctr: false,
    conversionRate: false,
    cpc: false,
    cpm: false
  },
  segments: {
    campaigns: [],
    adsets: [],
    ads: [],
    // Removido: advertisers (não faz sentido na estrutura Meta)
    performance: 'all' // all, high, medium, low
  }
};

// Presets de data disponíveis
export const DATE_PRESETS = {
  '7d': { label: 'Últimos 7 dias', days: 7 },
  '30d': { label: 'Últimos 30 dias', days: 30 },
  '90d': { label: 'Últimos 90 dias', days: 90 },
  '6m': { label: 'Últimos 6 meses', days: 180 },
  '1y': { label: 'Último ano', days: 365 },
  'custom': { label: 'Período personalizado', days: null }
};

// Hook principal de filtros
export const useFilters = () => {
  const [filters, setFilters] = useState(() => {
    // Tentar carregar filtros salvos do localStorage
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('dashboard-filters');
      if (savedFilters) {
        try {
          return { ...DEFAULT_FILTERS, ...JSON.parse(savedFilters) };
        } catch (error) {
          console.warn('Erro ao carregar filtros salvos:', error);
        }
      }
    }
    return DEFAULT_FILTERS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Salvar filtros no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-filters', JSON.stringify(filters));
    }
  }, [filters]);

  // Atualizar filtros de data
  const updateDateRange = useCallback((newDateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, ...newDateRange }
    }));
  }, []);

  // Atualizar filtros de métricas
  const updateMetrics = useCallback((metricKey, enabled) => {
    setFilters(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [metricKey]: enabled
      }
    }));
  }, []);

  // Atualizar filtros de segmentação
  const updateSegments = useCallback((segmentKey, value) => {
    setFilters(prev => ({
      ...prev,
      segments: {
        ...prev.segments,
        [segmentKey]: value
      }
    }));
  }, []);

  // Aplicar preset de data
  const applyDatePreset = useCallback((preset) => {
    const presetConfig = DATE_PRESETS[preset];
    if (!presetConfig) return;

    const endDate = new Date();
    const startDate = preset === 'custom' 
      ? null 
      : new Date(endDate.getTime() - (presetConfig.days * 24 * 60 * 60 * 1000));

    updateDateRange({
      preset,
      startDate,
      endDate: preset === 'custom' ? null : endDate
    });
  }, [updateDateRange]);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    
    // Contar filtros de data (se não for o padrão)
    if (filters.dateRange.preset !== '7d') count++;
    if (filters.dateRange.compareWithPrevious) count++;
    
    // Contar métricas não padrão
    const defaultMetrics = DEFAULT_FILTERS.metrics;
    Object.keys(filters.metrics).forEach(key => {
      if (filters.metrics[key] !== defaultMetrics[key]) count++;
    });
    
    // Contar segmentos ativos
    if (filters.segments.campaignStatus !== 'all') count++;
    if (filters.segments.performance !== 'all') count++;
    
    return count;
  }, [filters]);

  // Obter range de datas calculado
  const getDateRange = useCallback(() => {
    const { preset, startDate, endDate } = filters.dateRange;
    
    if (preset === 'custom') {
      return { startDate, endDate };
    }
    
    const presetConfig = DATE_PRESETS[preset];
    if (!presetConfig) return { startDate: null, endDate: null };
    
    const end = new Date();
    const start = new Date(end.getTime() - (presetConfig.days * 24 * 60 * 60 * 1000));
    
    return { startDate: start, endDate: end };
  }, [filters.dateRange]);

  // Obter métricas ativas
  const getActiveMetrics = useCallback(() => {
    return Object.keys(filters.metrics).filter(key => filters.metrics[key]);
  }, [filters.metrics]);

  // Aplicar filtros com loading
  const applyFilters = useCallback(async (callback) => {
    setIsLoading(true);
    try {
      if (callback) {
        await callback(filters);
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    filters,
    isLoading,
    updateDateRange,
    updateMetrics,
    updateSegments,
    applyDatePreset,
    resetFilters,
    getActiveFiltersCount,
    getDateRange,
    getActiveMetrics,
    applyFilters,
    setIsLoading
  };
}; 