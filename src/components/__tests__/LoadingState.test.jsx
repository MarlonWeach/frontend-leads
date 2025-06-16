import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../ui/LoadingState';

describe('LoadingState', () => {
  it('deve renderizar o texto padrão de carregamento e o spinner', () => {
    render(<LoadingState />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('deve renderizar uma mensagem personalizada quando fornecida', () => {
    const customMessage = 'Processando dados...';
    render(<LoadingState message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('deve renderizar sem o spinner se hideSpinner for true', () => {
    render(<LoadingState hideSpinner={true} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
}); 