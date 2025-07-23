// API Route: /api/leads/[lead_id]/quality/recalculate
// PBI 25-5: Recálculo/manual do score de qualidade de um lead

import { NextRequest, NextResponse } from 'next/server';
import { recalculateLeadQualityScore } from '@/services/leadQualityService';

// POST /api/leads/[lead_id]/quality/recalculate
export async function POST(
  request: NextRequest,
  { params }: { params: { lead_id: string } }
) {
  try {
    const { lead_id } = params;
    if (!lead_id) {
      return NextResponse.json({ success: false, error: 'lead_id is required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const { force, reason, details } = body;
    const result = await recalculateLeadQualityScore({ lead_id, force, reason, details });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, new_score: result.new_score, log: result.log });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 