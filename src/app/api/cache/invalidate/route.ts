import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from "@/utils/cache";
import { logger } from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Evento é obrigatório' },
        { status: 400 }
      );
    }

    // Eventos válidos
    const validEvents = [
      'data_sync',
      'campaign_change',
      'lead_create',
      'performance_update',
      'campaign_status_change',
      'campaign_create',
      'campaign_delete',
      'adset_status_change',
      'adset_create',
      'adset_delete',
      'ad_status_change',
      'ad_create',
      'ad_delete',
      'lead_update',
      'insight_update'
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { 
          error: 'Evento inválido',
          validEvents 
        },
        { status: 400 }
      );
    }

    // Invalidar cache
    invalidateCache(event);

    logger.info({ event }, 'Cache invalidated by event');
    
    return NextResponse.json({
      success: true,
      event,
      message: `Cache invalidado para o evento: ${event}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ error }, 'Error invalidating cache');
    return NextResponse.json(
      { error: 'Erro ao invalidar cache' },
      { status: 500 }
    );
  }
} 