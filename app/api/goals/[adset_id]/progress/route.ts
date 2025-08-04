// API Route: goals/[adset_id]/progress
// PBI 25 - Task 25-3: Monitoramento diário de volume vs meta

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '../../../../../src/lib/supabaseServer';
import { ProgressStatus, AdsetProgressTracking, ProgressHistory, ProgressSummary } from '../../../../../src/types/progress';

// GET /api/goals/[adset_id]/progress - Histórico e status atual
export async function GET(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    if (!adset_id) {
      return NextResponse.json({ success: false, error: 'adset_id is required' }, { status: 400 });
    }

    // Buscar histórico de tracking
    const { data: history, error } = await supabase
      .from('adset_progress_tracking')
      .select('*')
      .eq('adset_id', adset_id)
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Status atual = último registro
    const last = history && history.length > 0 ? history[history.length - 1] : null;
    const summary: ProgressSummary = last
      ? {
          adset_id,
          current_status: last.status as ProgressStatus,
          last_tracking: last
        }
      : {
          adset_id,
          current_status: 'on_track',
          last_tracking: null
        };

    const response: ProgressHistory & { summary: ProgressSummary } = {
      adset_id,
      history: history || [],
      summary
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 