import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('deve renderizar a mensagem de erro e o botão de retry', () => {
    const mockMessage = 'Algo deu errado!';
    const mockOnRetry = jest.fn();

    render(<ErrorMessage message={mockMessage} onRetry={mockOnRetry} />);

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(mockMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('deve chamar onRetry quando o botão é clicado', () => {
    const mockMessage = 'Erro de conexão.';
    const mockOnRetry = jest.fn();

    render(<ErrorMessage message={mockMessage} onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole('button', { name: /Tentar novamente/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('não deve renderizar o botão de retry se onRetry não for fornecido', () => {
    const mockMessage = 'Apenas um aviso.';

    render(<ErrorMessage message={mockMessage} />);

    expect(screen.getByText(mockMessage)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tentar novamente/i })).not.toBeInTheDocument();
  });
}); 