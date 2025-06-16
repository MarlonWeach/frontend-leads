// Mock do logger antes de qualquer importação
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/utils/logger', () => mockLogger);

import { ServerCache, CacheType } from '@/utils/server-cache';

describe('ServerCache', () => {
  let cache: ServerCache;

  beforeEach(() => {
    // Limpar todas as instâncias e mocks
    jest.clearAllMocks();
    
    // Obter uma nova instância do cache para cada teste
    cache = ServerCache.getInstance();
    cache.clear();
  });

  describe('Operações básicas', () => {
    it('deve armazenar e recuperar valores', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cache.set(key, value);
      const retrieved = cache.get(key);
      
      expect(retrieved).toEqual(value);
    });
    
    it('deve retornar undefined para chaves inexistentes', () => {
      const retrieved = cache.get('non-existent-key');
      expect(retrieved).toBeUndefined();
    });
    
    it('deve invalidar uma chave específica', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cache.set(key, value);
      expect(cache.get(key)).toEqual(value);
      
      cache.invalidate(key);
      expect(cache.get(key)).toBeUndefined();
    });
    
    it('deve limpar todo o cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });
  
  describe('Método getOrSet', () => {
    it('deve retornar valor em cache quando disponível', async () => {
      const key = 'test-key';
      const value = { data: 'cached-value' };
      
      cache.set(key, value);
      
      const fetchFn = jest.fn().mockResolvedValue({ data: 'new-value' });
      const result = await cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW);
      
      expect(result).toEqual(value);
      expect(fetchFn).not.toHaveBeenCalled();
    });
    
    it('deve chamar fetchFn quando valor não está em cache', async () => {
      const key = 'test-key';
      const value = { data: 'new-value' };
      
      const fetchFn = jest.fn().mockResolvedValue(value);
      const result = await cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW);
      
      expect(result).toEqual(value);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
    
    it('deve propagar erros do fetchFn', async () => {
      const key = 'test-key';
      const error = new Error('Fetch error');
      
      const fetchFn = jest.fn().mockRejectedValue(error);
      
      await expect(cache.getOrSet(key, fetchFn, CacheType.DASHBOARD_OVERVIEW))
        .rejects.toThrow('Fetch error');
    });
  });
  
  describe('Invalidação por tipo', () => {
    it('deve invalidar todas as chaves de um tipo específico', () => {
      const key1 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, { param: 'value1' });
      const key2 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, { param: 'value2' });
      const key3 = ServerCache.generateKey(CacheType.DASHBOARD_ACTIVITY);
      
      cache.set(key1, 'value1');
      cache.set(key2, 'value2');
      cache.set(key3, 'value3');
      
      cache.invalidateType(CacheType.DASHBOARD_OVERVIEW);
      
      expect(cache.get(key1)).toBeUndefined();
      expect(cache.get(key2)).toBeUndefined();
      expect(cache.get(key3)).toBe('value3');
    });
  });
  
  describe('Geração de chaves', () => {
    it('deve gerar chaves corretas com parâmetros', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, {
        dateFrom: '2023-01-01',
        dateTo: '2023-01-31'
      });
      
      expect(key).toBe('dashboard_overview:dateFrom=2023-01-01&dateTo=2023-01-31');
    });
    
    it('deve gerar chaves corretas sem parâmetros', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_ACTIVITY);
      expect(key).toBe('dashboard_activity');
    });
    
    it('deve ignorar parâmetros nulos ou indefinidos', () => {
      const key = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, {
        dateFrom: '2023-01-01',
        dateTo: null,
        filter: undefined
      });
      
      expect(key).toBe('dashboard_overview:dateFrom=2023-01-01');
    });
    
    it('deve ordenar os parâmetros alfabeticamente', () => {
      const key1 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, {
        dateTo: '2023-01-31',
        dateFrom: '2023-01-01'
      });
      
      const key2 = ServerCache.generateKey(CacheType.DASHBOARD_OVERVIEW, {
        dateFrom: '2023-01-01',
        dateTo: '2023-01-31'
      });
      
      expect(key1).toBe(key2);
    });
  });
  
  describe('Estatísticas', () => {
    it('deve rastrear hits e misses', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });
    
    it('deve rastrear a última atualização', () => {
      const key = 'test-key';
      cache.set(key, 'value');
      
      const stats = cache.getStats();
      expect(stats.lastRefreshed[key]).toBeInstanceOf(Date);
    });
  });
}); 