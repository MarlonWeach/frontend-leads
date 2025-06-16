import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { syncAdsStatus } from '@/jobs/sync-ads';
import { MetaAdsService } from '@/services/meta/ads';
import type { SyncOptions } from '@/types/sync';
import { logger as mockLogger } from '@/utils/logger';

// Mock do logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock do MetaAdsService
const mockGetActiveAds = jest.fn();
jest.mock('@/services/meta/ads', () => ({
  MetaAdsService: jest.fn().mockImplementation(() => ({
    getActiveAds: mockGetActiveAds
  }))
}));

// Mock do Supabase com cadeia completa e sempre retornando { data, error }
function createMockSupabaseClient(shouldSucceed = true) {
  const result = {
    data: shouldSucceed ? [] : null,
    error: shouldSucceed ? null : { message: 'DB Error', code: 'ERROR' }
  };
  return {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(result))
      })),
      update: jest.fn(() => ({
        not: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve(result))
        }))
      }))
    }))
  };
}

const DEFAULT_SYNC_OPTIONS: Partial<SyncOptions> = {
  retryCount: 3,
  timeoutMs: 30000
};

describe('syncAdsStatus', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient(true);
    mockGetActiveAds.mockResolvedValue([]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve sincronizar anúncios ativos com sucesso', async () => {
    const mockAds = [
      {
        id: 'ad1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        created_time: '2024-03-19T12:00:00Z',
        updated_time: '2024-03-19T12:00:00Z'
      }
    ];
    mockGetActiveAds.mockResolvedValueOnce(mockAds);
    const result = await syncAdsStatus(DEFAULT_SYNC_OPTIONS, mockSupabase);
    expect(result.status.success).toBe(true);
    expect(result.status.totalAds).toBe(1);
    expect(result.status.activeAds).toBe(1);
    expect(result.ads).toEqual(mockAds);
    expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
      'Anúncios ativos obtidos da Meta API'
    );
  });

  it('deve lidar com erro na Meta API', async () => {
    const apiError = {
      code: 'API_ERROR',
      message: 'API Error',
      retryable: true
    };
    mockGetActiveAds.mockRejectedValueOnce(apiError);
    const result = await syncAdsStatus({ retryCount: 1 }, mockSupabase);
    expect(result.status.success).toBe(false);
    expect(result.status.error).toBeTruthy();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.anything(),
        retryCount: 1
      }),
      'Erro na sincronização de status dos anúncios'
    );
  });

  it('deve lidar com erro no Supabase', async () => {
    mockSupabase = createMockSupabaseClient(false);
    const mockAds = [
      {
        id: 'ad1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE'
      }
    ];
    mockGetActiveAds.mockResolvedValueOnce(mockAds);
    const result = await syncAdsStatus(DEFAULT_SYNC_OPTIONS, mockSupabase);
    expect(result.status.success).toBe(false);
    expect(result.status.error).toBeTruthy();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('deve respeitar a opção dryRun', async () => {
    const mockAds = [
      {
        id: 'ad1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE'
      }
    ];
    mockGetActiveAds.mockResolvedValueOnce(mockAds);
    const result = await syncAdsStatus({ ...DEFAULT_SYNC_OPTIONS, dryRun: true }, mockSupabase);
    expect(result.status.success).toBe(true);
    expect(result.status.totalAds).toBe(1);
    expect(result.status.activeAds).toBe(1);
    expect(result.ads).toEqual(mockAds);
    expect(mockLogger.info).toHaveBeenCalledWith('Modo dryRun ativado - nenhuma alteração será feita no banco');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('deve processar lista vazia de anúncios', async () => {
    mockGetActiveAds.mockResolvedValueOnce([]);
    const result = await syncAdsStatus(DEFAULT_SYNC_OPTIONS, mockSupabase);
    expect(result.status.success).toBe(true);
    expect(result.status.totalAds).toBe(0);
    expect(result.status.activeAds).toBe(0);
    expect(result.ads).toEqual([]);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ count: 0 }),
      'Anúncios ativos obtidos da Meta API'
    );
  });

  it('deve tentar novamente em caso de erro retryable', async () => {
    const apiError = { code: 'API_ERROR', retryable: true, message: 'Temporary Error' };
    const mockAds = [
      {
        id: 'ad1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE'
      }
    ];
    mockGetActiveAds
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(mockAds);
    const resultPromise = syncAdsStatus({ retryCount: 2 }, mockSupabase);
    await jest.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.status.success).toBe(true);
    expect(result.status.totalAds).toBe(1);
    expect(result.status.activeAds).toBe(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.anything(),
        retryCount: 1,
        nextRetryIn: expect.any(Number)
      }),
      'Tentativa de sincronização falhou, aguardando próxima tentativa'
    );
  });

  describe('timeout', () => {
    it('deve respeitar o timeout configurado', async () => {
      const timeoutMs = 1000;
      const mockAds = [{ id: '1', status: 'ACTIVE' }];
      mockGetActiveAds.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockAds), timeoutMs + 100))
      );
      const resultPromise = syncAdsStatus(
        { ...DEFAULT_SYNC_OPTIONS, timeoutMs },
        mockSupabase
      );
      await jest.advanceTimersByTimeAsync(timeoutMs);
      const result = await resultPromise;
      expect(result.status.success).toBe(false);
      expect(result.status.error).toBe('Timeout');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs }),
        'Timeout ao executar operação'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() }),
        'Timeout na sincronização'
      );
    });

    it('deve completar com sucesso se a operação terminar antes do timeout', async () => {
      const timeoutMs = 1000;
      const mockAds = [{ id: '1', status: 'ACTIVE' }];
      mockGetActiveAds.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockAds), timeoutMs - 100))
      );
      const resultPromise = syncAdsStatus(
        { ...DEFAULT_SYNC_OPTIONS, timeoutMs },
        mockSupabase
      );
      await jest.advanceTimersByTimeAsync(timeoutMs - 100);
      const result = await resultPromise;
      expect(result.status.success).toBe(true);
      expect(result.status.totalAds).toBe(1);
      expect(result.status.activeAds).toBe(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});



 