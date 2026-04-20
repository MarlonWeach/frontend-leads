import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';
import { expireStaleRecommendations } from '@/lib/optimization/expireRecommendations';
import { mapRecommendationRow } from '@/lib/optimization/recommendationRowMapper';
import { enrichRecommendationsWithAdsetNames } from '@/lib/optimization/enrichAdsetDisplayNames';
import type {
  OptimizationDecisionBody,
  OptimizationDecisionResponse,
} from '@/types/optimizationRecommendations';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set(['apply', 'discard', 'defer']);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as OptimizationDecisionBody;
    const action = String(body.action || '').trim() as OptimizationDecisionBody['action'];
    if (!ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: 'action inválida', code: 'INVALID_ACTION' },
        { status: 422 }
      );
    }

    const reasonCode = body.reason_code?.trim() || null;
    const note = body.note?.trim() || null;

    if (action === 'discard' && reasonCode === 'other' && !note) {
      return NextResponse.json(
        { success: false, error: 'note é obrigatório quando reason_code é other', code: 'NOTE_REQUIRED' },
        { status: 422 }
      );
    }

    const { data: rec, error: fetchError } = await supabase
      .from('optimization_recommendations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !rec) {
      return NextResponse.json(
        { success: false, error: 'Recomendação não encontrada' } satisfies OptimizationDecisionResponse,
        { status: 404 }
      );
    }

    const metaAccountId = String(rec.meta_account_id);
    if (!isPilotMetaAccountAllowed(metaAccountId)) {
      return NextResponse.json({ success: false, error: 'Conta Meta não autorizada' }, { status: 403 });
    }

    await expireStaleRecommendations(supabase, metaAccountId);

    const { data: fresh, error: refetchError } = await supabase
      .from('optimization_recommendations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (refetchError || !fresh) {
      return NextResponse.json(
        { success: false, error: 'Recomendação não encontrada' } satisfies OptimizationDecisionResponse,
        { status: 404 }
      );
    }

    const status = String(fresh.status);
    if (status === 'applied' || status === 'discarded') {
      return NextResponse.json(
        {
          success: false,
          error: 'Decisão já registrada para esta recomendação',
          code: 'RECOMMENDATION_ALREADY_DECIDED',
        } satisfies OptimizationDecisionResponse,
        { status: 409 }
      );
    }

    if (status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          error: 'Recomendação expirada',
          code: 'RECOMMENDATION_EXPIRED',
        } satisfies OptimizationDecisionResponse,
        { status: 409 }
      );
    }

    const now = new Date();
    if (status === 'active' && fresh.expires_at && new Date(String(fresh.expires_at)) < now) {
      await supabase
        .from('optimization_recommendations')
        .update({ status: 'expired', updated_at: now.toISOString() })
        .eq('id', id)
        .eq('status', 'active');

      return NextResponse.json(
        {
          success: false,
          error: 'Recomendação expirada',
          code: 'RECOMMENDATION_EXPIRED',
        } satisfies OptimizationDecisionResponse,
        { status: 409 }
      );
    }

    const decidedAt = now.toISOString();

    const { error: insDecisionError } = await supabase.from('optimization_recommendation_decisions').insert({
      recommendation_id: id,
      action,
      reason_code: reasonCode,
      note,
      decided_by: userId,
      decided_at: decidedAt,
    });

    if (insDecisionError) {
      return NextResponse.json(
        { success: false, error: insDecisionError.message } satisfies OptimizationDecisionResponse,
        { status: 500 }
      );
    }

    if (action === 'apply' || action === 'discard') {
      const nextStatus = action === 'apply' ? 'applied' : 'discarded';
      const { error: updError } = await supabase
        .from('optimization_recommendations')
        .update({ status: nextStatus, updated_at: decidedAt })
        .eq('id', id)
        .eq('status', 'active');

      if (updError) {
        return NextResponse.json(
          { success: false, error: updError.message } satisfies OptimizationDecisionResponse,
          { status: 500 }
        );
      }
    }

    const { data: finalRow } = await supabase.from('optimization_recommendations').select('*').eq('id', id).single();

    const recommendationOut = mapRecommendationRow((finalRow || fresh) as Record<string, unknown>);
    await enrichRecommendationsWithAdsetNames(supabase, [recommendationOut]);

    return NextResponse.json({
      success: true,
      data: {
        recommendation: recommendationOut,
        decision_logged_at: decidedAt,
      },
    } satisfies OptimizationDecisionResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies OptimizationDecisionResponse,
      { status: 500 }
    );
  }
}
