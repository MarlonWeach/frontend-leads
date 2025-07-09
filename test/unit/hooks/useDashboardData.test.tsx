import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDashboardOverview,
  useInvalidateDashboard
} from '../../../src/hooks/useDashboardData';
import { ReactNode } from 'react';

// Mock do logger (inline no jest.mock, antes de qualquer importação)
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock do fetch global
global.fetch = jest.fn();

// Obter referência ao mockLogger
const { logger: mockLogger } = jest.requireMock('@/utils/logger');

// Wrapper para o React Query com configurações específicas para testes
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // cacheTime foi renomeado para gcTime no React Query v5
        staleTime: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
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
    it('deve retornar erro amigável pois o endpoint foi removido', () => {
      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper()
      });
      
      // O hook agora retorna erro amigável imediatamente
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('O endpoint /api/dashboard/overview foi removido do sistema.');
    });
    
    it('deve retornar erro amigável mesmo com parâmetros de data', () => {
      const dateFrom = '2023-01-01';
      const dateTo = '2023-01-31';
      
      const { result } = renderHook(() => useDashboardOverview(dateFrom, dateTo), {
        wrapper: createWrapper()
      });
      
      // O hook agora retorna erro amigável imediatamente
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('O endpoint /api/dashboard/overview foi removido do sistema.');
    });
    
    it('deve ter função refetch vazia', () => {
      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper()
      });
      
      // A função refetch existe mas não faz nada
      expect(typeof result.current.refetch).toBe('function');
      expect(() => result.current.refetch()).not.toThrow();
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
      
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['dashboard', 'overview'] });
      // Removidos: activity, recent-sales e search (não utilizados)
    });
  });
}); 