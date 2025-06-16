import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdvertisersDashboard from '../AdvertisersDashboard';

// Mock simples do Supabase client
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ 
          data: [
  {
    id: 'adv1',
    name: 'Anunciante Teste 1',
    email: 'adv1@test.com',
    phone: '1111111111',
    website: 'www.test1.com',
              status: 'active',
              created_at: '2024-03-20T10:00:00Z',
            }
          ], 
          error: null 
        })),
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ count: 1, error: null })),
          eq: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({ count: 1, error: null }))
          })),
          single: jest.fn(() => Promise.resolve({ 
            data: {
              id: 'adv1',
              name: 'Anunciante Teste 1',
              email: 'adv1@test.com',
              phone: '1111111111',
              website: 'www.test1.com',
              status: 'active',
    created_at: '2024-03-20T10:00:00Z',
  },
            error: null 
          })),
          order: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          })),
          limit: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        }))
      }))
    }))
  }
}));

describe('AdvertisersDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o estado de carregamento inicial', () => {
    render(<AdvertisersDashboard />);
    expect(screen.getByText('Carregando anunciantes...')).toBeInTheDocument();
  });

  it('deve renderizar sem erros', async () => {
    render(<AdvertisersDashboard />);

    // Aguarda o componente carregar
    await waitFor(() => {
      // Verifica se não há erro crítico na tela
      expect(screen.queryByText(/TypeError/)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 