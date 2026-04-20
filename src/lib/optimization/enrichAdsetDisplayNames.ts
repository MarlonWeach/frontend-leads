import type { SupabaseClient } from '@supabase/supabase-js';
import type { OptimizationRecommendationRow } from '@/types/optimizationRecommendations';

/**
 * Preenche `adset_display_name` e, quando possível, `context_snapshot.goal_context.adset_name`
 * a partir da tabela `adsets` (nome sincronizado da Meta), com fallback no nome salvo na meta.
 */
export async function enrichRecommendationsWithAdsetNames(
  supabase: SupabaseClient,
  rows: OptimizationRecommendationRow[]
): Promise<void> {
  if (!rows.length) return;

  const ids = [...new Set(rows.map((r) => r.entity_id).filter(Boolean))];
  const { data } = await supabase.from('adsets').select('id, name').in('id', ids);

  const byId = new Map<string, string>();
  if (data?.length) {
    for (const row of data) {
      const id = String((row as { id: string }).id);
      const raw = (row as { name?: string | null }).name;
      const n = raw != null ? String(raw).trim() : '';
      if (n) byId.set(id, n);
    }
  }

  const { data: goalNames } = await supabase
    .from('adset_goals')
    .select('adset_id, adset_name')
    .in('adset_id', ids);

  const byGoalRow = new Map<string, string>();
  for (const row of goalNames || []) {
    const aid = String((row as { adset_id: string }).adset_id);
    const raw = (row as { adset_name?: string | null }).adset_name;
    const n = raw != null ? String(raw).trim() : '';
    if (n) byGoalRow.set(aid, n);
  }

  for (const rec of rows) {
    const fromSnapshot = rec.context_snapshot?.goal_context?.adset_name?.trim();
    const fromAdsets = byId.get(rec.entity_id);
    const fromGoalsTable = byGoalRow.get(rec.entity_id);
    const display = fromAdsets || fromSnapshot || fromGoalsTable || undefined;

    if (display) {
      (rec as OptimizationRecommendationRow & { adset_display_name?: string }).adset_display_name =
        display;
      if (rec.context_snapshot?.goal_context && fromAdsets && !fromSnapshot) {
        rec.context_snapshot.goal_context.adset_name = fromAdsets;
      }
    }
  }
}
