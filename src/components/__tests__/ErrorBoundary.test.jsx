import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock de Sentry para evitar chamadas reais durante os testes
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
}));

const ProblematicComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Erro de teste!');
  }
  return <div>Componente normal</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  // Suprimir erros de React gerados pela ErrorBoundary durante os testes
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  it('deve renderizar o children se não houver erro', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente normal')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });

  it('deve renderizar a UI de fallback quando um erro ocorre', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Erro de teste!')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('deve chamar Sentry.captureException quando um erro ocorre', () => {
    const Sentry = require('@sentry/browser');
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('deve resetar o estado do erro ao clicar em "Tentar novamente" e re-renderizar o children', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verifica que a UI de fallback está visível
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();

    // Simula o clique no botão "Tentar novamente"
    fireEvent.click(screen.getByText('Tentar novamente'));

    // O componente ProblematicComponent agora deve renderizar normalmente
    expect(screen.getByText('Componente normal')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });
}); 