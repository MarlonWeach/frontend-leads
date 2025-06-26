import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PerformanceResponse, 
  PerformanceFilters, 
  PerformancePagination 
} from '../types/performance';

interface UsePerformanceDataOptions {
  initialFilters?: Partial<PerformanceFilters>;
  autoFetch?: boolean;
}

interface UsePerformanceDataReturn {
  // Estados
  data: PerformanceResponse | null;
  loading: boolean;
  error: string | null;
  
  // Filtros
  filters: PerformanceFilters;
  setFilters: (filters: Partial<PerformanceFilters>) => void;
  
  // Ações
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Paginação
  pagination: PerformancePagination;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Utilitários
  hasData: boolean;
  isEmpty: boolean;
}

// Função para buscar dados da API
async function fetchPerformanceData(filters: PerformanceFilters): Promise<PerformanceResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.status) params.set('status', filters.status);
  if (filters.campaignId) params.set('campaignId', filters.campaignId);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  
  const url = `/api/performance?${params.toString()}`;
  console.log('Hook: Fazendo requisição para:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Hook: Dados recebidos:', data);
  return data;
}

export function usePerformanceData(options: UsePerformanceDataOptions = {}): UsePerformanceDataReturn {
  const {
    initialFilters = {},
    autoFetch = true
  } = options;

  // Estados
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros com valores padrão
  const [filters, setFiltersState] = useState<PerformanceFilters>({
    page: 1,
    limit: 20,
    sortBy: 'data_start_date',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Função para buscar dados
  const fetchData = useCallback(async (currentFilters: PerformanceFilters) => {
    console.log('Hook: fetchData chamado com filtros:', currentFilters);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchPerformanceData(currentFilters);
      console.log('Hook: Dados salvos no estado:', response);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Hook: Erro ao buscar dados:', errorMessage);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar filtros
  const setFilters = useCallback((newFilters: Partial<PerformanceFilters>) => {
    console.log('Hook: setFilters chamado com:', newFilters);
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Resetar página se outros filtros mudaram
      if (newFilters.startDate !== undefined || 
          newFilters.endDate !== undefined || 
          newFilters.status !== undefined || 
          newFilters.campaignId !== undefined ||
          newFilters.sortBy !== undefined ||
          newFilters.sortOrder !== undefined) {
        updated.page = 1;
      }
      
      return updated;
    });
  }, []);

  // Função para ir para uma página específica
  const goToPage = useCallback((page: number) => {
    setFilters({ page });
  }, [setFilters]);

  // Função para alterar tamanho da página
  const setPageSize = useCallback((size: number) => {
    setFilters({ limit: size, page: 1 });
  }, [setFilters]);

  // Função para refazer busca
  const refetch = useCallback(async () => {
    await fetchData(filters);
  }, [fetchData, filters]);

  // Função para refresh (força nova busca)
  const refresh = useCallback(async () => {
    await fetchData(filters);
  }, [fetchData, filters]);

  // Buscar dados quando filtros mudarem
  useEffect(() => {
    console.log('Hook: useEffect - filtros mudaram:', filters);
    if (autoFetch) {
      fetchData(filters);
    }
  }, [fetchData, filters, autoFetch]);

  // Computed values
  const pagination = useMemo(() => {
    return data?.pagination || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      total: 0,
      totalPages: 0
    };
  }, [data?.pagination, filters.page, filters.limit]);

  const hasData = useMemo(() => {
    return data !== null && data.campaigns && data.campaigns.length > 0;
  }, [data]);

  const isEmpty = useMemo(() => {
    return !loading && !error && data !== null && data.campaigns && data.campaigns.length === 0;
  }, [loading, error, data]);

  return {
    // Estados
    data,
    loading,
    error,
    
    // Filtros
    filters,
    setFilters,
    
    // Ações
    refetch,
    refresh,
    
    // Paginação
    pagination,
    goToPage,
    setPageSize,
    
    // Utilitários
    hasData,
    isEmpty
  };
} 