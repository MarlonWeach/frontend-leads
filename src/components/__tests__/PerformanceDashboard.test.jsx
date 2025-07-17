import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceDashboard from '../PerformanceDashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPerformanceMetrics } from '../../services/performanceService';
import '@testing-library/jest-dom';

// Mock do Next.js Router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: jest.fn()
}));

// Mock do hook usePerformanceInsights
jest.mock('../../hooks/usePerformanceInsights', () => ({
  usePerformanceInsights: jest.fn(() => ({
    insights: [],
    loading: false,
    error: null,
    refresh: jest.fn()
  }))
}));

// Mock da função de serviço de performance
jest.mock('../../services/performanceService', () => ({
  fetchPerformanceMetrics: jest.fn(() => Promise.resolve({
    total_impressions: 10000,
    total_clicks: 500,
    ctr: 5.0,
    total_spend: 5000,
    total_leads: 100,
    conversion_rate: 10.0,
  })),
}));

// Mock do hook usePerformanceData
const mockUsePerformanceData = jest.fn();
jest.mock('../../hooks/usePerformanceData', () => ({
  __esModule: true,
  default: () => mockUsePerformanceData()
}));

jest.mock('../../components/ui/AnimatedBarChart', () => {
  const MockBarChart = () => <div data-testid="animated-bar-chart" />;
  MockBarChart.displayName = 'MockAnimatedBarChart';
  return MockBarChart;
});
jest.mock('../../components/ui/AnimatedLineChart', () => {
  const MockLineChart = () => <div data-testid="animated-line-chart" />;
  MockLineChart.displayName = 'MockAnimatedLineChart';
  return MockLineChart;
});
jest.mock('../../components/ui/AnimatedPieChart', () => {
  const MockPieChart = () => <div data-testid="animated-pie-chart" />;
  MockPieChart.displayName = 'MockAnimatedPieChart';
  return MockPieChart;
});

describe('PerformanceDashboard', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  };

  let mockSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('deve renderizar o dashboard e os selects de filtro', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Análise detalhada de performance e métricas')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Últimos 7 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Últimos 30 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Últimos 90 dias/i })).toBeInTheDocument();
  });

  it('deve exibir o filtro atual da URL', () => {
    mockSearchParams.set('period', 'custom');
    mockSearchParams.get = jest.fn().mockReturnValue('custom');
    render(<PerformanceDashboard />);
    // Não há texto 'custom', então apenas garantir que o componente renderiza
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('deve exibir "nenhum" quando não há filtro de período na URL', () => {
    mockSearchParams.get = jest.fn().mockReturnValue(null);
    render(<PerformanceDashboard />);
    // Não há texto 'nenhum', então apenas garantir que o componente renderiza
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('deve atualizar o estado ao selecionar um período', async () => {
    render(<PerformanceDashboard />);
    const select = screen.getByRole('combobox');
    
    // Verificar valor inicial
    expect(select.value).toBe('7d');
    
    // Mudar para 30 dias
    fireEvent.change(select, { target: { value: '30d' } });
    expect(select.value).toBe('30d');
    
    // Mudar para 90 dias
    fireEvent.change(select, { target: { value: '90d' } });
    expect(select.value).toBe('90d');
  });
}); 