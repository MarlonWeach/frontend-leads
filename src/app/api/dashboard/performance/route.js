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

    // Buscar dados de meta_leads filtrando por ad_id ativo e datas
    let metaLeadsQuery = supabase
      .from('meta_leads')
      .select('lead_count, spend, impressions, clicks, created_time, ad_id');
    metaLeadsQuery = metaLeadsQuery.in('ad_id', activeAdIds);
    if (dateFrom) metaLeadsQuery = metaLeadsQuery.gte('created_time', dateFrom);
    if (dateTo) metaLeadsQuery = metaLeadsQuery.lte('created_time', dateTo);
    const { data: metaLeadsData, error: metaLeadsError } = await metaLeadsQuery;
    if (metaLeadsError) throw metaLeadsError;

    // Agregar métricas
    const aggregated = metaLeadsData.reduce((acc, entry) => {
      acc.spend += parseFloat(entry.spend) || 0;
      acc.impressions += parseInt(entry.impressions) || 0;
      acc.clicks += parseInt(entry.clicks) || 0;
      acc.leads += parseInt(entry.lead_count) || 0;
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, leads: 0 });
    const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
    const conversionRate = aggregated.clicks > 0 ? (aggregated.leads / aggregated.clicks) * 100 : 0;

    return NextResponse.json({
      performance: {
        ...aggregated,
        ctr,
        conversionRate
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
} 