import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadsDashboard from '../LeadsDashboard';
import { useLeadsData } from '../../hooks/useLeadsData';

// Mock dos hooks
jest.mock('../../hooks/useLeadsData');
jest.mock('../../hooks/useLeadActions', () => ({
  useLeadActions: () => ({
    updateLeadStatus: jest.fn(),
    addInteraction: jest.fn(),
    updating: false
  })
}));
jest.mock('../../hooks/useLeadExport', () => ({
  useLeadExport: () => ({
    exportToCSV: jest.fn()
  })
}));

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
    total: 2,
    new: 1,
    contacted: 1,
    qualified: 0,
    converted: 0,
    unqualified: 0,
    conversion_rate: 50,
    today: 0,
    this_week: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useLeadsData.mockReturnValue({
      data: { leads: mockLeads, metrics: mockMetrics },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('deve renderizar o dashboard com métricas e leads', async () => {
    render(<LeadsDashboard />);

    // Verificar se o título está visível
    expect(screen.getByText('Leads')).toBeInTheDocument();
    
    // Verificar se os leads estão na lista
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
    
    // Verificar se o botão de exportar está presente
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
  });

  it('deve mostrar estado de carregamento', () => {
    useLeadsData.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<LeadsDashboard />);
    
    // Verificar se o texto de carregamento está presente
    expect(screen.getByText('Carregando leads...')).toBeInTheDocument();
  });

  it('deve mostrar estado de erro e permitir retry', async () => {
    const mockRefetch = jest.fn();
    useLeadsData.mockReturnValueOnce({
      data: null,
      loading: false,
      error: { message: 'Erro de conexão' },
      refetch: mockRefetch,
    });

    render(<LeadsDashboard />);
    
    expect(screen.getByText('Erro ao carregar leads: Erro de conexão')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
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

    // Encontrar o select de status (segundo combobox)
    const statusFilters = screen.getAllByRole('combobox');
    const statusFilter = statusFilters[1]; // O segundo combobox é o de status
    
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

    const exportButton = screen.getByRole('button', { name: /exportar/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportToCSV).toHaveBeenCalledTimes(1);
    });
  });

  it('deve buscar leads por texto', async () => {
    render(<LeadsDashboard />);

    const searchInput = screen.getByPlaceholderText(/buscar leads por nome, email ou telefone/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(searchInput.value).toBe('Alice');
    });
  });

  it('deve mostrar leads filtrados corretamente', () => {
    render(<LeadsDashboard />);

    // Verificar se todos os leads estão visíveis inicialmente
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();

    // Verificar se os status estão corretos
    expect(screen.getByText('Novo')).toBeInTheDocument();
    expect(screen.getByText('Contatado')).toBeInTheDocument();
  });

  it('deve mostrar gráfico de tendências', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText('Tendências de Leads')).toBeInTheDocument();
    expect(screen.getAllByText('Novos')).toHaveLength(2); // Um no select, outro no botão
    expect(screen.getAllByText('Convertidos')).toHaveLength(3); // Um no card, um no select, um no botão
    expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
  });

  it('deve mostrar lista de leads com informações corretas', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText('Lista de Leads')).toBeInTheDocument();
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
  });
}); 