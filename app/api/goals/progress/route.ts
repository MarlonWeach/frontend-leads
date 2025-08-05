// API Route: goals/progress
// PBI 25 - Task 25-3: Monitoramento diário de volume vs meta

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { supabaseServer as supabase } from '../../../../src/lib/supabaseServer';
import { ProgressBatchSummary, ProgressStatus } from '../../../../src/types/progress';

// GET /api/goals/progress?date=YYYY-MM-DD - Tracking de todos os adsets em um dia
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    // Buscar tracking de todos os adsets para a data
    const { data, error } = await supabase
      .from('adset_progress_tracking')
      .select('*')
      .eq('date', date);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Resumir status por adset
    const summaries = (data || []).map(row => ({
      adset_id: row.adset_id,
      current_status: row.status as ProgressStatus,
      last_tracking: row,
      active_alert: undefined // Pode ser preenchido em endpoint separado
    }));

    const response: ProgressBatchSummary = {
      date,
      summaries
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 