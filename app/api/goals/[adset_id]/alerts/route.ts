// API Route: goals/[adset_id]/alerts
// PBI 25 - Task 25-6: Sistema de alerta quando em desvio de meta

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '../../../../../src/lib/supabaseServer';
import { ProgressAlertHistory, AdsetProgressAlert } from '../../../../../src/types/progress';

// GET /api/goals/[adset_id]/alerts - Lista de alertas históricos
export async function GET(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    if (!adset_id) {
      return NextResponse.json({ success: false, error: 'adset_id is required' }, { status: 400 });
    }

    const { data: alerts, error } = await supabase
      .from('adset_progress_alerts')
      .select('*')
      .eq('adset_id', adset_id)
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const response: ProgressAlertHistory = {
      adset_id,
      alerts: alerts || []
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 