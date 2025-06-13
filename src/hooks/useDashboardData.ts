import { useQueryWithCache } from './useQueryWithCache';
import { useQueryClient } from '@tanstack/react-query';

// Tipos para os dados do dashboard
export interface DashboardMetrics {
  campaigns: {
    total: number;
    active: number;
    active_vs_previous_month?: number;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversion_rate: number;
    total_vs_previous_month?: number;
  };
  advertisers: {
    total: number;
    active: number;
    registered?: number;
    total_vs_previous_month?: number;
  };
  performance: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    spend_vs_previous_month?: number;
  };
}

export interface DashboardOverviewData {
  date: string;
  total: number;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface DashboardAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: string;
  href?: string;
}

export interface DashboardRecentActivity {
  id: string;
  type: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardOverviewResponse {
  metrics: DashboardMetrics;
  recentActivity: DashboardRecentActivity[];
  alerts: DashboardAlert[];
  overviewData: DashboardOverviewData[];
  cacheInfo?: {
    timestamp: string;
    source: string;
  };
}

export interface DashboardActivityItem {
  status: string;
  total: number;
}

export interface DashboardRecentSalesItem {
  id: string;
  name: string;
  email: string;
  status: string;
  amount: string;
  created_at: string;
}

export interface DashboardSearchItem {
  source: string;
  total: number;
}

// Hook para buscar dados do overview do dashboard
export function useDashboardOverview(dateFrom?: string, dateTo?: string) {
  const queryClient = useQueryClient();
  
  const queryKey = ['dashboard', 'overview', dateFrom && dateTo ? `${dateFrom}_${dateTo}` : 'all'];
  
  const fetchOverview = async (): Promise<DashboardOverviewResponse> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const response = await fetch(`/api/dashboard/overview?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do dashboard');
    }
    return response.json();
  };
  
  const result = useQueryWithCache<DashboardOverviewResponse>(
    queryKey,
    fetchOverview,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
  
  const refetch = async () => {
    await result.refetch();
  };
  
  return {
    ...result,
    refetch
  };
}

// Hook para buscar dados de atividade do dashboard
export function useDashboardActivity() {
  const queryClient = useQueryClient();
  
  const queryKey = ['dashboard', 'activity'];
  
  const fetchActivity = async (): Promise<DashboardActivityItem[]> => {
    const response = await fetch('/api/dashboard/activity');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de atividade: ${response.statusText}`);
    }
    
    return response.json();
  };
  
  const result = useQueryWithCache<DashboardActivityItem[]>(
    queryKey,
    fetchActivity,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false
    }
  );
  
  const refetch = async () => {
    await result.refetch();
  };
  
  return {
    ...result,
    refetch
  };
}

// Hook para buscar dados de vendas recentes do dashboard
export function useDashboardRecentSales() {
  const queryClient = useQueryClient();
  
  const queryKey = ['dashboard', 'recent-sales'];
  
  const fetchRecentSales = async (): Promise<DashboardRecentSalesItem[]> => {
    const response = await fetch('/api/dashboard/recent-sales');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de vendas recentes: ${response.statusText}`);
    }
    
    return response.json();
  };
  
  const result = useQueryWithCache<DashboardRecentSalesItem[]>(
    queryKey,
    fetchRecentSales,
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      refetchOnWindowFocus: false
    }
  );
  
  const refetch = async () => {
    await result.refetch();
  };
  
  return {
    ...result,
    refetch
  };
}

// Hook para buscar dados de busca do dashboard
export function useDashboardSearch() {
  const queryClient = useQueryClient();
  
  const queryKey = ['dashboard', 'search'];
  
  const fetchSearch = async (): Promise<DashboardSearchItem[]> => {
    const response = await fetch('/api/dashboard/search');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de busca: ${response.statusText}`);
    }
    
    return response.json();
  };
  
  const result = useQueryWithCache<DashboardSearchItem[]>(
    queryKey,
    fetchSearch,
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false
    }
  );
  
  const refetch = async () => {
    await result.refetch();
  };
  
  return {
    ...result,
    refetch
  };
}

// Hook para invalidar todos os dados do dashboard
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-sales'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'search'] })
    ]);
  };
} 