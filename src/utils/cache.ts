import { serverCache, CacheType, ServerCache } from './server-cache';
import { logger } from './logger';

// Configurações de cache inteligente por tipo de dado
export const CACHE_CONFIGS: { [key: string]: CacheConfig } = {
  campaigns: { 
    ttl: 15 * 60, // 15 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['campaign_status_change', 'campaign_create', 'campaign_delete']
  },
  adsets: { 
    ttl: 10 * 60, // 10 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['adset_status_change', 'adset_create', 'adset_delete']
  },
  ads: { 
    ttl: 5 * 60, // 5 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['ad_status_change', 'ad_create', 'ad_delete']
  },
  leads: { 
    ttl: 30 * 60, // 30 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['lead_create', 'lead_update']
  },
  insights: { 
    ttl: 2 * 60, // 2 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['insight_update']
  },
  dashboard_overview: {
    ttl: 5 * 60, // 5 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['data_sync', 'campaign_change', 'lead_create']
  },
  performance: {
    ttl: 3 * 60, // 3 minutos
    type: CacheType.DASHBOARD_OVERVIEW,
    invalidateOn: ['performance_update', 'data_sync']
  }
};

// Interface para configuração de cache
export interface CacheConfig {
  ttl: number;
  type: CacheType;
  invalidateOn?: string[];
}

// Interface para métricas de cache
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  lastInvalidation: Date | null;
}

// Classe para cache inteligente
export class IntelligentCache {
  private static instance: IntelligentCache;
  private metrics: Map<string, CacheMetrics>;
  private invalidationCallbacks: Map<string, Set<() => void>>;

  private constructor() {
    this.metrics = new Map();
    this.invalidationCallbacks = new Map();
    logger.info('Intelligent cache system initialized');
  }

  public static getInstance(): IntelligentCache {
    if (!IntelligentCache.instance) {
      IntelligentCache.instance = new IntelligentCache();
    }
    return IntelligentCache.instance;
  }

  // Obter dados com cache inteligente
  public async getCachedData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig,
    params?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(key, params);
    
    try {
      // Tentar obter do cache
      const cachedData = serverCache.get<T>(cacheKey);
      
      if (cachedData !== undefined) {
        this.recordHit(key);
        const responseTime = Date.now() - startTime;
        logger.debug({ key: cacheKey, responseTime }, 'Cache hit');
        return cachedData;
      }

      // Cache miss - buscar dados
      this.recordMiss(key);
      logger.debug({ key: cacheKey }, 'Cache miss - fetching data');
      
      const data = await fetchFn();
      
      // Salvar no cache
      serverCache.set(cacheKey, data, config.ttl);
      
      const responseTime = Date.now() - startTime;
      logger.debug({ key: cacheKey, responseTime }, 'Data fetched and cached');
      
      return data;
    } catch (error) {
      this.recordMiss(key);
      logger.error({ key: cacheKey, error }, 'Error fetching data');
      throw error;
    }
  }

  // Invalidar cache por evento
  public invalidateByEvent(event: string): void {
    const keysToInvalidate: string[] = [];
    
    // Encontrar todas as configurações que devem ser invalidadas por este evento
    Object.entries(CACHE_CONFIGS).forEach(([key, config]) => {
      if (config.invalidateOn?.includes(event)) {
        keysToInvalidate.push(key);
      }
    });

    // Invalidar cache
    keysToInvalidate.forEach(key => {
      const config = CACHE_CONFIGS[key];
      if (config) {
        serverCache.invalidateType(config.type);
        logger.info({ event, invalidatedKey: key }, 'Cache invalidated by event');
      }
    });

    // Executar callbacks de invalidação
    const callbacks = this.invalidationCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          logger.error({ event, error }, 'Error in invalidation callback');
        }
      });
    }
  }

  // Registrar callback para invalidação
  public onInvalidation(event: string, callback: () => void): void {
    if (!this.invalidationCallbacks.has(event)) {
      this.invalidationCallbacks.set(event, new Set());
    }
    this.invalidationCallbacks.get(event)!.add(callback);
  }

  // Gerar chave de cache
  private generateKey(baseKey: string, params?: Record<string, any>): string {
    return ServerCache.generateKey(CACHE_CONFIGS[baseKey]?.type || CacheType.DASHBOARD_OVERVIEW, params);
  }

  // Registrar hit no cache
  private recordHit(key: string): void {
    const metrics = this.getOrCreateMetrics(key);
    metrics.hits++;
    metrics.totalRequests++;
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
  }

  // Registrar miss no cache
  private recordMiss(key: string): void {
    const metrics = this.getOrCreateMetrics(key);
    metrics.misses++;
    metrics.totalRequests++;
    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
  }

  // Obter ou criar métricas para uma chave
  private getOrCreateMetrics(key: string): CacheMetrics {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        lastInvalidation: null
      });
    }
    return this.metrics.get(key)!;
  }

  // Obter métricas de cache
  public getMetrics(key?: string): CacheMetrics | Record<string, CacheMetrics> {
    if (key) {
      return this.getOrCreateMetrics(key);
    }
    
    const allMetrics: Record<string, CacheMetrics> = {};
    this.metrics.forEach((metrics, k) => {
      allMetrics[k] = metrics;
    });
    return allMetrics;
  }

  // Limpar métricas
  public clearMetrics(): void {
    this.metrics.clear();
    logger.info('Cache metrics cleared');
  }

  // Obter estatísticas gerais
  public getStats(): {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    totalRequests: number;
    cacheSize: number;
  } {
    let totalHits = 0;
    let totalMisses = 0;
    let totalRequests = 0;

    this.metrics.forEach(metrics => {
      totalHits += metrics.hits;
      totalMisses += metrics.misses;
      totalRequests += metrics.totalRequests;
    });

    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    const serverStats = serverCache.getStats();

    return {
      totalHits,
      totalMisses,
      overallHitRate,
      totalRequests,
      cacheSize: serverStats.keys
    };
  }
}

// Exportar instância singleton
export const intelligentCache = IntelligentCache.getInstance();

// Funções utilitárias para facilitar o uso
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  const config = CACHE_CONFIGS[key];
  if (!config) {
    throw new Error(`Cache configuration not found for key: ${key}`);
  }
  
  return intelligentCache.getCachedData(key, fetchFn, config, params);
}

export function invalidateCache(event: string): void {
  intelligentCache.invalidateByEvent(event);
}

export function getCacheStats(): ReturnType<typeof intelligentCache.getStats> {
  return intelligentCache.getStats();
}

export function getCacheMetrics(key?: string): ReturnType<typeof intelligentCache.getMetrics> {
  return intelligentCache.getMetrics(key);
}

export function invalidateAllCache(): void {
  // Invalida todos os tipos de cache conhecidos
  Object.values(CACHE_CONFIGS).forEach(config => {
    serverCache.invalidateType(config.type);
  });
  logger.info('All cache invalidated');
} 