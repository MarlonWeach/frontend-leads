import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';
import { expireStaleRecommendations } from '@/lib/optimization/expireRecommendations';
import { mapRecommendationRow } from '@/lib/optimization/recommendationRowMapper';
import { enrichRecommendationsWithAdsetNames } from '@/lib/optimization/enrichAdsetDisplayNames';
import type { OptimizationRecommendationDetailResponse } from '@/types/optimizationRecommendations';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const { data: peek, error: peekError } = await supabase
      .from('optimization_recommendations')
      .select('meta_account_id')
      .eq('id', id)
      .maybeSingle();

    if (peekError || !peek?.meta_account_id) {
      return NextResponse.json(
        { success: false, error: 'Recomendação não encontrada' } satisfies OptimizationRecommendationDetailResponse,
        { status: 404 }
      );
    }

    if (!isPilotMetaAccountAllowed(String(peek.meta_account_id))) {
      return NextResponse.json({ success: false, error: 'Conta Meta não autorizada' }, { status: 403 });
    }

    await expireStaleRecommendations(supabase, String(peek.meta_account_id));

    const { data, error } = await supabase.from('optimization_recommendations').select('*').eq('id', id).maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Recomendação não encontrada' } satisfies OptimizationRecommendationDetailResponse,
        { status: 404 }
      );
    }

    const row = mapRecommendationRow(data as Record<string, unknown>);
    await enrichRecommendationsWithAdsetNames(supabase, [row]);
    return NextResponse.json({
      success: true,
      data: row,
    } satisfies OptimizationRecommendationDetailResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies OptimizationRecommendationDetailResponse,
      { status: 500 }
    );
  }
}
