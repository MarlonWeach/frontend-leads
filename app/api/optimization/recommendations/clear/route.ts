import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      meta_account_id?: string;
      competence_month?: string | null;
    };

    const metaAccountId = String(body.meta_account_id || '').trim();
    if (!metaAccountId) {
      return NextResponse.json({ success: false, error: 'meta_account_id é obrigatório' }, { status: 400 });
    }

    if (!isPilotMetaAccountAllowed(metaAccountId)) {
      return NextResponse.json(
        { success: false, error: 'Conta Meta não autorizada', code: 'META_ACCOUNT_FORBIDDEN' },
        { status: 403 }
      );
    }

    const competenceMonth = body.competence_month?.trim() || null;

    let listQuery = supabase
      .from('optimization_recommendations')
      .select('id')
      .eq('meta_account_id', metaAccountId)
      .eq('status', 'active');

    if (competenceMonth) {
      listQuery = listQuery.eq('competence_month', competenceMonth);
    }

    const { data: activeRows, error: listError } = await listQuery;
    if (listError) {
      return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
    }

    const activeIds = (activeRows || []).map((row) => String((row as { id: string }).id));
    if (!activeIds.length) {
      return NextResponse.json({ success: true, cleared: 0 });
    }

    const nowIso = new Date().toISOString();
    const decisionsPayload = activeIds.map((recommendationId) => ({
      recommendation_id: recommendationId,
      action: 'discard',
      reason_code: 'bulk_clear',
      note: 'Limpeza em massa via painel de recomendações',
      decided_by: userId,
      decided_at: nowIso,
    }));

    const { error: insertError } = await supabase
      .from('optimization_recommendation_decisions')
      .insert(decisionsPayload);
    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('optimization_recommendations')
      .update({ status: 'discarded', updated_at: nowIso })
      .in('id', activeIds)
      .eq('status', 'active');

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cleared: activeIds.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
