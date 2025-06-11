import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardOverview from '../DashboardOverview';
import { useDashboardData } from '../../hooks/useDashboardData';

// Mock do hook useDashboardData
jest.mock('../../hooks/useDashboardData');

describe('DashboardOverview', () => {
  const mockData = {
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
  };

  beforeEach(() => {
    // Resetar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configurar mock padrão
    useDashboardData.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    });
  });

  it('deve renderizar o dashboard corretamente', () => {
    render(<DashboardOverview />);

    // Verificar métricas principais
    expect(screen.getByText('Total de Leads')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('20 novos • 30% conversão')).toBeInTheDocument();

    expect(screen.getByText('Campanhas Ativas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10 total')).toBeInTheDocument();

    expect(screen.getByText('Anunciantes')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('8 cadastrados')).toBeInTheDocument();

    expect(screen.getByText('Investimento')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
    expect(screen.getByText('CTR: 5,00%')).toBeInTheDocument();
  });

  it('deve mostrar estado de carregamento', () => {
    useDashboardData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    render(<DashboardOverview />);

    // Verificar indicadores de carregamento
    expect(screen.getAllByText('...')).toHaveLength(4);
    expect(screen.getAllByText('Carregando...')).toHaveLength(4);
  });

  it('deve mostrar erro quando houver falha', () => {
    const errorMessage = 'Erro ao carregar dados';
    useDashboardData.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage)
    });

    render(<DashboardOverview />);

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('deve mostrar alertas quando disponíveis', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('Teste de Alerta')).toBeInTheDocument();
    expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
    expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
  });

  it('deve mostrar atividade recente', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@email.com')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não houver alertas', async () => {
    useDashboardData.mockReturnValue({
      data: { ...mockData, alerts: [] },
      isLoading: false,
      error: null
    });

    render(<DashboardOverview />);

    expect(screen.getByText('Tudo funcionando perfeitamente!')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não houver atividade recente', async () => {
    useDashboardData.mockReturnValue({
      data: { ...mockData, recentActivity: [] },
      isLoading: false,
      error: null
    });

    render(<DashboardOverview />);

    expect(screen.getByText('Nenhuma atividade recente')).toBeInTheDocument();
  });

  it('deve recarregar dados ao clicar em tentar novamente após erro', async () => {
    const errorMessage = 'Erro ao carregar dados';
    const mockRefetch = jest.fn();

    useDashboardData.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
      refetch: mockRefetch
    });

    render(<DashboardOverview />);

    const retryButton = screen.getByText('Tentar novamente');
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
}); 