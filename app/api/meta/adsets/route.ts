import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../src/utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { campaignId, startDate, endDate, status, hasImpressions } = await request.json();

    logger.info({
      msg: 'Requisição para buscar adsets do Supabase',
      campaignId,
      startDate,
      endDate,
      status,
      hasImpressions
    });

    let query = supabase.from('adsets').select(`*, campaigns(name)`);

    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_time', startDate);
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('created_time', nextDay.toISOString().split('T')[0]);
    }
    
    // Log da query construída
    // NOTA: O Supabase não expõe a string SQL final, então logamos os modificadores.
    logger.info({
      msg: 'Query Supabase construída (antes da execução)',
      filters: { status, startDate, endDate }
    });
    
    const { data: adsets, error } = await query;

    if (error) {
      logger.error({
        msg: 'Erro na query do Supabase',
        error: error,
        details: error.details,
        message: error.message
      });
      throw error;
    }

    logger.info({
      msg: 'Adsets buscados com sucesso do Supabase',
      count: adsets?.length ?? 0
    });

    return NextResponse.json({ adsets });

  } catch (error: any) {
    logger.error({
      msg: 'Erro GERAL na rota /api/meta/adsets',
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const hasImpressions = searchParams.get('hasImpressions') === 'true';

    logger.info({
      msg: 'Requisição GET para buscar adsets do Supabase',
      campaignId,
      startDate,
      endDate,
      status,
      hasImpressions
    });

    // Construir query base
    let query = supabase
      .from('adsets')
      .select(`*,campaigns(name)`);

    // Filtros
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_time', startDate);
    }

    if (endDate) {
      // Adicionar 1 dia para incluir o dia inteiro no filtro
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('created_time', nextDay.toISOString().split('T')[0]);
    }

    /*
    if (hasImpressions) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: adsetIdsWithImpressions } = await supabase
        .from('meta_leads')
        .select('adset_id')
        .gte('date_start', thirtyDaysAgo.toISOString().split('T')[0])
        .gt('impressions', 0);

      if (adsetIdsWithImpressions && adsetIdsWithImpressions.length > 0) {
        const ids = adsetIdsWithImpressions.map(item => item.adset_id);
        query = query.in('id', ids);
      } else {
        // Se não houver adsets com impressões, retornar uma lista vazia
        return NextResponse.json({ adsets: [] });
      }
    }
    */

    // Buscar adsets
    const { data: adsets, error: adsetsError } = await query.order('name');

    if (adsetsError) {
      logger.error({
        msg: 'Erro ao buscar adsets do Supabase via GET',
        error: adsetsError.message
      });
      throw new Error(`Erro ao buscar adsets: ${adsetsError.message}`);
    }

    // Se solicitado, filtrar apenas adsets com impressões nos últimos 30 dias
    let filteredAdsets = adsets;
    if (hasImpressions) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Buscar métricas dos últimos 30 dias
      const { data: metrics, error: metricsError } = await supabase
        .from('meta_leads')
        .select('adset_name, impressions')
        .gte('created_time', startDateStr)
        .gt('impressions', 0);

      if (metricsError) {
        logger.error({
          msg: 'Erro ao buscar métricas do Supabase via GET',
          error: metricsError.message
        });
        throw new Error(`Erro ao buscar métricas: ${metricsError.message}`);
      }

      // Criar set de adsets com impressões
      const adsetsWithImpressions = new Set(metrics.map(m => m.adset_name));
      
      // Filtrar adsets
      filteredAdsets = adsets.filter(adset => adsetsWithImpressions.has(adset.name));
    }

    // Buscar métricas agregadas para cada adset
    const adsetsWithMetrics = await Promise.all(
      filteredAdsets.map(async (adset) => {
        try {
          // Buscar métricas dos últimos 30 dias por padrão
          const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

          const { data: metrics, error: metricsError } = await supabase
            .from('meta_leads')
            .select('spend, impressions, clicks, lead_count, ctr, cpm')
            .eq('adset_name', adset.name)
            .gte('created_time', defaultStartDate)
            .lte('created_time', defaultEndDate);

          if (metricsError) {
            logger.warn({
              msg: 'Erro ao buscar métricas do adset via GET',
              adsetName: adset.name,
              error: metricsError.message
            });
            return {
              ...adset,
              metrics: {
                spend: 0,
                impressions: 0,
                clicks: 0,
                leads: 0,
                ctr: 0,
                cpm: 0
              }
            };
          }

          // Agregar métricas
          const aggregatedMetrics = metrics.reduce((acc, metric) => ({
            spend: acc.spend + (metric.spend || 0),
            impressions: acc.impressions + (metric.impressions || 0),
            clicks: acc.clicks + (metric.clicks || 0),
            leads: acc.leads + (metric.lead_count || 0),
            ctr: 0, // Será calculado
            cpm: 0  // Será calculado
          }), {
            spend: 0,
            impressions: 0,
            clicks: 0,
            leads: 0,
            ctr: 0,
            cpm: 0
          });

          // Calcular CTR e CPM
          if (aggregatedMetrics.impressions > 0) {
            aggregatedMetrics.ctr = (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100;
            aggregatedMetrics.cpm = (aggregatedMetrics.spend / aggregatedMetrics.impressions) * 1000;
          }

          return {
            ...adset,
            metrics: aggregatedMetrics
          };

        } catch (error) {
          logger.warn({
            msg: 'Erro ao processar métricas do adset via GET',
            adsetName: adset.name,
            error: error instanceof Error ? error.message : String(error)
          });
          return {
            ...adset,
            metrics: {
              spend: 0,
              impressions: 0,
              clicks: 0,
              leads: 0,
              ctr: 0,
              cpm: 0
            }
          };
        }
      })
    );

    logger.info({
      msg: 'Adsets recuperados com sucesso do Supabase via GET',
      count: adsetsWithMetrics.length,
      campaignId
    });

    return NextResponse.json({
      success: true,
      adsets: adsetsWithMetrics,
      count: adsetsWithMetrics.length
    });

  } catch (error) {
    logger.error({
      msg: 'Erro ao buscar adsets do Supabase via GET',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Erro ao buscar adsets do Supabase',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 