// Types: adsetGoalsDashboard.ts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { AdsetGoal } from './goals';

export interface AdsetGoalDashboardItem {
  // Dados básicos do adset
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  
  // Meta configurada
  goal: AdsetGoal | null;
  
  // Progresso atual
  progress: any | null;
  
  // Métricas calculadas para dashboard
  metrics: {
    days_total: number | null;
    days_elapsed: number | null;
    days_remaining: number | null;
    progress_percentage: number | null;
    daily_average_leads: number | null;
    leads_needed_daily: number | null;
    budget_utilization_percentage: number | null;
    current_cpl: number | null;
    projected_final_leads: number | null;
    projected_final_cpl: number | null;
    total_impressions: number | null;
    total_leads: number | null;
    total_spend: number | null;
    leads_in_goal_period: number | null;
    leads_ontem: number | null;
  } | null;
  
  // Status visual
  status: AdsetGoalStatus;
  alerts: AdsetGoalAlert[];
}

export type AdsetGoalStatus = 
  | 'no_prazo'        // Verde: progresso normal
  | 'atencao'         // Amarelo: pequeno desvio
  | 'atrasado'        // Laranja: desvio significativo
  | 'critico'         // Vermelho: desvio crítico
  | 'atingido'        // Azul: meta já atingida
  | 'pausado';        // Cinza: adset pausado

export interface AdsetGoalAlert {
  type: 'budget' | 'cpl' | 'volume' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
}

export interface AdsetGoalFilters {
  campaign_id?: string;
  status?: AdsetGoalStatus[];
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
  sort_by?: 'progress_percentage' | 'days_remaining' | 'current_cpl' | 'adset_name';
  sort_order?: 'asc' | 'desc';
}

export interface AdsetGoalsDashboardResponse {
  success: boolean;
  count: number;
  items: AdsetGoalDashboardItem[];
  summary: {
    total_adsets: number;
    no_prazo: number;
    atencao: number;
    atrasado: number;
    critico: number;
    atingido: number;
    pausado: number;
  };
  message?: string; // Mensagem opcional para casos sem dados
}

export interface UseAdsetGoalsReturn {
  data: AdsetGoalDashboardItem[];
  summary: AdsetGoalsDashboardResponse['summary'];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface UseAdsetGoalsReturnFlat {
  data: AdsetGoalDashboardItemFlat[];
  summary: {
    total_adsets: number;
    no_prazo: number;
    atencao: number;
    atrasado: number;
    critico: number;
    atingido: number;
    pausado: number;
  };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface UseGoalFiltersReturn {
  filters: AdsetGoalFilters;
  setFilters: (filters: Partial<AdsetGoalFilters>) => void;
  resetFilters: () => void;
  appliedFiltersCount: number;
}

export interface GoalProgressBarProps {
  percentage: number;
  status: AdsetGoalStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface GoalStatusBadgeProps {
  status: AdsetGoalStatus;
  alertCount?: number;
}

export interface AdsetGoalCardProps {
  item: AdsetGoalDashboardItem;
  onEdit?: (adset_id: string) => void;
  onViewDetails?: (adset_id: string) => void;
}

// Tipo temporário para os dados mock atuais (estrutura flat)
export interface AdsetGoalDashboardItemFlat {
  id: string;
  adset_id: string;
  adset_name: string;
  campaign_name: string;
  budget_total: number;
  budget_spent: number;
  budget_remaining: number;
  budget_utilization_percentage: number;
  cpl_target: number;
  cpl_current: number;
  cpl_deviation_percentage: number;
  volume_contracted: number;
  volume_captured: number;
  volume_remaining: number;
  progress_percentage: number;
  contract_start_date: string;
  contract_end_date: string;
  days_total: number;
  days_elapsed: number;
  days_remaining: number;
  daily_target: number;
  daily_average: number;
  status: AdsetGoalStatus;
  alerts: AdsetGoalAlert[];
  last_updated: string;
  budget_diario?: number; // Opcional
}

export interface AdsetGoalCardPropsFlat {
  item: AdsetGoalDashboardItemFlat;
  onEdit?: (item: AdsetGoalDashboardItemFlat) => void;
  onViewDetails?: (adset_id: string) => void;
} 