import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PerformanceDashboard from '../PerformanceDashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPerformanceMetrics } from '../../services/performanceService';

// Mocks dos hooks do Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
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

describe('PerformanceDashboard', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      push: mockPush,
    });
    useSearchParams.mockReturnValue(mockSearchParams);
  });

  it('deve renderizar o dashboard e os botões de filtro', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByText('Dashboard de Performance (Versão URL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 dias/i })).toBeInTheDocument();
  });

  it('deve atualizar a URL para 7 dias ao clicar no botão', () => {
    render(<PerformanceDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /7 dias/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('?period=7d');
  });

  it('deve atualizar a URL para 30 dias ao clicar no botão', () => {
    render(<PerformanceDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /30 dias/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('?period=30d');
  });

  it('deve atualizar a URL para 90 dias ao clicar no botão', () => {
    render(<PerformanceDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /90 dias/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('?period=90d');
  });

  it('deve exibir o filtro atual da URL', () => {
    // Simular que a URL já tem um parâmetro de período
    mockSearchParams.set('period', 'custom');
    render(<PerformanceDashboard />);

    expect(screen.getByText(/Filtro atual: custom/i)).toBeInTheDocument();

    mockSearchParams.delete('period'); // Limpar para o próximo teste
  });

  it('deve exibir "nenhum" quando não há filtro de período na URL', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByText(/Filtro atual: nenhum/i)).toBeInTheDocument();
  });
}); 