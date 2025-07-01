import { NextResponse } from 'next/server';
import { getCacheStats, getCacheMetrics } from "@/utils/cache";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    const stats = getCacheStats();
    const metrics = getCacheMetrics();
    
    const response = {
      stats,
      metrics,
      timestamp: new Date().toISOString(),
      cacheHealth: {
        hitRate: stats.overallHitRate,
        efficiency: stats.overallHitRate > 70 ? 'excellent' : 
                   stats.overallHitRate > 50 ? 'good' : 
                   stats.overallHitRate > 30 ? 'fair' : 'poor',
        recommendations: [] as string[]
      }
    };

    // Adicionar recomendações baseadas nas métricas
    if (stats.overallHitRate < 50) {
      response.cacheHealth.recommendations.push(
        'Considerar aumentar TTL para dados que mudam pouco'
      );
    }
    
    if (stats.totalRequests > 1000 && stats.overallHitRate < 30) {
      response.cacheHealth.recommendations.push(
        'Cache pode estar sendo invalidado muito frequentemente'
      );
    }

    if (stats.cacheSize > 100) {
      response.cacheHealth.recommendations.push(
        'Cache está grande, considerar limpeza periódica'
      );
    }

    logger.info({ stats }, 'Cache stats requested');
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error({ error }, 'Error getting cache stats');
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas do cache' },
      { status: 500 }
    );
  }
} 