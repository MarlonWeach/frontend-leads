import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('deve renderizar o children e o tooltip quando hover', () => {
    render(
      <Tooltip content="Este é um tooltip de teste">
        <span>Passe o mouse aqui</span>
      </Tooltip>
    );

    const childElement = screen.getByText('Passe o mouse aqui');
    expect(childElement).toBeInTheDocument();

    // O tooltip não deve estar visível inicialmente
    expect(screen.queryByText('Este é um tooltip de teste')).not.toBeInTheDocument();

    // Simular hover no children
    fireEvent.mouseEnter(childElement);
    expect(screen.getByText('Este é um tooltip de teste')).toBeInTheDocument();

    // Simular mouseLeave no children
    fireEvent.mouseLeave(childElement);
    expect(screen.queryByText('Este é um tooltip de teste')).not.toBeInTheDocument();
  });

  it('deve renderizar o children e o tooltip quando hover (com elemento HTML como children)', () => {
    render(
      <Tooltip content="Tooltip para botão">
        <button>Botão de Ação</button>
      </Tooltip>
    );

    const buttonElement = screen.getByRole('button', { name: /botão de ação/i });
    expect(buttonElement).toBeInTheDocument();

    expect(screen.queryByText('Tooltip para botão')).not.toBeInTheDocument();

    fireEvent.mouseEnter(buttonElement);
    expect(screen.getByText('Tooltip para botão')).toBeInTheDocument();

    fireEvent.mouseLeave(buttonElement);
    expect(screen.queryByText('Tooltip para botão')).not.toBeInTheDocument();
  });

  it('não deve renderizar o tooltip se não houver content', () => {
    render(
      <Tooltip>
        <span>Sem tooltip</span>
      </Tooltip>
    );

    const childElement = screen.getByText('Sem tooltip');
    expect(childElement).toBeInTheDocument();

    fireEvent.mouseEnter(childElement);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
}); 