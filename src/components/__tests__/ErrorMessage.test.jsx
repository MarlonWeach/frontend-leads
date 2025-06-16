import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ui/ErrorMessage';

describe('ErrorMessage', () => {
  it('deve renderizar a mensagem de erro e o botão de retry', () => {
    const mockMessage = 'Algo deu errado!';
    const mockOnRetry = jest.fn();

    render(<ErrorMessage message={mockMessage} onRetry={mockOnRetry} />);

    expect(screen.getByText(mockMessage)).toBeInTheDocument();
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
  });

  it('deve chamar onRetry quando o botão for clicado', () => {
    const mockMessage = 'Erro de teste';
    const mockOnRetry = jest.fn();

    render(<ErrorMessage message={mockMessage} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('Tentar Novamente');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('não deve renderizar o botão quando onRetry não for fornecido', () => {
    const mockMessage = 'Erro sem retry';

    render(<ErrorMessage message={mockMessage} />);

    expect(screen.getByText(mockMessage)).toBeInTheDocument();
    expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument();
  });
}); 