// API Route: /api/leads/[lead_id]/quality
// PBI 25-5: Consulta de score e logs de qualidade de um lead

import { NextRequest, NextResponse } from 'next/server';
import { getLeadQualityScore } from '@/services/leadQualityService';

// GET /api/leads/[lead_id]/quality
export async function GET(
  request: NextRequest,
  { params }: { params: { lead_id: string } }
) {
  try {
    const { lead_id } = params;
    if (!lead_id) {
      return NextResponse.json({ success: false, error: 'lead_id is required' }, { status: 400 });
    }
    const score = await getLeadQualityScore(lead_id);
    if (!score) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: score });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 