import type { SupabaseClient } from '@supabase/supabase-js';

export async function expireStaleRecommendations(
  supabase: SupabaseClient,
  metaAccountId: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  await supabase
    .from('optimization_recommendations')
    .update({ status: 'expired', updated_at: nowIso })
    .eq('status', 'active')
    .eq('meta_account_id', metaAccountId)
    .lt('expires_at', nowIso);
}
