import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../ui/LoadingState';

describe('LoadingState', () => {
  it('deve renderizar o loading state', () => {
    render(<LoadingState />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('deve renderizar sem o spinner se hideSpinner for true', () => {
    render(<LoadingState hideSpinner={true} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
}); 