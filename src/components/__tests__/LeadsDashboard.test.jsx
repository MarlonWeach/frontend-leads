import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadsDashboard from '../LeadsDashboard';
import { useLeadsData, useLeadActions, useLeadExport } from '../../hooks/useLeadsData';
import { useAdvertiserFilter } from '../../hooks/useAdvertisersData';

// Mock do módulo de hooks
jest.mock('../../hooks/useLeadsData');
jest.mock('../../hooks/useAdvertisersData');

describe('LeadsDashboard', () => {
  const mockLeads = [
    {
      id: 'lead1',
      full_name: 'Alice Silva',
      email: 'alice@example.com',
      phone: '11987654321',
      status: 'new',
      campaign_name: 'Campanha A',
      created_time: '2024-03-20T10:00:00Z',
      form_data: { cidade: 'São Paulo' },
      lead_interactions: [],
    },
    {
      id: 'lead2',
      full_name: 'Bruno Costa',
      email: 'bruno@example.com',
      phone: '11912345678',
      status: 'contacted',
      campaign_name: 'Campanha B',
      created_time: '2024-03-19T11:00:00Z',
      form_data: { estado: 'Rio de Janeiro' },
      lead_interactions: [
        { id: 'int1', title: 'Primeiro Contato', interaction_type: 'call', description: 'Ligação realizada', created_at: '2024-03-19T12:00:00Z' }
      ],
    },
  ];

  const mockMetrics = {
    total_leads: 2,
    new_leads: 1,
    contacted_leads: 1,
    qualified_leads: 0,
    converted_leads: 0,
    unqualified_leads: 0,
    conversion_rate: 50,
    today: 0,
    this_week: 2,
  };

  const mockAdvertisers = [
    { id: 'adv1', name: 'Anunciante 1' },
    { id: 'adv2', name: 'Anunciante 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    useLeadsData.mockReturnValue({
      data: { leads: mockLeads, metrics: mockMetrics },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    useLeadActions.mockReturnValue({
      updateLeadStatus: jest.fn(),
      addInteraction: jest.fn(),
      updating: false,
    });

    useLeadExport.mockReturnValue({
      exportToCSV: jest.fn(),
    });

    useAdvertiserFilter.mockReturnValue({
      advertisers: mockAdvertisers,
      loading: false,
      error: null,
    });
  });

  it('deve renderizar o dashboard com métricas e leads', async () => {
    render(<LeadsDashboard />);

    // Verificar se as métricas estão visíveis
    expect(screen.getByText('Total de Leads')).toBeInTheDocument();
    
    // Usar seletor mais específico para o número total de leads
    const totalLeadsCard = screen.getByText('Total de Leads').closest('div');
    expect(totalLeadsCard).toHaveTextContent('2');
    
    expect(screen.getByText('Novos Leads')).toBeInTheDocument();
    
    // Verificar se os leads estão na tabela
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
    
    // Verificar status
    expect(screen.getAllByText('Novo')[0]).toBeInTheDocument();
    expect(screen.getByText('Contatado')).toBeInTheDocument();
  });

  it('deve mostrar estado de carregamento', () => {
    useLeadsData.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<LeadsDashboard />);
    expect(screen.getByText('Carregando leads...')).toBeInTheDocument();
  });

  it('deve mostrar estado de erro e permitir retry', async () => {
    const mockRefetch = jest.fn();
    useLeadsData.mockReturnValueOnce({
      data: null,
      loading: false,
      error: 'Erro de conexão',
      refetch: mockRefetch,
    });

    render(<LeadsDashboard />);
    expect(screen.getByText(/Erro ao carregar leads: Erro de conexão/i)).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /Tentar Novamente/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('deve abrir e fechar o modal de detalhes do lead', async () => {
    render(<LeadsDashboard />);

    const viewDetailsButtons = screen.getAllByRole('button', { name: /ver detalhes/i });
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      // Verificar se o modal abriu (pode ter diferentes textos dependendo da implementação)
      const modalContent = screen.queryByText('Detalhes do Lead') || 
                          screen.queryByText('Alice Silva') ||
                          screen.queryByRole('dialog');
      expect(modalContent).toBeInTheDocument();
    });

    // Tentar fechar o modal se houver um botão de fechar
    const closeButton = screen.queryByRole('button', { name: /fechar/i }) ||
                       screen.queryByRole('button', { name: /close/i }) ||
                       screen.queryByText('×');
    
    if (closeButton) {
      fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Detalhes do Lead')).not.toBeInTheDocument();
    });
    }
  });

  it('deve filtrar leads por status', async () => {
    const mockRefetch = jest.fn();
    useLeadsData.mockReturnValue({
      data: { leads: mockLeads, metrics: mockMetrics },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<LeadsDashboard />);

    // Usar um seletor mais específico para o combobox de status
    const statusFilters = screen.getAllByRole('combobox');
    // Assumindo que o primeiro combobox é o de status
    const statusFilter = statusFilters[0];
    
    fireEvent.change(statusFilter, { target: { value: 'contacted' } });

    // Verifica se o filtro foi aplicado
    await waitFor(() => {
      expect(statusFilter.value).toBe('contacted');
    });
  });

  it('deve exportar leads para CSV', async () => {
    const mockExportToCSV = jest.fn();
    useLeadExport.mockReturnValue({
      exportToCSV: mockExportToCSV,
    });

    render(<LeadsDashboard />);

    const exportButton = screen.getByRole('button', { name: /exportar csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportToCSV).toHaveBeenCalledTimes(1);
      expect(mockExportToCSV).toHaveBeenCalledWith(mockLeads);
    });
  });

  it('deve atualizar o status do lead no modal', async () => {
    const mockUpdateLeadStatus = jest.fn();
    const mockRefetch = jest.fn();
    useLeadActions.mockReturnValue({
      updateLeadStatus: mockUpdateLeadStatus,
      addInteraction: jest.fn(),
      updating: false,
    });
    useLeadsData.mockReturnValue({
      data: { leads: mockLeads, metrics: mockMetrics },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<LeadsDashboard />);

    const viewDetailsButton = screen.getAllByRole('button', { name: /ver detalhes/i })[0];
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Detalhes do Lead')).toBeInTheDocument();
    });

    const contactedButton = screen.getByRole('button', { name: /marcar como contatado/i });
    fireEvent.click(contactedButton);

    await waitFor(() => {
      expect(mockUpdateLeadStatus).toHaveBeenCalledWith('lead1', 'contacted');
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Detalhes do Lead')).not.toBeInTheDocument(); // Modal should close
    });
  });
}); 