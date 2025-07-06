import { NextResponse } from 'next/server';
import { getCacheStats, getCacheMetrics } from "../../../../../src/utils/cache";
import { logger } from '../../../../../src/utils/logger';

// Log de diagnóstico para verificar se o arquivo está sendo carregado
console.log('🔍 [DIAGNÓSTICO] Arquivo route.ts de cache/stats carregado:', new Date().toISOString());

export async function GET() {
  console.log('🔍 [DIAGNÓSTICO] GET /api/dashboard/cache/stats chamado:', new Date().toISOString());
  
  try {
    logger.info('Cache stats endpoint called');
    
    const stats = getCacheStats();
    const metrics = getCacheMetrics();
    
    console.log('🔍 [DIAGNÓSTICO] Dados do cache obtidos com sucesso');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      metrics,
      diagnostic: 'Endpoint funcionando corretamente'
    });
  } catch (error) {
    console.error('🔍 [DIAGNÓSTICO] Erro no endpoint cache/stats:', error);
    logger.error('Error in cache stats endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cache stats',
        timestamp: new Date().toISOString(),
        diagnostic: 'Erro capturado no endpoint'
      },
      { status: 500 }
    );
  }
} 