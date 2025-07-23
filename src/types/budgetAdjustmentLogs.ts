// Types: budgetAdjustmentLogs.ts
// PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes

export interface BudgetAdjustmentLog {
  id: string;
  
  // Identificação
  adset_id: string;
  campaign_id?: string;
  
  // Dados do ajuste
  old_budget: number;
  new_budget: number;
  adjustment_amount: number; // new_budget - old_budget
  adjustment_percentage: number; // percentual de mudança
  
  // Contexto
  reason: string;
  trigger_type: BudgetAdjustmentTriggerType;
  context?: BudgetAdjustmentContext;
  
  // Auditoria
  user_id?: string;
  applied_by?: string;
  
  // Timestamps
  created_at: string;
  applied_at?: string;
  
  // Status
  status: BudgetAdjustmentStatus;
  error_message?: string;
  
  // Metadados
  meta_response?: any; // Resposta da Meta API
}

export type BudgetAdjustmentTriggerType = 
  | 'automatic'  // Ajuste automático do sistema
  | 'manual'     // Ajuste manual do usuário
  | 'api';       // Ajuste via API externa

export type BudgetAdjustmentStatus = 
  | 'pending'    // Pendente de aplicação
  | 'applied'    // Aplicado com sucesso
  | 'failed'     // Falhou ao aplicar
  | 'cancelled'; // Cancelado

export interface BudgetAdjustmentContext {
  // Métricas que motivaram o ajuste
  current_cpl?: number;
  target_cpl?: number;
  leads_generated?: number;
  progress_percentage?: number;
  days_remaining?: number;
  
  // Alertas relacionados
  alerts?: string[];
  
  // Dados de performance
  performance_metrics?: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    spend?: number;
  };
  
  // Dados adicionais
  additional_data?: Record<string, any>;
}

export interface BudgetAdjustmentStats {
  total_adjustments: number;
  successful_adjustments: number;
  failed_adjustments: number;
  avg_adjustment_percentage: number;
  total_budget_change: number;
  last_adjustment?: string;
  can_adjust_now: boolean;
}

export interface CreateBudgetAdjustmentLogRequest {
  adset_id: string;
  campaign_id?: string;
  old_budget: number;
  new_budget: number;
  reason: string;
  trigger_type: BudgetAdjustmentTriggerType;
  context?: BudgetAdjustmentContext;
  user_id?: string;
  applied_by?: string;
}

export interface CreateBudgetAdjustmentLogResponse {
  success: boolean;
  log_id?: string;
  error?: string;
  can_proceed?: boolean; // Se pode aplicar o ajuste (não excede limite)
}

export interface ValidateBudgetAdjustmentRequest {
  adset_id: string;
  exclude_log_id?: string;
}

export interface ValidateBudgetAdjustmentResponse {
  success: boolean;
  can_adjust: boolean;
  adjustments_in_last_hour: number;
  remaining_adjustments: number;
  next_available_time?: string;
  error?: string;
}

export interface BudgetAdjustmentLogsQuery {
  adset_id?: string;
  campaign_id?: string;
  user_id?: string;
  status?: BudgetAdjustmentStatus[];
  trigger_type?: BudgetAdjustmentTriggerType[];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'applied_at' | 'adjustment_amount' | 'adjustment_percentage';
  sort_order?: 'asc' | 'desc';
}

export interface BudgetAdjustmentLogsResponse {
  success: boolean;
  count: number;
  total_count?: number;
  logs: BudgetAdjustmentLog[];
  stats?: BudgetAdjustmentStats;
  error?: string;
}

export interface BudgetAdjustmentStatsQuery {
  adset_id?: string;
  campaign_id?: string;
  user_id?: string;
  period_hours?: number; // Default 24
  group_by?: 'hour' | 'day' | 'week' | 'month';
}

export interface BudgetAdjustmentStatsResponse {
  success: boolean;
  stats: BudgetAdjustmentStats;
  timeline?: Array<{
    period: string;
    adjustments: number;
    avg_percentage: number;
    total_change: number;
  }>;
  error?: string;
}

export interface UpdateBudgetAdjustmentLogRequest {
  log_id: string;
  status: BudgetAdjustmentStatus;
  applied_at?: string;
  error_message?: string;
  meta_response?: any;
}

export interface UpdateBudgetAdjustmentLogResponse {
  success: boolean;
  updated: BudgetAdjustmentLog;
  error?: string;
} 