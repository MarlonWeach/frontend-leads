import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Buscar ads ativos
    const { data: activeAds, error: adsError } = await supabase
      .from('ads')
      .select('ad_id')
      .eq('status', 'ACTIVE');
    if (adsError) throw adsError;
    const activeAdIds = (activeAds || []).map(ad => ad.ad_id).filter(Boolean);
    if (activeAdIds.length === 0) {
      return NextResponse.json({
        performance: { spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, conversionRate: 0 }
      });
    }

    return NextResponse.json({
      performance: { spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, conversionRate: 0 }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
} 