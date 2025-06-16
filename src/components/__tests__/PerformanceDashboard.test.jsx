import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceDashboard from '../PerformanceDashboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPerformanceMetrics } from '../../services/performanceService';

// Mock do Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
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
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  };

  let mockSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
  });

  it('deve renderizar o dashboard e os botões de filtro', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByText('Dashboard de Performance (Versão URL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30 dias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 dias/i })).toBeInTheDocument();
  });

  it('deve exibir o filtro atual da URL', () => {
    mockSearchParams.set('period', 'custom');
    mockSearchParams.get = jest.fn().mockReturnValue('custom');
    
    render(<PerformanceDashboard />);

    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('deve exibir "nenhum" quando não há filtro de período na URL', () => {
    mockSearchParams.get = jest.fn().mockReturnValue(null);
    
    render(<PerformanceDashboard />);

    expect(screen.getByText('nenhum')).toBeInTheDocument();
  });

  it('deve atualizar a URL ao clicar nos botões de filtro', async () => {
    render(<PerformanceDashboard />);

    const button7d = screen.getByText('7 dias');
    await userEvent.click(button7d);
    expect(mockRouter.push).toHaveBeenCalledWith('?period=7d');

    const button30d = screen.getByText('30 dias');
    await userEvent.click(button30d);
    expect(mockRouter.push).toHaveBeenCalledWith('?period=30d');

    const button90d = screen.getByText('90 dias');
    await userEvent.click(button90d);
    expect(mockRouter.push).toHaveBeenCalledWith('?period=90d');
  });
}); 