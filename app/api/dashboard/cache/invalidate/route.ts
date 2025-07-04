import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from "@/utils/cache";
import { logger } from '@/utils/logger';

// Log de diagnóstico para verificar se o arquivo está sendo carregado
console.log('🔍 [DIAGNÓSTICO] Arquivo route.ts de cache/invalidate carregado:', new Date().toISOString());

export async function POST(request: NextRequest) {
  console.log('🔍 [DIAGNÓSTICO] POST /api/dashboard/cache/invalidate chamado:', new Date().toISOString());
  
  try {
    logger.info('Cache invalidate endpoint called');
    
    const body = await request.json();
    const { event } = body;
    
    console.log('🔍 [DIAGNÓSTICO] Dados recebidos:', { event });
    
    const result = invalidateCache(event);
    
    console.log('🔍 [DIAGNÓSTICO] Cache invalidado com sucesso');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      diagnostic: 'Endpoint funcionando corretamente'
    });
  } catch (error) {
    console.error('🔍 [DIAGNÓSTICO] Erro no endpoint cache/invalidate:', error);
    logger.error('Error in cache invalidate endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to invalidate cache',
        timestamp: new Date().toISOString(),
        diagnostic: 'Erro capturado no endpoint'
      },
      { status: 500 }
    );
  }
} 