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

// Mock do hook useCampaignsData
const mockUseCampaignsData = jest.fn();
jest.mock('../../hooks/useCampaignsData', () => ({
  __esModule: true,
  useCampaignsData: () => mockUseCampaignsData()
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
    mockUseCampaignsData.mockReturnValue({
      campaigns: [
        {
          id: '1',
          name: 'Campanha 1',
          status: 'ACTIVE',
          effective_status: 'ACTIVE',
          created_time: '2024-03-20T10:00:00Z',
          updated_time: '2024-03-21T10:00:00Z',
          objective: 'LEAD_GENERATION',
          spend: 50000,
          impressions: 1000000,
          clicks: 15000,
          leads: 1234,
          ctr: 1.5,
          cpl: 40.5,
          is_active: true
        },
        {
          id: '2',
          name: 'Campanha 2',
          status: 'ACTIVE',
          effective_status: 'ACTIVE',
          created_time: '2024-03-19T10:00:00Z',
          updated_time: '2024-03-20T10:00:00Z',
          objective: 'LEAD_GENERATION',
          spend: 25000,
          impressions: 500000,
          clicks: 7500,
          leads: 500,
          ctr: 1.5,
          cpl: 50,
          is_active: true
        }
      ],
      loading: false,
      error: null,
      refreshCampaigns: jest.fn()
    });

    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
  });

  it('deve renderizar o dashboard com métricas de anúncios ativos', async () => {
    render(<DashboardOverview />);

    // Debug: logar HTML para depuração
    // eslint-disable-next-line no-console
    // console.log(document.body.innerHTML);

    // Verifica se o dashboard está presente
    expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();

    // Verifica cards principais
    expect(screen.getByText('Campanhas Ativas')).toBeInTheDocument();
    expect(screen.getByText('Investimento Total')).toBeInTheDocument();
    expect(screen.getByText('Impressões')).toBeInTheDocument();
    expect(screen.getByText('Cliques')).toBeInTheDocument();
    expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
    expect(screen.getByText('CTR Médio')).toBeInTheDocument();
    expect(screen.getByText('CPL Médio')).toBeInTheDocument();

    // Verifica valores principais
    expect(screen.getByText('2')).toBeInTheDocument(); // Campanhas ativas
    expect(screen.getByText('75k')).toBeInTheDocument(); // Investimento total
    expect(screen.getByText('1.50M')).toBeInTheDocument(); // Impressões
  });

  it('deve mostrar estado de carregamento', () => {
    mockUseCampaignsData.mockReturnValue({
      campaigns: [],
      loading: true,
      error: null,
      refreshCampaigns: jest.fn()
    });

    render(<DashboardOverview />);

    // Verificar se os cards de loading estão presentes
    const loadingCards = screen.getAllByRole('generic').filter(
      element => element.className.includes('animate-pulse')
    );
    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it('deve mostrar erro quando houver falha', async () => {
    const errorMessage = 'Erro ao carregar dados';
    mockUseCampaignsData.mockReturnValue({
      campaigns: [],
      loading: false,
      error: new Error(errorMessage),
      refreshCampaigns: jest.fn()
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
    // Verifica se nomes das campanhas aparecem
    expect(screen.getByText('Campanha 1')).toBeInTheDocument();
    expect(screen.getByText('Campanha 2')).toBeInTheDocument();
  });

  it('deve mostrar alertas quando disponíveis', () => {
    // Força um cenário de alerta (menos de 5 leads e spend > 1000)
    mockUseCampaignsData.mockReturnValue({
      campaigns: [
        {
          id: '3',
          name: 'Campanha Fraca',
          status: 'ACTIVE',
          effective_status: 'ACTIVE',
          created_time: '2024-03-20T10:00:00Z',
          updated_time: '2024-03-21T10:00:00Z',
          objective: 'LEAD_GENERATION',
          spend: 2000,
          impressions: 10000,
          clicks: 100,
          leads: 2,
          ctr: 1,
          cpl: 1000,
          is_active: true
        }
      ],
      loading: false,
      error: null,
      refreshCampaigns: jest.fn()
    });
    render(<DashboardOverview />);
    const alertsSection = screen.getByTestId('dashboard-alerts');
    expect(alertsSection).toBeInTheDocument();
    expect(screen.getByText('Campanhas com poucos leads')).toBeInTheDocument();
    expect(screen.getByText(/campanha\(s\) com menos de 5 leads/i)).toBeInTheDocument();
    expect(screen.getByText('Ver campanhas')).toBeInTheDocument();
  });

  it('deve atualizar filtro de período', async () => {
    render(<DashboardOverview />);
    // Seleciona o botão "7 dias" e clica
    const filterButton = screen.getByRole('button', { name: '7 dias' });
    await userEvent.click(filterButton);
    // O filtro só muda o estado local, não faz push de rota
    // Então não espera chamada ao mockRouter.push
    expect(filterButton).toHaveClass('bg-blue-600');
  });
}); 