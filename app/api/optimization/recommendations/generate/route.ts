import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAuthenticatedUserId } from '@/lib/auth/serverSession';
import { isPilotMetaAccountAllowed } from '@/lib/optimization/metaAccountAccess';
import { generateRecommendationsStub } from '@/lib/optimization/generateRecommendationsStub';

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
      overwrite_active?: boolean;
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
    const overwriteActive = Boolean(body.overwrite_active);
    const result = await generateRecommendationsStub(
      supabase,
      metaAccountId,
      competenceMonth,
      overwriteActive
    );

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      created: result.created,
      batch_id: result.batch_id,
      overwrite_active: overwriteActive,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
