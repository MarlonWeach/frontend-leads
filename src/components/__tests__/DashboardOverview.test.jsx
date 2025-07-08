import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardOverview from '../DashboardOverview';
import { useDashboardOverview } from '../../hooks/useDashboardData';
import { useRouter, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock dos componentes de gráficos que causam problemas de ES Modules
jest.mock('../ui/AnimatedLineChart', () => {
  return function MockAnimatedLineChart({ data, height }) {
    return (
      <div data-testid="animated-line-chart">
        <h3>Gráfico de Linha</h3>
        <p>Dados: {JSON.stringify(data)}</p>
        <p>Altura: {height}</p>
      </div>
    );
  };
});

jest.mock('../ui/AnimatedBarChart', () => {
  return function MockAnimatedBarChart({ data, height }) {
    return (
      <div data-testid="animated-bar-chart">
        <h3>Gráfico de Barras</h3>
        <p>Dados: {JSON.stringify(data)}</p>
        <p>Altura: {height}</p>
      </div>
    );
  };
});

jest.mock('../ui/AnimatedPieChart', () => {
  return function MockAnimatedPieChart({ data, height }) {
    return (
      <div data-testid="animated-pie-chart">
        <h3>Gráfico de Pizza</h3>
        <p>Dados: {JSON.stringify(data)}</p>
        <p>Altura: {height}</p>
      </div>
    );
  };
});

// Mock do hook useDashboardOverview
const mockUseDashboardOverview = jest.fn();
jest.mock('../../hooks/useDashboardData', () => ({
  __esModule: true,
  useDashboardOverview: () => mockUseDashboardOverview()
}));

// Mock do Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

describe('DashboardOverview', () => {
  const mockData = {
    metrics: {
      leads: { total: 1234, active: 1000 },
      campaigns: { total: 15, active: 12 },
      adsets: { total: 45, active: 38 },
      ads: { total: 120, active: 95 },
      spend: { total: 50000, today: 2500 },
      impressions: { total: 1000000, today: 50000 },
      clicks: { total: 15000, today: 750 },
      ctr: { average: 1.5, trend: 0.2 }
    },
    recentActivity: [
      {
        type: 'lead',
        value: 1,
        timestamp: '2024-03-21T10:00:00Z',
        metadata: {
          impressions: 1000,
          clicks: 50
        }
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
  };

  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  };

  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    // Resetar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configurar mock padrão
    mockUseDashboardOverview.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
  });

  it('deve renderizar o dashboard com métricas de anúncios ativos', async () => {
    render(<DashboardOverview />);

    // Verificar se o container do dashboard está presente
    expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
    
    // Verificar se o container de métricas está presente
    const metricsSummary = screen.getByTestId('metrics-summary');
    expect(metricsSummary).toBeInTheDocument();

    // Verificar métricas de leads
    const leadsCard = screen.getByTestId('metric-card-leads');
    expect(leadsCard).toBeInTheDocument();
    expect(screen.getByTestId('metric-leads-total')).toHaveTextContent('1234');
    expect(leadsCard).toHaveTextContent('1000');
    expect(leadsCard).toHaveTextContent('1.5%');

    // Verificar métricas de campanhas
    const campaignsCard = screen.getByTestId('metric-card-campaigns');
    expect(campaignsCard).toBeInTheDocument();
    expect(screen.getByTestId('metric-campaigns-active')).toHaveTextContent('12');
    expect(campaignsCard).toHaveTextContent('15');

    // Verificar métricas de performance
    const performanceCard = screen.getByTestId('metric-card-performance');
    expect(performanceCard).toBeInTheDocument();
    const spendText = screen.getByTestId('metric-performance-spend').textContent;
    expect(spendText === 'R$ 50.000' || spendText === 'R$ 50k').toBe(true);
  });

  it('deve mostrar estado de carregamento', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<DashboardOverview />);

    // Verificar se os cards de loading estão presentes
    const loadingCards = screen.getAllByRole('generic').filter(
      element => element.className.includes('animate-pulse')
    );
    expect(loadingCards).toHaveLength(4);
  });

  it('deve mostrar erro quando houver falha', async () => {
    const errorMessage = 'Erro ao carregar dados';
    mockUseDashboardOverview.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
      refetch: jest.fn()
    });

    render(<DashboardOverview />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('deve mostrar atividade recente', async () => {
    render(<DashboardOverview />);

    const activitySection = screen.getByTestId('dashboard-activity');
    expect(activitySection).toBeInTheDocument();
    
    // Verificar se os dados da atividade recente estão presentes
    expect(screen.getByText('Novo Lead')).toBeInTheDocument();
    expect(screen.getByText('1 leads')).toBeInTheDocument();
    expect(screen.getByText(/1\.000 impressões/)).toBeInTheDocument();
    expect(screen.getByText(/50 cliques/)).toBeInTheDocument();
  });

  it('deve mostrar alertas quando disponíveis', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('Teste de Alerta')).toBeInTheDocument();
    expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
    expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
  });

  it('deve recarregar dados ao clicar em tentar novamente após erro', async () => {
    const mockRefetch = jest.fn();
    mockUseDashboardOverview.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Erro ao carregar dados'),
      refetch: mockRefetch
    });

    render(<DashboardOverview />);

    const retryButton = screen.getByTestId('retry-button');
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('deve atualizar filtro de período', async () => {
    render(<DashboardOverview />);

    // Selecionar o botão de filtro específico usando o container pai
    const filterContainer = screen.getByTestId('dashboard-overview').querySelector('.flex.space-x-2');
    const filterButton = within(filterContainer).getByRole('button', { name: '7 dias' });
    await userEvent.click(filterButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?period=7d');
  });
}); 