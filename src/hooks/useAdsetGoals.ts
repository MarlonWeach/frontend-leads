// Hook: useAdsetGoals.ts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { useState, useEffect, useCallback } from 'react';
import { 
  AdsetGoalDashboardItem, 
  UseAdsetGoalsReturn,
  AdsetGoalFilters 
} from '@/types/adsetGoalsDashboard';

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
    fetch(`/api/adset-goals/dashboard?${params.toString()}`)
      .then(res => res.json())
      .then((res) => {
        setData(res.data || []);
        // Calcular summary no client
        const items = res.data || [];
        setSummary({
          total_adsets: items.length,
          no_prazo: items.filter((i: any) => i.status === 'no_prazo').length,
          atencao: items.filter((i: any) => i.status === 'atencao').length,
          atrasado: items.filter((i: any) => i.status === 'atrasado').length,
          critico: items.filter((i: any) => i.status === 'critico').length,
          atingido: items.filter((i: any) => i.status === 'atingido').length,
          pausado: items.filter((i: any) => i.status === 'pausado').length
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erro desconhecido');
        setLoading(false);
      });
  }, [JSON.stringify(filters)]);

  // Função manual para refresh (mantida para interface)
  const refresh = () => {
    // Apenas força o efeito a rodar novamente
    setData([]);
    setSummary({
      total_adsets: 0,
      no_prazo: 0,
      atencao: 0,
      atrasado: 0,
      critico: 0,
      atingido: 0,
      pausado: 0
    });
    setLoading(true);
    setError(null);
  };

  return { data, summary, loading, error, refresh };
} 