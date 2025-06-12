import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useDashboardOverview, 
  useDashboardActivity,
  useDashboardRecentSales,
  useDashboardSearch,
  useInvalidateDashboard
} from '@/hooks/useDashboardData';
import { ReactNode } from 'react';

// Mock do fetch global
global.fetch = jest.fn();

// Wrapper para o React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboardData hooks', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  describe('useDashboardOverview', () => {
    it('deve buscar dados do overview corretamente', async () => {
      const mockData = {
        metrics: {
          campaigns: { total: 10, active: 5 },
          leads: { total: 100, new: 50, converted: 30, conversion_rate: 60 },
          advertisers: { total: 20, active: 15 },
          performance: { spend: 1000, impressions: 5000, clicks: 200, ctr: 4 }
        },
        recentActivity: [],
        alerts: [],
        overviewData: []
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper()
      });
      
      // Inicialmente, deve estar carregando
      expect(result.current.isLoading).toBe(true);
      
      // Aguardar a conclusão da consulta
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verificar se os dados foram retornados corretamente
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/overview');
    });
    
    it('deve incluir parâmetros de data na URL quando fornecidos', async () => {
      const dateFrom = '2023-01-01';
      const dateTo = '2023-01-31';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      
      renderHook(() => useDashboardOverview(dateFrom, dateTo), {
        wrapper: createWrapper()
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/dashboard/overview?date_from=${dateFrom}&date_to=${dateTo}`
      );
    });
    
    it('deve lidar com erros na API', async () => {
      const errorMessage = 'Erro ao buscar dados';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: errorMessage
      });
      
      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper()
      });
      
      // Aguardar a conclusão da consulta
      await waitFor(() => expect(result.current.isError).toBe(true));
      
      // Verificar se o erro foi capturado corretamente
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toContain(errorMessage);
    });
  });
  
  describe('useDashboardActivity', () => {
    it('deve buscar dados de atividade corretamente', async () => {
      const mockData = [
        { status: 'pendente', total: 10 },
        { status: 'convertido', total: 5 }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      const { result } = renderHook(() => useDashboardActivity(), {
        wrapper: createWrapper()
      });
      
      // Aguardar a conclusão da consulta
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verificar se os dados foram retornados corretamente
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/activity');
    });
  });
  
  describe('useDashboardRecentSales', () => {
    it('deve buscar dados de vendas recentes corretamente', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Anúncio 1',
          email: '10 leads',
          status: 'convertido',
          amount: 'R$ 100.00',
          created_at: '2023-01-01T12:00:00Z'
        }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      const { result } = renderHook(() => useDashboardRecentSales(), {
        wrapper: createWrapper()
      });
      
      // Aguardar a conclusão da consulta
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verificar se os dados foram retornados corretamente
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/recent-sales');
    });
  });
  
  describe('useDashboardSearch', () => {
    it('deve buscar dados de busca corretamente', async () => {
      const mockData = [
        { source: 'Facebook', total: 50 },
        { source: 'Instagram', total: 30 }
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      const { result } = renderHook(() => useDashboardSearch(), {
        wrapper: createWrapper()
      });
      
      // Aguardar a conclusão da consulta
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      // Verificar se os dados foram retornados corretamente
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/search');
    });
  });
  
  describe('useInvalidateDashboard', () => {
    it('deve invalidar todas as consultas do dashboard', async () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
      
      const { result } = renderHook(() => useInvalidateDashboard(), { wrapper });
      
      await result.current();
      
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'overview'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'activity'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'recent-sales'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'search'] });
    });
  });
}); 