import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '../useDashboardData';

// Mock da função de fetch de dados
jest.mock('../../services/api', () => ({
  fetchDashboardData: jest.fn(() => Promise.resolve({
    metrics: {
      campaigns: { total: 10, active: 5 },
      leads: { total: 100, new: 20, converted: 30, conversion_rate: 30 },
      advertisers: { total: 8, active: 6 },
      performance: { spend: 5000, impressions: 10000, clicks: 500, ctr: 5 }
    },
    recentActivity: [
      {
        id: 1,
        full_name: 'João Silva',
        email: 'joao@email.com',
        status: 'new',
        created_time: '2024-03-21T10:00:00Z'
      }
    ],
    alerts: [
      {
        type: 'warning',
        title: 'Teste de Alerta',
        message: 'Mensagem de teste',
        action: 'Ver detalhes',
        href: '/test'
      }
    ]
  })),
}));

describe('useDashboardData', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Desabilitar retries para testes
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('deve retornar os dados do dashboard e estado de carregamento correto', async () => {
    const { result } = renderHook(() => useDashboardData(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({
      metrics: {
        campaigns: { total: 10, active: 5 },
        leads: { total: 100, new: 20, converted: 30, conversion_rate: 30 },
        advertisers: { total: 8, active: 6 },
        performance: { spend: 5000, impressions: 10000, clicks: 500, ctr: 5 }
      },
      recentActivity: [
        {
          id: 1,
          full_name: 'João Silva',
          email: 'joao@email.com',
          status: 'new',
          created_time: '2024-03-21T10:00:00Z'
        }
      ],
      alerts: [
        {
          type: 'warning',
          title: 'Teste de Alerta',
          message: 'Mensagem de teste',
          action: 'Ver detalhes',
          href: '/test'
        }
      ]
    });
    expect(result.current.error).toBeNull();
  });

  it('deve retornar erro quando a busca de dados falhar', async () => {
    const { fetchDashboardData } = require('../../services/api');
    fetchDashboardData.mockImplementationOnce(() => Promise.reject(new Error('Erro na API')));

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Erro na API');
  });

  it('deve chamar refetch ao invocar refetch', async () => {
    const { fetchDashboardData } = require('../../services/api');
    
    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetchDashboardData.mockClear(); // Limpa o mock após o primeiro fetch
    result.current.refetch();

    expect(fetchDashboardData).toHaveBeenCalledTimes(1);
  });
}); 