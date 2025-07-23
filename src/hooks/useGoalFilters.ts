// Hook: useGoalFilters.ts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { useState, useCallback, useMemo } from 'react';
import { AdsetGoalFilters, UseGoalFiltersReturn } from '@/types/adsetGoalsDashboard';

const DEFAULT_FILTERS: AdsetGoalFilters = {
  sort_by: 'progress_percentage',
  sort_order: 'desc'
};

export function useGoalFilters(initialFilters?: Partial<AdsetGoalFilters>): UseGoalFiltersReturn {
  const [filters, setFiltersState] = useState<AdsetGoalFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  // Permitir setFilters ser objeto ou função updater
  const setFilters = useCallback((newFiltersOrUpdater: Partial<AdsetGoalFilters> | ((prev: AdsetGoalFilters) => AdsetGoalFilters)) => {
    setFiltersState(prev => {
      if (typeof newFiltersOrUpdater === 'function') {
        return newFiltersOrUpdater(prev);
      } else {
        return {
          ...prev,
          ...newFiltersOrUpdater
        };
      }
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