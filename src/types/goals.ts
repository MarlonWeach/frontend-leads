// Types for PBI 25 - Adset Goals System
// Task 25-1: Interface de configuração de metas por adset

export interface AdsetGoal {
  id: string;
  adset_id: string;
  adset_name?: string;
  budget_total: number;
  cpl_target: number;
  volume_contracted: number;
  volume_captured: number;
  contract_start_date: string; // ISO date string
  contract_end_date: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface AdsetGoalInput {
  adset_id: string;
  adset_name?: string;
  budget_total: number;
  cpl_target: number;
  volume_contracted: number;
  volume_captured: number;
  contract_start_date: string;
  contract_end_date: string;
}

export interface GoalCalculations {
  days_total: number;
  days_remaining: number;
  days_elapsed: number;
  leads_needed_total: number;
  leads_needed_daily: number;
  budget_daily: number;
  budget_remaining: number;
  budget_spent_estimated: number;
  progress_percentage: number;
  is_on_track: boolean;
  projected_final_volume: number;
  cpl_current_estimated: number;
}

export interface GoalValidation {
  is_valid: boolean;
  errors: GoalValidationError[];
  warnings: GoalValidationWarning[];
}

export interface GoalValidationError {
  field: keyof AdsetGoalInput;
  message: string;
  code: string;
}

export interface GoalValidationWarning {
  field: keyof AdsetGoalInput | 'general';
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
}

export enum GoalStatus {
  ON_TRACK = 'on_track',
  BEHIND = 'behind',
  AHEAD = 'ahead',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export enum GoalAlert {
  BUDGET_EXHAUSTED = 'budget_exhausted',
  CPL_TOO_HIGH = 'cpl_too_high',
  VOLUME_BEHIND = 'volume_behind',
  DEADLINE_APPROACHING = 'deadline_approaching',
  IMPOSSIBLE_TARGET = 'impossible_target'
}

export interface GoalStatusInfo {
  status: GoalStatus;
  alerts: GoalAlert[];
  next_action: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
}

// Form-specific types
export interface GoalFormData {
  adset_id: string;
  budget_total: string; // String for form input
  cpl_target: string; // String for form input
  volume_contracted: string; // String for form input
  volume_captured: string; // String for form input
  contract_start_date: string;
  contract_end_date: string;
}

export interface GoalFormErrors {
  adset_id?: string;
  budget_total?: string;
  cpl_target?: string;
  volume_contracted?: string;
  volume_captured?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  general?: string;
}

// API Response types
export interface GoalApiResponse {
  success: boolean;
  data?: AdsetGoal;
  error?: string;
  calculations?: GoalCalculations;
  validation?: GoalValidation;
}

export interface GoalsListResponse {
  success: boolean;
  data?: AdsetGoal[];
  error?: string;
  total?: number;
}

export interface GoalOptimizationContextItem {
  meta_account_id: string;
  adset_id: string;
  adset_name?: string;
  competence_month: string;
  contract_start_date: string;
  competence_end_date: string;
  volume_contracted: number;
  delivered_reference: number;
  delivered_source: 'manual_client' | 'historical_fallback';
  volume_remaining: number;
  days_remaining: number;
  leads_needed_daily: number;
  cpl_target: number;
  current_cpl: number | null;
  budget_total: number;
  spend_to_date: number;
  has_manual_delivery: boolean;
}

export interface GoalOptimizationContextResponse {
  success: boolean;
  data?: GoalOptimizationContextItem[];
  error?: string;
  total?: number;
}

// Utility types
export type GoalMetric = 'budget' | 'volume' | 'cpl' | 'timeline';

export interface GoalMetricStatus {
  metric: GoalMetric;
  current_value: number;
  target_value: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'worsening';
}

// Constants
export const GOAL_CONSTANTS = {
  MIN_CONTRACT_DAYS: 7,
  MAX_CONTRACT_DAYS: 365,
  MIN_BUDGET: 100,
  MAX_BUDGET: 1000000,
  MIN_CPL: 1,
  MAX_CPL: 1000,
  MIN_VOLUME: 1,
  MAX_VOLUME: 100000,
  SAFETY_BUFFER_PERCENTAGE: 15,
  WARNING_THRESHOLD_DAYS: 7,
  CRITICAL_THRESHOLD_DAYS: 3
} as const;

/**
 * Volume contratado = Budget Total / CPL Revenue (arredondado), alinhado ao card de Metas.
 * Garante volume_contracted >= volume_captured para passar na validação.
 */
export function deriveVolumeContracted(
  budgetTotal: number,
  cplRevenue: number,
  volumeCaptured: number
): number {
  if (!Number.isFinite(budgetTotal) || budgetTotal <= 0) return 0;
  if (!Number.isFinite(cplRevenue) || cplRevenue <= 0) return 0;
  const captured = Number.isFinite(volumeCaptured)
    ? Math.max(0, Math.floor(volumeCaptured))
    : 0;
  const derived = Math.round(budgetTotal / cplRevenue);
  return Math.max(derived, captured);
}

// Helper type for form validation rules
export interface ValidationRules {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export type GoalValidationRules = {
  [K in keyof GoalFormData]: ValidationRules;
}; 