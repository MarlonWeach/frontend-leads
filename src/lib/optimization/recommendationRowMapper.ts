import type { OptimizationRecommendationRow } from '@/types/optimizationRecommendations';

/** Converte linha do Supabase para o contrato exposto pela API. */
export function mapRecommendationRow(row: Record<string, unknown>): OptimizationRecommendationRow {
  return {
    id: String(row.id),
    meta_account_id: String(row.meta_account_id),
    scope: row.scope as OptimizationRecommendationRow['scope'],
    entity_id: String(row.entity_id),
    competence_month: row.competence_month != null ? String(row.competence_month) : null,
    recommendation_type: row.recommendation_type as OptimizationRecommendationRow['recommendation_type'],
    confidence_level: row.confidence_level as OptimizationRecommendationRow['confidence_level'],
    status: row.status as OptimizationRecommendationRow['status'],
    generated_at: String(row.generated_at),
    expires_at: String(row.expires_at),
    action_payload: (row.action_payload as Record<string, unknown>) || {},
    score_breakdown: (row.score_breakdown as Record<string, unknown>) || {},
    evidence_summary: String(row.evidence_summary ?? ''),
    risk_flags: Array.isArray(row.risk_flags) ? (row.risk_flags as string[]) : [],
    context_snapshot: (row.context_snapshot as OptimizationRecommendationRow['context_snapshot']) ?? null,
    batch_id: String(row.batch_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
