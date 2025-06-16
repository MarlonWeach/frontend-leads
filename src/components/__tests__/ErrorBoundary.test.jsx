import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import { captureError } from '../../lib/sentry';
import ErrorBoundary from '../ErrorBoundary';

// Mock do Sentry e captureError
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  flush: jest.fn(),
  withScope: jest.fn((callback) => callback({ setExtra: jest.fn() }))
}));

jest.mock('../../lib/sentry', () => ({
  captureError: jest.fn((error, context) => {
    Sentry.captureException(error);
  })
}));

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Erro de teste!');
  };

  const NormalComponent = () => <div>Componente normal</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar console.error para não poluir os logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('deve renderizar a UI de fallback quando um erro ocorre', () => {
    // Suprimir o erro de console que o React gera ao propagar o erro
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();

    console.error = originalError;
  });

  it('deve chamar captureError quando um erro ocorre', () => {
    // Suprimir o erro de console que o React gera ao propagar o erro
    const originalError = console.error;
    console.error = jest.fn();

    const error = new Error('Erro de teste!');
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(captureError).toHaveBeenCalled();
    const capturedError = captureError.mock.calls[0][0];
    expect(capturedError.message).toBe(error.message);

    console.error = originalError;
  });

  it('deve resetar o estado do erro ao clicar em "Tentar novamente"', async () => {
    // Suprimir o erro de console que o React gera ao propagar o erro
    const originalError = console.error;
    console.error = jest.fn();

    const { rerender } = render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    // Verificar se o componente normal foi renderizado inicialmente
    expect(screen.getByText('Componente normal')).toBeInTheDocument();

    // Forçar um erro
    await act(async () => {
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
    });

    // Verificar se o erro foi renderizado
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();

    // Clicar em "Tentar novamente" e re-renderizar
    await act(async () => {
      fireEvent.click(screen.getByText('Tentar novamente'));
      rerender(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );
    });

    // Aguardar e verificar se o componente normal foi renderizado novamente
    await waitFor(() => {
      expect(screen.getByText('Componente normal')).toBeInTheDocument();
      expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
    });

    console.error = originalError;
  });

  it('deve renderizar children normalmente quando não há erro', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente normal')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });
}); 