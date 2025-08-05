// Hook: useGoalFilters.ts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { useState, useCallback, useMemo } from 'react';
import { AdsetGoalFilters, UseGoalFiltersReturn } from '../types/adsetGoalsDashboard';

const DEFAULT_FILTERS: AdsetGoalFilters = {
  sort_by: 'progress_percentage',
  sort_order: 'desc'
};

export function useGoalFilters(initialFilters?: Partial<AdsetGoalFilters>): UseGoalFiltersReturn {
  // Calcular range padrão dinamicamente
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [filters, setFiltersState] = useState<AdsetGoalFilters>({
    ...DEFAULT_FILTERS,
    date_range: getDefaultDateRange(),
    ...initialFilters
  });
  


  // Permitir setFilters ser objeto ou função updater
  const setFilters = useCallback((newFiltersOrUpdater: Partial<AdsetGoalFilters> | ((prev: AdsetGoalFilters) => AdsetGoalFilters)) => {
    setFiltersState(prev => {
      const newState = typeof newFiltersOrUpdater === 'function' 
        ? newFiltersOrUpdater(prev)
        : { ...prev, ...newFiltersOrUpdater };
      return newState;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.campaign_id) count++;
    if (filters.status?.length) count++;
    if (filters.search) count++;
    if (filters.date_range?.start && filters.date_range?.end) count++;
    
    // Não contar sort como filtro aplicado
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    resetFilters,
    appliedFiltersCount
  };
} 