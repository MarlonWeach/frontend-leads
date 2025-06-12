import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('deve renderizar o texto padrão de carregamento e o spinner', () => {
    render(<LoadingState />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Assumindo que o spinner tem um data-testid="loading-spinner"
  });

  it('deve renderizar um texto de carregamento customizado', () => {
    const customMessage = 'Buscando dados...';
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