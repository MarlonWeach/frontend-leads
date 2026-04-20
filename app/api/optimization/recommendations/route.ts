import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';
import { expireStaleRecommendations } from '@/lib/optimization/expireRecommendations';
import { mapRecommendationRow } from '@/lib/optimization/recommendationRowMapper';
import { enrichRecommendationsWithAdsetNames } from '@/lib/optimization/enrichAdsetDisplayNames';
import type { OptimizationRecommendationsListResponse } from '@/types/optimizationRecommendations';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const CONFIDENCE_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metaAccountId = searchParams.get('meta_account_id')?.trim() || '';
    if (!metaAccountId) {
      return NextResponse.json(
        { success: false, error: 'meta_account_id é obrigatório' } satisfies OptimizationRecommendationsListResponse,
        { status: 400 }
      );
    }

    if (!isPilotMetaAccountAllowed(metaAccountId)) {
      return NextResponse.json(
        { success: false, error: 'Conta Meta não autorizada para este piloto', code: 'META_ACCOUNT_FORBIDDEN' },
        { status: 403 }
      );
    }

    const statusParam = searchParams.get('status')?.trim();
    const competenceMonth = searchParams.get('competence_month')?.trim();
    const limitRaw = Number(searchParams.get('limit') || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : DEFAULT_LIMIT;

    await expireStaleRecommendations(supabase, metaAccountId);

    let query = supabase.from('optimization_recommendations').select('*').eq('meta_account_id', metaAccountId);

    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length) {
        query = query.in('status', statuses);
      }
    } else {
      query = query.eq('status', 'active');
    }

    if (competenceMonth) {
      query = query.eq('competence_month', competenceMonth);
    }

    const { data, error } = await query.order('generated_at', { ascending: false }).limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies OptimizationRecommendationsListResponse,
        { status: 500 }
      );
    }

    const rows = (data || []).map((r) => mapRecommendationRow(r as Record<string, unknown>));
    await enrichRecommendationsWithAdsetNames(supabase, rows);
    rows.sort((a, b) => {
      const cr =
        (CONFIDENCE_RANK[a.confidence_level] ?? 9) - (CONFIDENCE_RANK[b.confidence_level] ?? 9);
      if (cr !== 0) return cr;
      return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
    });

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
