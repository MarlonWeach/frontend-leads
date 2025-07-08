import { useQueryWithCache } from './useQueryWithCache';
import { useQueryClient } from '@tanstack/react-query';

// Tipos para os dados do dashboard
export interface DashboardMetrics {
  leads: {
    total: number;
    active: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  adsets: {
    total: number;
    active: number;
  };
  ads: {
    total: number;
    active: number;
  };
  spend: {
    total: number;
    today: number;
  };
  impressions: {
    total: number;
    today: number;
  };
  clicks: {
    total: number;
    today: number;
  };
  ctr: {
    average: number;
    trend: number;
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

export interface CampaignDistribution {
  name: string;
  value: number;
}

export interface DashboardOverviewResponse {
  metrics: DashboardMetrics;
  recentActivity: DashboardRecentActivity[];
  alerts: DashboardAlert[];
  overviewData: DashboardOverviewData[];
  campaignDistribution?: CampaignDistribution[];
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
export function useDashboardOverview(dateFrom?: string, dateTo?: string, optionsOverride: any = {}) {
  // Endpoint removido. Retorna erro amigável.
  return {
    data: null,
    error: 'O endpoint /api/dashboard/overview foi removido do sistema.',
    isLoading: false,
    refetch: async () => {},
  };
}

// Hook para invalidar todos os dados do dashboard
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    ]);
  };
} 