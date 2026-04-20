import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '../../../../src/lib/supabaseServer';
import { buildOptimizationContextItems } from '../../../../src/lib/goals/optimizationContext';
import { GoalOptimizationContextResponse } from '../../../../src/types/goals';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metaAccountId = searchParams.get('meta_account_id') || '256925527';
    const competenceParam = searchParams.get('competence_month');

    const { data, error } = await buildOptimizationContextItems(supabase, metaAccountId, competenceParam);

    if (error) {
      return NextResponse.json(
        { success: false, error } satisfies GoalOptimizationContextResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    } satisfies GoalOptimizationContextResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies GoalOptimizationContextResponse,
      { status: 500 }
    );
  }
}
