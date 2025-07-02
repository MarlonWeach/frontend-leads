// Mock do logger (inline no jest.mock, antes de qualquer importação)
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryWithCache, useFormattedLastUpdated } from '@/hooks/useQueryWithCache';
import { ReactNode } from 'react';

// Obter referência ao mockLogger
const { logger: mockLogger } = jest.requireMock('@/utils/logger');

describe('useQueryWithCache', () => {
  let queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 10000, // 10 segundos (cacheTime foi renomeado para gcTime no React Query v5)
        staleTime: 5000,  // 5 segundos
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  it('deve buscar e armazenar dados em cache', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetchFn = jest.fn().mockResolvedValue(mockData);
    const cacheKey = ['test-key'];

    const { result } = renderHook(
      () => useQueryWithCache(cacheKey, mockFetchFn),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(mockFetchFn).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Cache miss'),
      expect.objectContaining({ key: cacheKey })
    );
  });

  it('deve retornar dados do cache quando disponível', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetchFn = jest.fn().mockResolvedValue(mockData);
    const cacheKey = ['test-key'];

    // Primeira chamada para popular o cache
    const { result: result1 } = renderHook(
      () => useQueryWithCache(cacheKey, mockFetchFn),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result1.current.data).toEqual(mockData);
    });

    // Segunda chamada deve usar o cache
    const { result: result2 } = renderHook(
      () => useQueryWithCache(cacheKey, mockFetchFn, { staleTime: 3600000 }),
      { wrapper: createWrapper() }
    );

    expect(result2.current.data).toEqual(mockData);
    expect(mockFetchFn).toHaveBeenCalledTimes(1);
  });

  it('deve lidar com erros corretamente', async () => {
    const mockError = new Error('Fetch error');
    const mockFetchFn = jest.fn().mockRejectedValue(mockError);
    const cacheKey = ['test-key'];

    const { result } = renderHook(
      () => useQueryWithCache(cacheKey, mockFetchFn),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(mockFetchFn).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching data'),
      expect.objectContaining({
        key: cacheKey,
        error: mockError
      })
    );
  });
});

describe('useFormattedLastUpdated', () => {
  it('deve formatar a data corretamente', () => {
    const mockDate = new Date(Date.now() - 2 * 60 * 1000);
    const { result } = renderHook(() => useFormattedLastUpdated(mockDate));

    expect(result.current).toMatch(/há 2 minutos?/);
  });

  it('deve retornar string vazia quando a data é nula', () => {
    const { result } = renderHook(() => useFormattedLastUpdated(null));
    expect(result.current).toBe('');
  });
}); 