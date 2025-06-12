import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryWithCache, useFormattedLastUpdated } from '@/hooks/useQueryWithCache';
import { ReactNode } from 'react';

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

describe('useQueryWithCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('deve retornar dados quando a consulta é bem-sucedida', async () => {
    const mockData = { message: 'success' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(
      () => useQueryWithCache('test-query', mockQueryFn),
      { wrapper: createWrapper() }
    );
    
    // Inicialmente, deve estar carregando
    expect(result.current.isLoading).toBe(true);
    
    // Aguardar a conclusão da consulta
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verificar se os dados foram retornados corretamente
    expect(result.current.data).toEqual(mockData);
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
    
    // Verificar se lastUpdated foi definido
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });
  
  it('deve lidar com erros na consulta', async () => {
    const mockError = new Error('Query failed');
    const mockQueryFn = jest.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(
      () => useQueryWithCache('test-query-error', mockQueryFn),
      { wrapper: createWrapper() }
    );
    
    // Aguardar a conclusão da consulta
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    // Verificar se o erro foi capturado corretamente
    expect(result.current.error).toEqual(mockError);
  });
  
  it('deve usar as opções fornecidas', async () => {
    const mockData = { message: 'success' };
    const mockQueryFn = jest.fn().mockResolvedValue(mockData);
    const mockOnSuccess = jest.fn();
    
    const { result } = renderHook(
      () => useQueryWithCache('test-query-options', mockQueryFn, {
        staleTime: 1000,
        cacheTime: 2000,
        onSuccess: mockOnSuccess
      }),
      { wrapper: createWrapper() }
    );
    
    // Aguardar a conclusão da consulta
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verificar se o callback onSuccess foi chamado
    expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
  });
});

describe('useFormattedLastUpdated', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('deve retornar string vazia quando lastUpdated é null', () => {
    const { result } = renderHook(() => useFormattedLastUpdated(null));
    expect(result.current).toBe('');
  });
  
  it('deve formatar o tempo relativo corretamente', () => {
    const now = new Date();
    
    // Testar "agora mesmo"
    const justNow = new Date(now.getTime() - 30 * 1000); // 30 segundos atrás
    const { result: resultJustNow } = renderHook(() => useFormattedLastUpdated(justNow));
    expect(resultJustNow.current).toBe('agora mesmo');
    
    // Testar minutos
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutos atrás
    const { result: resultMinutes } = renderHook(() => useFormattedLastUpdated(minutesAgo));
    expect(resultMinutes.current).toBe('há 5 minutos');
    
    // Testar hora singular
    const hourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hora atrás
    const { result: resultHour } = renderHook(() => useFormattedLastUpdated(hourAgo));
    expect(resultHour.current).toBe('há 1 hora');
    
    // Testar horas plural
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 horas atrás
    const { result: resultHours } = renderHook(() => useFormattedLastUpdated(hoursAgo));
    expect(resultHours.current).toBe('há 3 horas');
    
    // Testar dia singular
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 dia atrás
    const { result: resultDay } = renderHook(() => useFormattedLastUpdated(dayAgo));
    expect(resultDay.current).toBe('há 1 dia');
    
    // Testar dias plural
    const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 dias atrás
    const { result: resultDays } = renderHook(() => useFormattedLastUpdated(daysAgo));
    expect(resultDays.current).toBe('há 3 dias');
  });
  
  it('deve atualizar o tempo formatado a cada minuto', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); // 2 minutos atrás
    const { result } = renderHook(() => useFormattedLastUpdated(twoMinutesAgo));
    
    expect(result.current).toBe('há 2 minutos');
    
    // Avançar o tempo em 1 minuto
    jest.advanceTimersByTime(60 * 1000);
    
    // Agora deve ser "há 3 minutos"
    expect(result.current).toBe('há 3 minutos');
  });
}); 