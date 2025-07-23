// Types for PBI 25 - Task 25-4: Budget Adjustment System

export type BudgetAdjustmentReason = 'atraso_meta' | 'estrategia' | 'correcao_erro' | 'manual';
export type BudgetAdjustmentStatus = 'success' | 'blocked' | 'error';

export interface BudgetAdjustmentLog {
  id: string;
  adset_id: string;
  timestamp: string; // ISO
  old_budget: number;
  new_budget: number;
  percent_change: number;
  user_id: string;
  reason: BudgetAdjustmentReason;
  status: BudgetAdjustmentStatus;
  message?: string;
  created_at: string;
}

export interface BudgetAdjustmentRequest {
  adset_id: string;
  current_budget: number;
  suggested_budget: number;
  user_id: string;
  reason: BudgetAdjustmentReason;
}

export interface BudgetAdjustmentResponse {
  success: boolean;
  log?: BudgetAdjustmentLog;
  error?: string;
  blocked?: boolean;
}

export interface BudgetAdjustmentValidation {
  is_valid: boolean;
  blocked: boolean;
  reason?: string;
  max_allowed_budget: number;
  adjustments_last_hour: number;
  errors?: string[];
} 