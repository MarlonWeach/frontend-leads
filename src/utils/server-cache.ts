import NodeCache from 'node-cache';
import { logger } from './logger';

// Tipos de cache disponíveis
export enum CacheType {
  DASHBOARD_OVERVIEW = 'dashboard_overview',
  PERFORMANCE_DATA = 'performance_data',
  CAMPAIGNS_DATA = 'campaigns_data',
  ADSETS_DATA = 'adsets_data',
  ADS_DATA = 'ads_data',
  LEADS_DATA = 'leads_data',
  AI_ANALYSIS = 'ai_analysis',
  AI_ANOMALIES = 'ai_anomalies',
  AI_BILLING = 'ai_billing'
}

// Configuração de TTL para cada tipo de cache (em segundos)
const CACHE_TTL: Record<CacheType, number> = {
  [CacheType.DASHBOARD_OVERVIEW]: 5 * 60, // 5 minutos
  [CacheType.PERFORMANCE_DATA]: 10 * 60, // 10 minutos
  [CacheType.CAMPAIGNS_DATA]: 15 * 60, // 15 minutos
  [CacheType.ADSETS_DATA]: 15 * 60, // 15 minutos
  [CacheType.ADS_DATA]: 15 * 60, // 15 minutos
  [CacheType.LEADS_DATA]: 5 * 60, // 5 minutos
  [CacheType.AI_ANALYSIS]: 30 * 60, // 30 minutos
  [CacheType.AI_ANOMALIES]: 10 * 60, // 10 minutos
  [CacheType.AI_BILLING]: 60 * 60 // 1 hora
};

// Opções para o cache
type CacheOptions = {
  ttl?: number;
  checkperiod?: number;
};

// Interface para as estatísticas de cache
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  lastRefreshed: Record<string, Date | null>;
}

// Classe de cache do servidor
export class ServerCache {
  private static instance: ServerCache;
  private cache: NodeCache;
  private stats: {
    hits: number;
    misses: number;
    lastRefreshed: Record<string, Date | null>;
  };

  private constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutos padrão
      checkperiod: 60, // Verificar expiração a cada 60 segundos
      ...options
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      lastRefreshed: {}
    };
    
    // Registrar eventos de expiração
    this.cache.on('expired', (key, value) => {
      logger.debug({ key }, 'Cache entry expired');
    });
  }

  // Obter instância singleton
  public static getInstance(options?: CacheOptions): ServerCache {
    if (!ServerCache.instance) {
      ServerCache.instance = new ServerCache(options);
      logger.info('Server cache initialized');
    }
    return ServerCache.instance;
  }

  // Obter valor do cache
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    
    if (value === undefined) {
      this.stats.misses++;
      logger.debug({ key }, 'Cache miss');
      return undefined;
    }
    
    this.stats.hits++;
    logger.debug({ key }, 'Cache hit');
    return value;
  }

  // Definir valor no cache
  public set<T>(key: string, value: T, ttl?: number): boolean {
    let success: boolean;
    if (ttl !== undefined) {
      success = this.cache.set(key, value, ttl);
    } else {
      success = this.cache.set(key, value);
    }
    if (success) {
      this.stats.lastRefreshed[key] = new Date();
      logger.debug({ key, ttl }, 'Cache entry set');
    }
    return success;
  }

  // Obter ou definir valor no cache
  public async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    type: CacheType
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      const value = await fetchFn();
      this.set(key, value, CACHE_TTL[type]);
      return value;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        key,
        type
      }, 'Error fetching data for cache');
      throw error;
    }
  }

  // Invalidar uma entrada específica do cache
  public invalidate(key: string): boolean {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      logger.debug({ key }, 'Cache entry invalidated');
      delete this.stats.lastRefreshed[key];
    }
    return deleted > 0;
  }

  // Invalidar um tipo específico de cache
  public invalidateType(type: CacheType): void {
    const keys = this.cache.keys();
    const typeKeys = keys.filter(key => key.startsWith(`${type}:`));
    
    if (typeKeys.length > 0) {
      this.cache.del(typeKeys);
      typeKeys.forEach(key => {
        delete this.stats.lastRefreshed[key];
      });
      logger.debug({ type, count: typeKeys.length }, 'Cache type invalidated');
    }
  }

  // Limpar todo o cache
  public clear(): void {
    this.cache.flushAll();
    this.stats.lastRefreshed = {};
    logger.info('Cache cleared');
  }

  // Obter estatísticas do cache
  public getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.cache.keys().length,
      lastRefreshed: { ...this.stats.lastRefreshed }
    };
  }

  // Gerar chave de cache baseada em parâmetros
  public static generateKey(type: CacheType, params?: Record<string, any>): string {
    let key = `${type}`;
    
    if (params) {
      const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
      
      if (sortedParams.length > 0) {
        const paramsString = sortedParams
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&');
        
        key += `:${paramsString}`;
      }
    }
    
    return key;
  }
}

// Exportar instância singleton
export const serverCache = ServerCache.getInstance(); 