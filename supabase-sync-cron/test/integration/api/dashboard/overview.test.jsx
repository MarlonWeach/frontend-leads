import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/dashboard/overview/route';
import { createClient } from '@supabase/supabase-js';

// Mock do cliente Supabase
jest.mock('@supabase/supabase-js', () => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockIn = jest.fn().mockReturnThis();
  const mockGte = jest.fn().mockReturnThis();
  const mockLte = jest.fn().mockReturnThis();
  const mockNot = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    not: mockNot,
    order: mockOrder,
    limit: mockLimit
  }));
  
  return {
    createClient: jest.fn(() => ({
      from: mockFrom
    }))
  };
});

// Mock do logger
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('API de Overview do Dashboard', () => {
  let mockSupabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createClient();
  });
  
  it('deve retornar dados vazios quando não há anúncios ativos', async () => {
    // Configurar mock para retornar lista vazia de anúncios ativos
    mockSupabase.from('ads').select().eq.mockImplementation(() => ({
      data: [],
      error: null
    }));
    
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/dashboard/overview'
    });
    
    await GET(req);
    
    // Verificar se a query foi feita corretamente
    expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    expect(mockSupabase.from('ads').select).toHaveBeenCalled();
    expect(mockSupabase.from('ads').select().eq).toHaveBeenCalledWith('status', 'ACTIVE');
    
    // Verificar se o response contém os dados vazios esperados
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.metrics.leads.total).toBe(0);
    expect(responseData.metrics.performance.spend).toBe(0);
    expect(responseData.alerts.length).toBeGreaterThan(0);
    expect(responseData.alerts[0].type).toBe('warning');
  });
  
  it('deve filtrar meta_leads por anúncios ativos', async () => {
    // Configurar mock para retornar lista de anúncios ativos
    const activeAds = [{ id: 'ad1' }, { id: 'ad2' }];
    mockSupabase.from('ads').select().eq.mockImplementation(() => ({
      data: activeAds,
      error: null
    }));
    
    // Configurar mock para retornar dados de meta_leads
    const metaLeadsData = [
      { 
        lead_count: 5, 
        spend: '100.50', 
        impressions: '1000', 
        clicks: '50',
        created_time: '2023-01-01T12:00:00Z',
        ad_id: 'ad1'
      }
    ];
    mockSupabase.from('meta_leads').select().not().in.mockImplementation(() => ({
      data: metaLeadsData,
      error: null
    }));
    
    // Configurar mocks para as outras queries
    mockSupabase.from('meta_leads').select().gte.mockImplementation(() => ({
      data: metaLeadsData,
      error: null
    }));
    
    mockSupabase.from('campaigns').select().mockImplementation(() => ({
      count: 5,
      error: null
    }));
    
    mockSupabase.from('campaigns').select().eq.mockImplementation(() => ({
      count: 3,
      error: null
    }));
    
    mockSupabase.from('advertisers').select().mockImplementation(() => ({
      count: 10,
      error: null
    }));
    
    mockSupabase.from('advertisers').select().eq.mockImplementation(() => ({
      count: 8,
      error: null
    }));
    
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/dashboard/overview'
    });
    
    await GET(req);
    
    // Verificar se a query de anúncios ativos foi feita corretamente
    expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    expect(mockSupabase.from('ads').select).toHaveBeenCalled();
    expect(mockSupabase.from('ads').select().eq).toHaveBeenCalledWith('status', 'ACTIVE');
    
    // Verificar se a query de meta_leads filtrou pelos IDs de anúncios ativos
    expect(mockSupabase.from).toHaveBeenCalledWith('meta_leads');
    expect(mockSupabase.from('meta_leads').select).toHaveBeenCalled();
    expect(mockSupabase.from('meta_leads').select().not).toHaveBeenCalledWith('ad_id', 'is', null);
    expect(mockSupabase.from('meta_leads').select().not().in).toHaveBeenCalledWith('ad_id', ['ad1', 'ad2']);
    
    // Verificar se o response contém os dados processados corretamente
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.metrics.leads.total).toBe(5);
    expect(responseData.metrics.performance.spend).toBe(100.50);
    expect(responseData.metrics.performance.impressions).toBe(1000);
    expect(responseData.metrics.performance.clicks).toBe(50);
  });
  
  it('deve aplicar filtros de data corretamente', async () => {
    // Configurar mock para retornar lista de anúncios ativos
    const activeAds = [{ id: 'ad1' }];
    mockSupabase.from('ads').select().eq.mockImplementation(() => ({
      data: activeAds,
      error: null
    }));
    
    // Configurar mock para retornar dados de meta_leads
    mockSupabase.from('meta_leads').select().not().in.mockImplementation(() => ({
      data: [],
      error: null
    }));
    
    mockSupabase.from('meta_leads').select().not().in.gte.mockImplementation(() => ({
      data: [],
      error: null
    }));
    
    mockSupabase.from('meta_leads').select().not().in.gte.lte.mockImplementation(() => ({
      data: [],
      error: null
    }));
    
    // Configurar mocks para as outras queries
    mockSupabase.from('campaigns').select().mockImplementation(() => ({
      count: 0,
      error: null
    }));
    
    mockSupabase.from('campaigns').select().eq.mockImplementation(() => ({
      count: 0,
      error: null
    }));
    
    mockSupabase.from('advertisers').select().mockImplementation(() => ({
      count: 0,
      error: null
    }));
    
    mockSupabase.from('advertisers').select().eq.mockImplementation(() => ({
      count: 0,
      error: null
    }));
    
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/dashboard/overview?date_from=2023-01-01&date_to=2023-01-31'
    });
    
    await GET(req);
    
    // Verificar se os filtros de data foram aplicados corretamente
    expect(mockSupabase.from('meta_leads').select().not().in.gte).toHaveBeenCalledWith('created_time', '2023-01-01');
    expect(mockSupabase.from('meta_leads').select().not().in.gte.lte).toHaveBeenCalledWith('created_time', '2023-01-31');
  });
  
  it('deve lidar com erros corretamente', async () => {
    // Configurar mock para lançar um erro
    mockSupabase.from('ads').select().eq.mockImplementation(() => {
      throw new Error('Erro de teste');
    });
    
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/dashboard/overview'
    });
    
    await GET(req);
    
    // Verificar se o erro foi tratado corretamente
    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('Erro ao buscar dados do overview');
    expect(responseData.details).toBe('Erro de teste');
  });
}); 