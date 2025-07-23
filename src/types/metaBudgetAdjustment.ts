// Types: metaBudgetAdjustment.ts
// PBI 25 - Task 25-9: Integração Meta API para Ajustes de Budget

export interface MetaAdsetBudgetInfo {
  adset_id: string;
  name: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  campaign_id: string;
  account_id: string;
}

export interface MetaBudgetAdjustmentRequest {
  adset_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  status?: 'ACTIVE' | 'PAUSED';
}

export interface MetaBudgetAdjustmentResponse {
  success: boolean;
  data?: {
    adset_id: string;
    daily_budget?: string;
    lifetime_budget?: string;
    updated_time: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface MetaAPIError {
  message: string;
  type: 'OAuthException' | 'GraphMethodException' | 'ValidationException' | 'RateLimitException';
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaRateLimitInfo {
  app_id_util_pct: number;
  call_count: number;
  total_cputime: number;
  total_time: number;
  type: string;
  estimated_time_to_regain_access?: number;
}

export interface ApplyBudgetAdjustmentRequest {
  adset_id: string;
  new_budget: number;
  budget_type: 'daily' | 'lifetime';
  reason: string;
  user_id?: string;
  force?: boolean; // Forçar mesmo se exceder limite de frequência
}

export interface ApplyBudgetAdjustmentResponse {
  success: boolean;
  log_id?: string;
  meta_response?: MetaBudgetAdjustmentResponse;
  validation_result?: {
    can_adjust: boolean;
    adjustments_in_last_hour: number;
    remaining_adjustments: number;
    next_available_time?: string;
  };
  error?: string;
  rolled_back?: boolean;
}

export interface BatchBudgetAdjustmentRequest {
  adjustments: Array<{
    adset_id: string;
    new_budget: number;
    budget_type: 'daily' | 'lifetime';
    reason: string;
  }>;
  user_id?: string;
  max_concurrent?: number; // Máximo de ajustes simultâneos
  stop_on_error?: boolean; // Parar no primeiro erro
}

export interface BatchBudgetAdjustmentResponse {
  success: boolean;
  total_requested: number;
  successful: number;
  failed: number;
  skipped: number; // Por limite de frequência
  results: Array<{
    adset_id: string;
    status: 'success' | 'failed' | 'skipped';
    log_id?: string;
    error?: string;
    meta_response?: MetaBudgetAdjustmentResponse;
  }>;
  rate_limit_info?: MetaRateLimitInfo;
}

export interface RollbackBudgetAdjustmentRequest {
  log_id: string;
  reason: string;
  user_id?: string;
}

export interface RollbackBudgetAdjustmentResponse {
  success: boolean;
  original_log_id: string;
  rollback_log_id?: string;
  meta_response?: MetaBudgetAdjustmentResponse;
  error?: string;
}

export interface MetaAPIConfig {
  access_token: string;
  account_id: string;
  api_version: string;
  base_url: string;
  timeout_ms: number;
  max_retries: number;
  retry_delay_ms: number;
}

export interface AdsetBudgetValidationResult {
  is_valid: boolean;
  adset_info?: MetaAdsetBudgetInfo;
  errors: string[];
  warnings: string[];
}

export interface BudgetAdjustmentContext {
  // Contexto do sistema de metas
  goal?: {
    target_cpl: number;
    volume_contratado: number;
    progress_percentage: number;
    days_remaining: number;
  };
  
  // Métricas atuais
  performance?: {
    current_cpl: number;
    leads_generated: number;
    spend: number;
    impressions: number;
    clicks: number;
  };
  
  // Motivo do ajuste
  trigger_reason: 'manual' | 'automatic_optimization' | 'goal_behind_schedule' | 'cpl_too_high' | 'goal_ahead_schedule';
  
  // Dados adicionais
  metadata?: Record<string, any>;
}

export interface BudgetAdjustmentRule {
  max_increase_percentage: number; // Máximo 20% de aumento
  max_decrease_percentage: number; // Máximo 50% de redução
  min_budget_amount: number; // Budget mínimo (ex: R$ 10)
  max_budget_amount: number; // Budget máximo (ex: R$ 10.000)
  max_adjustments_per_hour: number; // Máximo 4 por hora
  cooldown_minutes: number; // Tempo mínimo entre ajustes
}

export const DEFAULT_BUDGET_RULES: BudgetAdjustmentRule = {
  max_increase_percentage: 20,
  max_decrease_percentage: 50,
  min_budget_amount: 10,
  max_budget_amount: 10000,
  max_adjustments_per_hour: 4,
  cooldown_minutes: 15
};

export interface BudgetAdjustmentEngineOptions {
  rules?: Partial<BudgetAdjustmentRule>;
  dry_run?: boolean; // Simular sem aplicar
  bypass_frequency_check?: boolean; // Para casos emergenciais
  auto_rollback_on_error?: boolean;
  notification_webhook?: string;
} 