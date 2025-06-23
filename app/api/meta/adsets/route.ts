import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../src/utils/logger';

// Inicializa o cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleRequest(request: NextRequest, isPost: boolean) {
  try {
    // Ler os parâmetros de filtro da requisição
    let campaignId, status, startDate, endDate;

    if (isPost) {
      const body = await request.json();
      campaignId = body.campaignId;
      status = body.status;
      startDate = body.startDate;
      endDate = body.endDate;
    } else {
      const { searchParams } = new URL(request.url);
      campaignId = searchParams.get('campaignId');
      status = searchParams.get('status');
      startDate = searchParams.get('startDate');
      endDate = searchParams.get('endDate');
    }

    logger.info({
      msg: 'Buscando adsets do Supabase com filtros',
      campaignId,
      status,
      startDate,
      endDate
    });

    // Construir a query para o Supabase
    let query = supabase.from('adsets').select('*');

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
      query = query.lte('created_time', endDate);
    }
    
    // Ordenar por data de criação para consistência
    query = query.order('created_time', { ascending: false });

    // Executar a query
    const { data: adsets, error } = await query;

    if (error) {
      logger.error({ error }, 'Erro ao buscar adsets do Supabase.');
      throw error;
    }

    logger.info({ count: adsets?.length || 0 }, 'Adsets buscados com sucesso do Supabase.');
    return NextResponse.json({ adsets: adsets || [] });

  } catch (error: any) {
    logger.error({
      msg: `Erro na rota /api/meta/adsets (${isPost ? 'POST' : 'GET'})`,
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleRequest(request, true);
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
} 