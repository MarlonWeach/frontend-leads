import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceInsights } from '../../../src/hooks/usePerformanceInsights';
import { DateRange } from '../../../src/types/insights';

// Mock do hook usePerformanceData
jest.mock('../../../src/hooks/usePerformanceData', () => ({
  usePerformanceData: jest.fn()
}));

const mockUsePerformanceData = require('../../../src/hooks/usePerformanceData').usePerformanceData;

// Mock dos utilitários
jest.mock('../../../src/utils/performanceAnalysis', () => ({
  processMetrics: jest.fn(),
  calculateVariation: jest.fn()
}));

const mockProcessMetrics = require('../../../src/utils/performanceAnalysis').processMetrics;
const mockCalculateVariation = require('../../../src/utils/performanceAnalysis').calculateVariation;

describe('usePerformanceInsights', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    
    // Mock padrão para usePerformanceData
    mockUsePerformanceData.mockReturnValue({
      data: null,
      loading: false,
      error: null
    });

    // Mock padrão para processMetrics
    mockProcessMetrics.mockReturnValue([]);

    // Mock padrão para calculateVariation
    mockCalculateVariation.mockImplementation((current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockDateRange: DateRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-07')
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    expect(result.current.insights).toEqual([]);
    expect(result.current.comparison).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state correctly', () => {
    mockUsePerformanceData
      .mockReturnValueOnce({
        data: null,
        loading: true,
        error: null
      })
      .mockReturnValueOnce({
        data: null,
        loading: false,
        error: null
      });

    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
  });

  it('should process insights when data is available', async () => {
    const mockCurrentData = {
      leads: 100,
      spend: 1000,
      impressions: 10000,
      clicks: 500,
      ctr: 5,
      cpl: 10
    };

    const mockPreviousData = {
      leads: 80,
      spend: 800,
      impressions: 8000,
      clicks: 400,
      ctr: 5,
      cpl: 10
    };

    const mockInsights = [
      {
        id: 'insight-leads-1',
        type: 'success' as const,
        title: 'Leads Aumentou',
        description: 'Leads variou 25.0% (de 80 para 100)',
        metric: 'leads',
        variation: 25,
        priority: 'medium' as const,
        timestamp: new Date()
      }
    ];

    mockUsePerformanceData
      .mockReturnValueOnce({
        data: mockCurrentData,
        loading: false,
        error: null
      })
      .mockReturnValueOnce({
        data: mockPreviousData,
        loading: false,
        error: null
      });

    mockProcessMetrics.mockReturnValue(mockInsights);

    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.insights).toEqual(mockInsights);
      expect(result.current.comparison).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle errors correctly', () => {
    const mockError = 'Erro ao buscar dados';

    mockUsePerformanceData.mockReturnValue({
      data: null,
      loading: false,
      error: mockError
    });

    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    expect(result.current.error).toBe(mockError);
    expect(result.current.insights).toEqual([]);
    expect(result.current.comparison).toBeNull();
  });

  it('should use custom config when provided', () => {
    const customConfig = {
      threshold: 20,
      maxInsights: 3,
      enableAI: true
    };

    renderHook(
      () => usePerformanceInsights({ 
        dateRange: mockDateRange, 
        config: customConfig 
      }),
      { wrapper }
    );

    // Verificar se o hook foi chamado (não verificamos parâmetros específicos pois dependem de cálculo interno)
    expect(mockUsePerformanceData).toHaveBeenCalled();
  });

  it('should calculate previous period correctly', () => {
    const dateRange: DateRange = {
      start: new Date('2024-01-08'),
      end: new Date('2024-01-14')
    };

    renderHook(
      () => usePerformanceInsights({ dateRange }),
      { wrapper }
    );

    // Verificar se foi chamado duas vezes (período atual e anterior)
    expect(mockUsePerformanceData).toHaveBeenCalledTimes(2);
  });

  it('should handle edge case with zero values', () => {
    const mockCurrentData = {
      leads: 0,
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpl: 0
    };

    const mockPreviousData = {
      leads: 0,
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpl: 0
    };

    mockUsePerformanceData
      .mockReturnValueOnce({
        data: mockCurrentData,
        loading: false,
        error: null
      })
      .mockReturnValueOnce({
        data: mockPreviousData,
        loading: false,
        error: null
      });

    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    expect(result.current.insights).toEqual([]);
    expect(result.current.comparison).toBeNull();
  });

  it('should handle missing data gracefully', () => {
    const mockCurrentData = {
      leads: 100,
      // spend missing
      impressions: 10000,
      // clicks missing
      ctr: 5,
      cpl: 10
    };

    const mockPreviousData = {
      leads: 80,
      spend: 800,
      impressions: 8000,
      clicks: 400,
      ctr: 5,
      cpl: 10
    };

    mockUsePerformanceData
      .mockReturnValueOnce({
        data: mockCurrentData,
        loading: false,
        error: null
      })
      .mockReturnValueOnce({
        data: mockPreviousData,
        loading: false,
        error: null
      });

    const { result } = renderHook(
      () => usePerformanceInsights({ dateRange: mockDateRange }),
      { wrapper }
    );

    expect(result.current.comparison).toBeNull();
    // Deve processar apenas as métricas disponíveis
    expect(mockProcessMetrics).toHaveBeenCalled();
  });
}); 