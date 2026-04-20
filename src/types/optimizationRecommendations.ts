import type { GoalOptimizationContextItem } from '@/types/goals';
import type { Window7dMetrics } from '@/lib/optimization/adsetInsightsWindow7d';

export type OptimizationRecommendationType =
  | 'budget_increase'
  | 'budget_decrease'
  | 'schedule_shift'
  | 'focus_adset';

export type OptimizationConfidenceLevel = 'high' | 'medium' | 'low';

export type OptimizationRecommendationStatus =
  | 'active'
  | 'applied'
  | 'discarded'
  | 'expired';

export type OptimizationDecisionAction = 'apply' | 'discard' | 'defer';

export interface OptimizationContextSnapshotV1 {
  snapshot_schema_version: 1;
  goal_context: GoalOptimizationContextItem;
  window_7d: Window7dMetrics;
  eligibility: {
    passed_minimum_sample: boolean;
    flags: string[];
  };
}

export interface OptimizationRecommendationRow {
  id: string;
  meta_account_id: string;
  scope: 'account' | 'adset';
  entity_id: string;
  /** Nome resolvido (adsets.name Meta ou meta cadastrada); preenchido pela API. */
  adset_display_name?: string;
  competence_month: string | null;
  recommendation_type: OptimizationRecommendationType;
  confidence_level: OptimizationConfidenceLevel;
  status: OptimizationRecommendationStatus;
  generated_at: string;
  expires_at: string;
  action_payload: Record<string, unknown>;
  score_breakdown: Record<string, unknown>;
  evidence_summary: string;
  risk_flags: string[];
  context_snapshot: OptimizationContextSnapshotV1 | null;
  batch_id: string;
  created_at: string;
  updated_at: string;
}

export interface OptimizationRecommendationsListResponse {
  success: boolean;
  data?: OptimizationRecommendationRow[];
  total?: number;
  error?: string;
  code?: string;
}

export interface OptimizationRecommendationDetailResponse {
  success: boolean;
  data?: OptimizationRecommendationRow;
  error?: string;
  code?: string;
}

export interface OptimizationDecisionBody {
  action: OptimizationDecisionAction;
  reason_code?: string;
  note?: string;
}

export interface OptimizationDecisionResponse {
  success: boolean;
  data?: {
    recommendation: OptimizationRecommendationRow;
    decision_logged_at: string;
  };
  error?: string;
  code?: string;
}
