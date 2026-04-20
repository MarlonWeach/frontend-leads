// Hook: useAdsetGoals.ts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { useState, useEffect, useCallback } from 'react';
import { 
  AdsetGoalDashboardItem, 
  UseAdsetGoalsReturn,
  AdsetGoalFilters 
} from '../types/adsetGoalsDashboard';

export function useAdsetGoals(filters?: AdsetGoalFilters): UseAdsetGoalsReturn {
  const [data, setData] = useState<AdsetGoalDashboardItem[]>([]);
  const [summary, setSummary] = useState({
    total_adsets: 0,
    no_prazo: 0,
    atencao: 0,
    atrasado: 0,
    critico: 0,
    atingido: 0,
    pausado: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Buscar dados sempre que filters mudar
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'date_range' && value && typeof value === 'object') {
          if (value.start) params.append('date_from', value.start);
          if (value.end) params.append('date_to', value.end);
        } else if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value as any);
          }
        }
      });
    }
    const url = `/api/adset-goals/dashboard?${params.toString()}`;
    fetch(url)
      .then(res => res.json())
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];

        const filteredItems = items
          .filter((item: AdsetGoalDashboardItem) => {
            if (filters?.campaign_id && item.campaign_id !== filters.campaign_id) {
              return false;
            }
            if (filters?.status?.length && !filters.status.includes(item.status)) {
              return false;
            }
            if (filters?.search) {
              const searchTerm = filters.search.toLowerCase().trim();
              const haystack = `${item.adset_name || ''} ${item.campaign_name || ''}`.toLowerCase();
              if (!haystack.includes(searchTerm)) {
                return false;
              }
            }
            return true;
          })
          .sort((left: AdsetGoalDashboardItem, right: AdsetGoalDashboardItem) => {
            const direction = filters?.sort_order === 'asc' ? 1 : -1;
            const sortBy = filters?.sort_by || 'progress_percentage';

            if (sortBy === 'adset_name') {
              return direction * (left.adset_name || '').localeCompare(right.adset_name || '');
            }

            if (sortBy === 'days_remaining') {
              const leftValue = left.metrics?.days_remaining ?? Number.MAX_SAFE_INTEGER;
              const rightValue = right.metrics?.days_remaining ?? Number.MAX_SAFE_INTEGER;
              return direction * (leftValue - rightValue);
            }

            if (sortBy === 'current_cpl') {
              const leftValue = left.metrics?.current_cpl ?? Number.MAX_SAFE_INTEGER;
              const rightValue = right.metrics?.current_cpl ?? Number.MAX_SAFE_INTEGER;
              return direction * (leftValue - rightValue);
            }

            const leftValue = left.metrics?.progress_percentage ?? 0;
            const rightValue = right.metrics?.progress_percentage ?? 0;
            return direction * (leftValue - rightValue);
          });

        setData(filteredItems);
        // Calcular summary no client com base na lista filtrada atual.
        setSummary({
          total_adsets: filteredItems.length,
          no_prazo: filteredItems.filter((i: any) => i.status === 'no_prazo').length,
          atencao: filteredItems.filter((i: any) => i.status === 'atencao').length,
          atrasado: filteredItems.filter((i: any) => i.status === 'atrasado').length,
          critico: filteredItems.filter((i: any) => i.status === 'critico').length,
          atingido: filteredItems.filter((i: any) => i.status === 'atingido').length,
          pausado: filteredItems.filter((i: any) => i.status === 'pausado').length
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erro desconhecido');
        setLoading(false);
      });
  }, [filters, reloadToken]); // Usar filters diretamente ao invés de JSON.stringify

  // Função manual para refresh (mantida para interface)
  const refresh = () => {
    setReloadToken(prev => prev + 1);
  };

  return { data, summary, loading, error, refresh };
} 