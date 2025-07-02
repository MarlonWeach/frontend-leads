import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../src/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Buscar métricas apenas da tabela meta_leads (sem JOIN problemático)
    const { data: metrics, error: metricsError } = await supabase
      .from('meta_leads')
      .select(`
        lead_count,
        spend,
        impressions,
        clicks,
        ad_id,
        created_time
      `)
      .not('ad_id', 'is', null); // Filtrar apenas registros com ad_id válido

    if (metricsError) {
      console.error('Erro ao buscar métricas:', metricsError);
      throw metricsError;
    }

    // Agregação dos dados
    const aggregatedMetrics = metrics.reduce((acc, metric) => {
      acc.totalLeads += metric.lead_count || 0;
      acc.totalSpend += metric.spend || 0;
      acc.totalImpressions += metric.impressions || 0;
      acc.totalClicks += metric.clicks || 0;
      return acc;
    }, {
      totalLeads: 0,
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0
    });

    // Cálculo de métricas derivadas
    const ctr = aggregatedMetrics.totalImpressions > 0 
      ? (aggregatedMetrics.totalClicks / aggregatedMetrics.totalImpressions) * 100 
      : 0;
    
    const cpl = aggregatedMetrics.totalLeads > 0 
      ? aggregatedMetrics.totalSpend / aggregatedMetrics.totalLeads 
      : 0;

    return NextResponse.json({
      metrics: {
        leads: aggregatedMetrics.totalLeads,
        spend: aggregatedMetrics.totalSpend,
        impressions: aggregatedMetrics.totalImpressions,
        clicks: aggregatedMetrics.totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        cpl: parseFloat(cpl.toFixed(2))
      }
    });

  } catch (error) {
    logger.error({
      msg: 'Erro ao buscar dados de atividade',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados de atividade' },
      { status: 500 }
    );
  }
} 