import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';
import { mapRecommendationRow } from '@/lib/optimization/recommendationRowMapper';
import { enrichRecommendationsWithAdsetNames } from '@/lib/optimization/enrichAdsetDisplayNames';
import type { OptimizationRecommendationsListResponse } from '@/types/optimizationRecommendations';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metaAccountId = searchParams.get('meta_account_id')?.trim() || '';
    const entityId = searchParams.get('entity_id')?.trim() || '';
    if (!metaAccountId || !entityId) {
      return NextResponse.json(
        { success: false, error: 'meta_account_id e entity_id são obrigatórios' },
        { status: 400 }
      );
    }

    if (!isPilotMetaAccountAllowed(metaAccountId)) {
      return NextResponse.json({ success: false, error: 'Conta Meta não autorizada' }, { status: 403 });
    }

    const limitRaw = Number(searchParams.get('limit') || 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : 50;

    const { data, error } = await supabase
      .from('optimization_recommendations')
      .select('*')
      .eq('meta_account_id', metaAccountId)
      .eq('entity_id', entityId)
      .in('status', ['applied', 'discarded', 'expired'])
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((r) => mapRecommendationRow(r as Record<string, unknown>));
    await enrichRecommendationsWithAdsetNames(supabase, rows);

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    } satisfies OptimizationRecommendationsListResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies OptimizationRecommendationsListResponse,
      { status: 500 }
    );
  }
}
