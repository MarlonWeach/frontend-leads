// Mock do logger (inline no jest.mock)
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

import { ServerCache, CacheType } from '@/utils/server-cache';
import { logger as mockLogger } from '@/utils/logger';

describe('ServerCache', () => {
  let cache: ServerCache;

  beforeEach(() => {
    // Limpar todas as instâncias e mocks
    jest.clearAllMocks();
    
    // Reset da instância singleton para cada teste
    (ServerCache as any).instance = undefined;
    
    // Obter uma nova instância do cache para cada teste
    cache = ServerCache.getInstance();
    cache.clear();
  });

  describe('Operações básicas', () => {
    it('deve armazenar e recuperar valores', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };

      cache.set(key, value);
      const result = cache.get(key);

      expect(result).toEqual(value);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { key },
        'Cache entry set'
      );
    });

    it('deve retornar undefined para chaves não existentes', () => {
      const key = 'non-existent-key';

      const result = cache.get(key);

      expect(result).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { key },
        'Cache miss'
      );
    });

    it('deve limpar o cache corretamente', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };

      cache.set(key, value);
      cache.clear();

      const result = cache.get(key);
      expect(result).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Cache cleared');
    });
  });

  describe('Expiração do cache', () => {
    it('deve expirar valores após o tempo definido', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };
      const ttl = 1000; // 1 segundo

      cache.set(key, value, ttl);
      // Verificar que o valor está disponível antes da expiração
      expect(cache.get(key)).toEqual(value);

      // Simular expiração manualmente
      cache['cache'].del(key);
      cache['cache'].emit('expired', key, value);

      // Verificar que o valor expirou
      expect(cache.get(key)).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { key },
        'Cache entry expired'
      );
    });

    it('deve usar o TTL padrão quando não especificado', () => {
      jest.useFakeTimers();

      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };

      cache.set(key, value);
      
      // Verificar que o valor está disponível antes da expiração
      expect(cache.get(key)).toEqual(value);

      // Avançar o tempo além do TTL padrão (5 minutos)
      jest.advanceTimersByTime(5 * 60 * 1000 + 100);

      // Verificar que o valor expirou
      expect(cache.get(key)).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('Singleton', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = ServerCache.getInstance();
      const instance2 = ServerCache.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('deve manter o mesmo estado entre instâncias', () => {
      const instance1 = ServerCache.getInstance();
      const instance2 = ServerCache.getInstance();

      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };

      instance1.set(key, value);
      expect(instance2.get(key)).toEqual(value);
    });
  });

  describe('getOrSet', () => {
    it('deve buscar e armazenar valor quando não existe no cache', async () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };
      const fetchFn = jest.fn().mockResolvedValue(value);

      const result = await cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW);

      expect(result).toEqual(value);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(cache.get(key)).toEqual(value);
    });

    it('deve retornar valor do cache quando disponível', async () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };
      const fetchFn = jest.fn();

      cache.set(key, value);
      const result = await cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW);

      expect(result).toEqual(value);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('deve propagar erro quando fetchFn falha', async () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const error = new Error('Test error');
      const fetchFn = jest.fn().mockRejectedValue(error);

      await expect(cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW))
        .rejects.toThrow('Test error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          key,
          type: CacheType.DASHBOARD_OVERVIEW
        }),
        'Error fetching data for cache'
      );
    });
  });

  describe('Invalidação', () => {
    it('deve invalidar uma entrada específica', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const value = { data: 'test-data' };

      cache.set(key, value);
      const result = cache.invalidate(key);

      expect(result).toBe(true);
      expect(cache.get(key)).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { key },
        'Cache entry invalidated'
      );
    });

    it('deve invalidar um tipo específico de cache', () => {
      const key1 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, { param1: 'value1' });
      const key2 = ServerCache.generateKey(CacheType.DASHBOARD_ACTIVITY, { param2: 'value2' });
      const value = { data: 'test-data' };

      cache.set(key1, value);
      cache.set(key2, value);

      cache.invalidateType(CacheType.DASHBOARD_OVERVIEW);

      expect(cache.get(key1)).toBeUndefined();
      expect(cache.get(key2)).toEqual(value);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { type: CacheType.DASHBOARD_OVERVIEW, count: 1 },
        'Cache type invalidated'
      );
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas corretas', () => {
      const key1 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      const key2 = ServerCache.generateKey(CacheType.DASHBOARD_ACTIVITY);
      const value = { data: 'test-data' };

      // Simular hits e misses
      cache.set(key1, value);
      cache.get(key1); // hit
      cache.get(key2); // miss
      cache.get('non-existent'); // miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.keys).toBe(1);
      expect(stats.lastRefreshed).toHaveProperty(key1);
      expect(stats.lastRefreshed).not.toHaveProperty(key2);
    });
  });

  describe('generateKey', () => {
    it('deve gerar chave correta para tipo sem parâmetros', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW);
      expect(key).toBe(CacheType.DASHBOARD_OVERVIEW);
    });

    it('deve gerar chave correta com parâmetros', () => {
      const params = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'active'
      };
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, params);
      expect(key).toBe('dashboard_overview:endDate=2024-01-31&startDate=2024-01-01&status=active');
    });

    it('deve ignorar parâmetros undefined ou null', () => {
      const params = {
        startDate: '2024-01-01',
        endDate: undefined,
        status: null
      };
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, params);
      expect(key).toBe('dashboard_overview:startDate=2024-01-01');
    });
  });
}); 