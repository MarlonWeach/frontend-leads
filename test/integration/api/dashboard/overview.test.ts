import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { jest } from '@jest/globals';
import { mockLogger } from '../../../setup';

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: mockLogger,
  logger: mockLogger
}));

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

// Mock da função GET
const mockGET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Simular resposta
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalLeads: 100,
          totalSales: 50,
          totalSpend: 1000
        },
        period: {
          from: dateFrom,
          to: dateTo
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};

// Mock global de Request para Next.js
// eslint-disable-next-line no-undef
if (typeof global.Request === 'undefined') {
  global.Request = class {};
}

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
    
    const request = new NextRequest('http://localhost:3000/api/dashboard/overview');
    const response = await mockGET(request);
    const data = await response.json();
    
    // Verificar se a query foi feita corretamente
    expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    expect(mockSupabase.from('ads').select).toHaveBeenCalled();
    expect(mockSupabase.from('ads').select().eq).toHaveBeenCalledWith('status', 'ACTIVE');
    
    // Verificar se o response contém os dados vazios esperados
    expect(response.status).toBe(200);
    expect(data.metrics.leads.total).toBe(0);
    expect(data.metrics.performance.spend).toBe(0);
    expect(data.alerts.length).toBeGreaterThan(0);
    expect(data.alerts[0].type).toBe('warning');
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
    
    const request = new NextRequest('http://localhost:3000/api/dashboard/overview');
    const response = await mockGET(request);
    const data = await response.json();
    
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
    expect(response.status).toBe(200);
    expect(data.metrics.leads.total).toBe(5);
    expect(data.metrics.performance.spend).toBe(100.50);
    expect(data.metrics.performance.impressions).toBe(1000);
    expect(data.metrics.performance.clicks).toBe(50);
  });
  
  it('deve aplicar filtros de data corretamente', async () => {
    // Configurar mock para retornar lista de anúncios ativos
    const activeAds = [{ id: 'ad1' }];
    mockSupabase.from('ads').select().eq.mockImplementation(() => ({
      data: activeAds,
      error: null
    }));
    
    // Configurar mock para retornar dados de meta_leads
    const metaLeadsData = [
      { 
        lead_count: 3, 
        spend: '50.25', 
        impressions: '500', 
        clicks: '25',
        created_time: '2023-01-02T12:00:00Z',
        ad_id: 'ad1'
      }
    ];
    mockSupabase.from('meta_leads').select().not().in.mockImplementation(() => ({
      data: metaLeadsData,
      error: null
    }));
    
    const request = new NextRequest(
      'http://localhost:3000/api/dashboard/overview?date_from=2023-01-01&date_to=2023-01-03'
    );
    const response = await mockGET(request);
    const data = await response.json();
    
    // Verificar se os filtros de data foram aplicados corretamente
    expect(mockSupabase.from('meta_leads').select().not().in.gte).toHaveBeenCalledWith('created_time', '2023-01-01');
    expect(mockSupabase.from('meta_leads').select().not().in.lte).toHaveBeenCalledWith('created_time', '2023-01-03');
    
    // Verificar se o response contém os dados filtrados corretamente
    expect(response.status).toBe(200);
    expect(data.metrics.leads.total).toBe(3);
    expect(data.metrics.performance.spend).toBe(50.25);
    expect(data.metrics.performance.impressions).toBe(500);
    expect(data.metrics.performance.clicks).toBe(25);
  });
  
  it('deve lidar com erros do Supabase', async () => {
    // Configurar mock para retornar erro
    mockSupabase.from('ads').select().eq.mockImplementation(() => ({
      data: null,
      error: new Error('Erro de conexão com o banco de dados')
    }));
    
    const request = new NextRequest('http://localhost:3000/api/dashboard/overview');
    const response = await mockGET(request);
    const data = await response.json();
    
    // Verificar se o erro foi tratado corretamente
    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao buscar anúncios ativos');
    expect(mockLogger.error).toHaveBeenCalled();
  });
}); 