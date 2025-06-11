import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvertisersDashboard from '../AdvertisersDashboard';
import { supabase } from '../../lib/supabaseClient';

// Mock do cliente Supabase
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn((column, options) => {
          if (column === 'created_at') {
            return Promise.resolve({ data: mockAdvertisersData, error: null });
          }
          return Promise.resolve({ data: [], error: null });
        }),
        eq: jest.fn((key, value) => {
          if (key === 'advertiser_id') {
            if (value === 'adv1') {
              return {
                select: jest.fn((fields, options) => {
                  if (options?.count === 'exact') {
                    if (key === 'advertiser_id' && value === 'adv1' && fields === '*') {
                      return Promise.resolve({ count: 2, error: null }); // Mock leads count for adv1
                    }
                    return Promise.resolve({ count: 1, error: null }); // Mock campaigns count for adv1
                  } else if (fields === 'spend') {
                    return Promise.resolve({ data: [{ spend: 100 }, { spend: 50 }], error: null });
                  } else if (fields === 'id, name, status, spend, impressions, clicks') {
                    return Promise.resolve({ data: mockCampaignsData, error: null });
                  } else if (fields === 'id, full_name, email, status, created_time, campaign_id') {
                    return Promise.resolve({ data: mockRecentLeadsData, error: null });
                  }
                  return Promise.resolve({ data: [], error: null });
                }),
                eq: jest.fn((eqKey, eqValue) => {
                  if (eqKey === 'status' && eqValue === 'ACTIVE') {
                    return { select: jest.fn(() => Promise.resolve({ count: 1, error: null })) }; // active campaigns
                  }
                  if (eqKey === 'status' && eqValue === 'converted') {
                    return { select: jest.fn(() => Promise.resolve({ count: 1, error: null })) }; // converted leads
                  }
                  if (eqKey === 'campaign_id') {
                    if (eqValue === 'camp1') {
                      return { select: jest.fn(() => Promise.resolve({ count: 5, error: null })) };
                    }
                    if (eqValue === 'camp2') {
                      return { select: jest.fn(() => Promise.resolve({ count: 3, error: null })) };
                    }
                    return { select: jest.fn(() => Promise.resolve({ count: 0, error: null })) };
                  }
                  return { select: jest.fn(() => Promise.resolve({ count: 0, error: null })) };
                }),
                single: jest.fn(() => Promise.resolve({ data: mockAdvertisersData[0], error: null }))
              };
            }
          }
          return Promise.resolve({ data: [], error: null });
        }),
        single: jest.fn(() => Promise.resolve({ data: mockAdvertisersData[0], error: null }))
      })),
    })),
  },
}));

const mockAdvertisersData = [
  {
    id: 'adv1',
    name: 'Anunciante Teste 1',
    email: 'adv1@test.com',
    phone: '1111111111',
    website: 'www.test1.com',
    created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 'adv2',
    name: 'Anunciante Teste 2',
    email: 'adv2@test.com',
    phone: '2222222222',
    website: 'www.test2.com',
    created_at: '2024-03-19T10:00:00Z',
  },
];

const mockCampaignsData = [
  {
    id: 'camp1',
    name: 'Campanha A',
    status: 'ACTIVE',
    spend: 100,
    impressions: 1000,
    clicks: 100,
  },
  {
    id: 'camp2',
    name: 'Campanha B',
    status: 'PAUSED',
    spend: 50,
    impressions: 500,
    clicks: 50,
  },
];

const mockRecentLeadsData = [
  {
    id: 'lead1',
    full_name: 'Lead Teste 1',
    email: 'lead1@test.com',
    status: 'new',
    created_time: '2024-03-20T10:30:00Z',
    campaign_id: 'camp1',
  },
  {
    id: 'lead2',
    full_name: 'Lead Teste 2',
    email: 'lead2@test.com',
    status: 'contacted',
    created_time: '2024-03-19T11:00:00Z',
    campaign_id: 'camp2',
  },
];

describe('AdvertisersDashboard', () => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress console errors
    console.warn = jest.fn(); // Suppress console warnings

    // Reset default mock implementations for supabase
    supabase.from.mockImplementation(() => ({
      select: jest.fn((fields, options) => {
        if (options?.count === 'exact') {
          if (fields === '*') return Promise.resolve({ count: 2, error: null }); // Total advertisers
          if (fields === 'id, name, status, spend, impressions, clicks') return Promise.resolve({ count: 2, error: null }); // Total campaigns
          if (fields === 'id, full_name, email, status, created_time, campaign_id') return Promise.resolve({ count: 2, error: null }); // Total leads
        }
        if (fields === '*') return Promise.resolve({ data: mockAdvertisersData, error: null });
        if (fields === 'spend') return Promise.resolve({ data: [{ spend: 100 }, { spend: 50 }], error: null });
        if (fields === 'id, name, status, spend, impressions, clicks') return Promise.resolve({ data: mockCampaignsData, error: null });
        if (fields === 'id, full_name, email, status, created_time, campaign_id') return Promise.resolve({ data: mockRecentLeadsData, error: null });
        return Promise.resolve({ data: [], error: null });
      }),
      order: jest.fn(() => ({ data: mockAdvertisersData, error: null })),
      eq: jest.fn((key, value) => {
        if (key === 'advertiser_id' && value === 'adv1') {
          return {
            select: jest.fn((fields, options) => {
              if (options?.count === 'exact') {
                if (fields === '*') return Promise.resolve({ count: 2, error: null }); // Mock campaigns/leads count for specific adv
              }
              if (fields === 'spend') return Promise.resolve({ data: [{ spend: 100 }, { spend: 50 }], error: null });
              if (fields === 'id, name, status, spend, impressions, clicks') return Promise.resolve({ data: mockCampaignsData, error: null });
              if (fields === 'id, full_name, email, status, created_time, campaign_id') return Promise.resolve({ data: mockRecentLeadsData, error: null });
              return Promise.resolve({ data: [], error: null });
            }),
            eq: jest.fn((eqKey, eqValue) => {
              if (eqKey === 'status' && eqValue === 'ACTIVE') return { select: jest.fn(() => Promise.resolve({ count: 1, error: null })) };
              if (eqKey === 'status' && eqValue === 'converted') return { select: jest.fn(() => Promise.resolve({ count: 1, error: null })) };
              if (eqKey === 'campaign_id') {
                if (eqValue === 'camp1') return { select: jest.fn(() => Promise.resolve({ count: 5, error: null })) };
                if (eqValue === 'camp2') return { select: jest.fn(() => Promise.resolve({ count: 3, error: null })) };
              }
              return { select: jest.fn(() => Promise.resolve({ count: 0, error: null })) };
            }),
            single: jest.fn(() => Promise.resolve({ data: mockAdvertisersData[0], error: null }))
          };
        }
        if (key === 'id' && value === 'adv1') return { single: jest.fn(() => Promise.resolve({ data: mockAdvertisersData[0], error: null })) };
        return { select: jest.fn(() => Promise.resolve({ data: [], error: null })) };
      }),
    }));
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  it('deve renderizar o estado de carregamento inicial', () => {
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn(() => new Promise(() => {})), // Never resolve to keep loading
    }));
    render(<AdvertisersDashboard />);
    expect(screen.getByText('Carregando anunciantes...')).toBeInTheDocument();
  });

  it('deve renderizar as métricas gerais e a lista de anunciantes', async () => {
    render(<AdvertisersDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total de Anunciantes')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Anunciante Teste 1')).toBeInTheDocument();
      expect(screen.getByText('Anunciante Teste 2')).toBeInTheDocument();
    });
  });

  it('deve mostrar estado de erro e permitir retry', async () => {
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn(() => Promise.resolve({ data: null, error: new Error('Erro na API Supabase') })),
    }));

    render(<AdvertisersDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Erro: Erro na API Supabase/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Tentar Novamente/i });
    fireEvent.click(retryButton);

    // Verifica se a função de fetch foi chamada novamente
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });

  it('deve exibir a visão detalhada de um anunciante ao clicar no card', async () => {
    render(<AdvertisersDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Anunciante Teste 1')).toBeInTheDocument();
    });

    const advertiserCard = screen.getByText('Anunciante Teste 1');
    fireEvent.click(advertiserCard);

    await waitFor(() => {
      expect(screen.getByText('Detalhes do Anunciante')).toBeInTheDocument();
      expect(screen.getByText('Anunciante Teste 1')).toBeInTheDocument();
      expect(screen.getByText('adv1@test.com')).toBeInTheDocument();
      expect(screen.getByText('www.test1.com')).toBeInTheDocument();
      expect(screen.getByText('Campanhas do Anunciante')).toBeInTheDocument();
      expect(screen.getByText('Campanha A')).toBeInTheDocument();
      expect(screen.getByText('Leads Recentes')).toBeInTheDocument();
      expect(screen.getByText('Lead Teste 1')).toBeInTheDocument();
    });
  });

  it('deve voltar para a visão geral ao clicar no botão de voltar', async () => {
    render(<AdvertisersDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Anunciante Teste 1')).toBeInTheDocument();
    });

    const advertiserCard = screen.getByText('Anunciante Teste 1');
    fireEvent.click(advertiserCard);

    await waitFor(() => {
      expect(screen.getByText('Detalhes do Anunciante')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /voltar para a visão geral/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.queryByText('Detalhes do Anunciante')).not.toBeInTheDocument();
      expect(screen.getByText('Total de Anunciantes')).toBeInTheDocument();
    });
  });

  it('deve filtrar por período de data', async () => {
    // Re-renderizar o componente para garantir que o useEffect seja chamado com a nova prop
    render(<AdvertisersDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total de Anunciantes')).toBeInTheDocument();
    });

    const dateRangeFilter = screen.getByRole('combobox', { name: /período/i });
    fireEvent.change(dateRangeFilter, { target: { value: '7d' } });

    // Assegura que o useEffect seja re-executado
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('advertisers'); // Verifica se a busca principal foi chamada novamente
    });

    // Poderíamos adicionar mais asserções aqui para verificar como os dados mudaram com base no filtro
  });
}); 