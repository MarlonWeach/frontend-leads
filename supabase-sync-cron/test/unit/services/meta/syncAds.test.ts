const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../../src/utils/logger', () => ({ logger: mockLogger }));

jest.mock('../../../../src/services/meta/ads', () => ({
  MetaAdsService: jest.fn().mockImplementation(() => ({
    getActiveAds: jest.fn()
  }))
}));

const mockUpsert = jest.fn();
// Novo mock encadeado para update().eq()
const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));

// Novo mock encadeado para select().neq()
const mockNeq = jest.fn();
const mockSelect = jest.fn(() => ({ neq: mockNeq }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: mockUpsert,
      update: mockUpdate,
      select: mockSelect
    }))
  }))
}));

describe('syncActiveMetaAds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inserir/atualizar anúncios ativos e marcar inativos corretamente', async () => {
    const { syncActiveMetaAds } = require('../../../../src/services/meta/syncAds');
    const { MetaAd } = require('../../../../src/types/meta');
    // Mock anúncios ativos vindos da Meta
    const activeAds = [
      { id: '1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-02' },
      { id: '2', name: 'Ad 2', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-01-03', updated_time: '2024-01-04' }
    ];
    // Mock MetaAdsService
    const MetaAdsService = require('../../../../src/services/meta/ads').MetaAdsService;
    MetaAdsService.mockImplementation(() => ({
      getActiveAds: jest.fn().mockResolvedValue(activeAds)
    }));
    // Mock upsert sem erro
    mockUpsert.mockResolvedValue({ error: null });
    // Mock select retorna anúncios existentes (um deles não está mais ativo)
    mockNeq.mockResolvedValueOnce({ data: [
      { id: '1', status: 'ACTIVE' },
      { id: '2', status: 'ACTIVE' },
      { id: '3', status: 'ACTIVE' } // Este deve ser marcado como INACTIVE
    ], error: null });
    // Mock update sem erro
    mockEq.mockResolvedValueOnce({ data: { status: 'INACTIVE', effective_status: 'INACTIVE' }, error: null });

    await syncActiveMetaAds({ accessToken: 'token', accountId: 'acc' });

    // Deve chamar upsert para cada anúncio ativo
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    // Deve chamar update para marcar o anúncio 3 como INACTIVE
    expect(mockEq).toHaveBeenCalledWith('id', '3');
    // Deve logar início e fim
    expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({ msg: expect.stringContaining('Iniciando') }));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.objectContaining({ msg: expect.stringContaining('Sincronização de anúncios ativos concluída') }));
  });

  it('deve logar erro se upsert falhar', async () => {
    const { syncActiveMetaAds } = require('../../../../src/services/meta/syncAds');
    const { MetaAd } = require('../../../../src/types/meta');
    const activeAds = [
      { id: '1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-02' }
    ];
    const MetaAdsService = require('../../../../src/services/meta/ads').MetaAdsService;
    MetaAdsService.mockImplementation(() => ({
      getActiveAds: jest.fn().mockResolvedValue(activeAds)
    }));
    mockUpsert.mockResolvedValue({ error: 'erro upsert' });
    mockNeq.mockResolvedValueOnce({ data: [], error: null });

    await syncActiveMetaAds({ accessToken: 'token', accountId: 'acc' });
    expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Erro ao upsert anúncio', adId: '1', error: 'erro upsert' }));
  });

  it('deve logar erro se select falhar', async () => {
    const { syncActiveMetaAds } = require('../../../../src/services/meta/syncAds');
    const { MetaAd } = require('../../../../src/types/meta');
    const activeAds = [
      { id: '1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-02' }
    ];
    const MetaAdsService = require('../../../../src/services/meta/ads').MetaAdsService;
    MetaAdsService.mockImplementation(() => ({
      getActiveAds: jest.fn().mockResolvedValue(activeAds)
    }));
    mockUpsert.mockResolvedValue({ error: null });
    mockNeq.mockResolvedValueOnce({ data: null, error: 'erro select' });

    await syncActiveMetaAds({ accessToken: 'token', accountId: 'acc' });
    expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Erro ao buscar anúncios para marcar inativos', error: 'erro select' }));
  });

  it('deve logar erro se update falhar ao marcar inativo', async () => {
    const { syncActiveMetaAds } = require('../../../../src/services/meta/syncAds');
    const { MetaAd } = require('../../../../src/types/meta');
    const activeAds = [
      { id: '1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE', created_time: '2024-01-01', updated_time: '2024-01-02' }
    ];
    const MetaAdsService = require('../../../../src/services/meta/ads').MetaAdsService;
    MetaAdsService.mockImplementation(() => ({
      getActiveAds: jest.fn().mockResolvedValue(activeAds)
    }));
    mockUpsert.mockResolvedValue({ error: null });
    mockNeq.mockResolvedValueOnce({ data: [
      { id: '1', status: 'ACTIVE' },
      { id: '2', status: 'ACTIVE' } // Este deve ser marcado como INACTIVE
    ], error: null });
    mockEq.mockResolvedValueOnce({ error: 'erro update' });

    await syncActiveMetaAds({ accessToken: 'token', accountId: 'acc' });
    expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Erro ao marcar anúncio como inativo', adId: '2', error: 'erro update' }));
  });
}); 