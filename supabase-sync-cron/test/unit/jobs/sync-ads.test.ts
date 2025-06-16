import { syncAdsStatus } from '@/jobs/sync-ads';
import { MetaAdsService } from '@/services/meta/ads';
import { MetaAd } from '@/types/meta';
import { DEFAULT_SYNC_OPTIONS } from '@/types/sync';

// Mock do logger antes de qualquer importação
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('@/utils/logger', () => mockLogger);

jest.mock('@/services/meta/ads');

// Mock da cadeia do Supabase
function createSupabaseMock({ notError = null } = {}) {
  return {
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn(() => ({
        not: jest.fn().mockImplementation(() => {
          if (notError) return Promise.resolve({ data: null, error: notError });
          return Promise.resolve({ data: null, error: null });
        })
      })),
    })),
  };
}

let mockSupabase = createSupabaseMock();

// Mock de delay (exceto para timeout)
const originalSetTimeout = global.setTimeout;
jest.spyOn(global, 'setTimeout').mockImplementation((fn, ms) => {
  if (ms > 10) return originalSetTimeout(fn, ms); // Permite timeout real para teste de timeout
  fn();
  return 0 as any;
});

describe('syncAdsStatus', () => {
  const mockAds: MetaAd[] = [
    { id: '1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-03-19T12:00:00Z', updated_time: '2024-03-19T12:00:00Z' },
    { id: '2', name: 'Ad 2', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-03-19T12:00:00Z', updated_time: '2024-03-19T12:00:00Z' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createSupabaseMock();
    (MetaAdsService.prototype.getActiveAds as jest.Mock).mockResolvedValue(mockAds);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve sincronizar status dos anúncios com sucesso', async () => {
    const result = await syncAdsStatus({}, mockSupabase as any);
    expect(result.status.success).toBe(true);
    expect(result.status.totalAds).toBe(2);
    expect(result.status.activeAds).toBe(2);
    expect(result.ads).toEqual(mockAds);
    expect(mockSupabase.from).toHaveBeenCalledWith('ads');
  });

  it('deve lidar com erro na Meta API', async () => {
    const apiError = {
      code: 'API_ERROR',
      message: 'API Error',
      retryable: true,
    };
    
    (MetaAdsService.prototype.getActiveAds as jest.Mock).mockRejectedValue(apiError);
    
    const result = await syncAdsStatus({ retryCount: 1 }, mockSupabase as any);
    
    expect(result.status.success).toBe(false);
    expect(result.status.error).toBeTruthy();
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.anything(),
        retryCount: 1
      }),
      'Erro na sincronização de status dos anúncios'
    );
  }, 10000);

  it('deve lidar com erro no Supabase', async () => {
    const dbError = new Error('Database Error');
    mockSupabase = createSupabaseMock({ notError: dbError });
    const result = await syncAdsStatus({ retryCount: 1 }, mockSupabase as any);
    expect(result.status.success).toBe(false);
    expect(result.status.error).toBe('Database Error');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('deve tentar novamente em caso de erro retryable', async () => {
    const apiError = { code: 'API_ERROR', retryable: true, message: 'Temporary Error' };
    (MetaAdsService.prototype.getActiveAds as jest.Mock)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(mockAds);
    
    const resultPromise = syncAdsStatus({ retryCount: 2 }, mockSupabase as any);
    await jest.runAllTimersAsync();
    const result = await resultPromise;
    
    expect(result.status.success).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  describe('timeout', () => {
    it('deve respeitar o timeout configurado e logar corretamente', async () => {
      const timeoutMs = 1000;
      const mockActiveAds = [{ id: '1', status: 'ACTIVE' }];
      
      // Simula uma operação que demora mais que o timeout
      (MetaAdsService.prototype.getActiveAds as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockActiveAds), timeoutMs + 100))
      );

      const resultPromise = syncAdsStatus(
        { ...DEFAULT_SYNC_OPTIONS, timeoutMs },
        mockSupabase as any
      );

      // Avança o tempo para o timeout
      await jest.advanceTimersByTimeAsync(timeoutMs);
      const result = await resultPromise;

      // Verifica o resultado
      expect(result.status.success).toBe(false);
      expect(result.status.error).toBe('Timeout');
      
      // Verifica se o logger.error foi chamado pelo menos duas vezes
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
      
      // Verificamos apenas que o logger.error foi chamado com os textos corretos
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.anything(),
        'Timeout ao executar operação'
      );
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.anything(),
        'Timeout na sincronização'
      );
    });

    it('deve completar com sucesso se a operação terminar antes do timeout', async () => {
      const timeoutMs = 1000;
      const mockActiveAds = [{ id: '1', status: 'ACTIVE' }];
      
      // Simula uma operação que termina antes do timeout
      (MetaAdsService.prototype.getActiveAds as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockActiveAds), timeoutMs - 100))
      );

      const resultPromise = syncAdsStatus(
        { ...DEFAULT_SYNC_OPTIONS, timeoutMs },
        mockSupabase as any
      );

      // Avança o tempo para antes do timeout
      await jest.advanceTimersByTimeAsync(timeoutMs - 100);
      const result = await resultPromise;

      expect(result.status.success).toBe(true);
      expect(result.status.totalAds).toBe(1);
      expect(result.status.activeAds).toBe(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
}); 