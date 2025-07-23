// API Route: /api/leads/quality/report
// PBI 25-5: Relatório agregado de qualidade de leads

import { NextRequest, NextResponse } from 'next/server';
import { getLeadQualityReport } from '@/services/leadQualityService';

// GET /api/leads/quality/report?adset_id=...&campaign_id=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adset_id = searchParams.get('adset_id') || undefined;
    const campaign_id = searchParams.get('campaign_id') || undefined;
    const report = await getLeadQualityReport(adset_id, campaign_id);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 