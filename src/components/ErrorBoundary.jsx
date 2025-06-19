'use client';

import React from 'react';
import { captureError } from '../lib/sentry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Capturar erro no Sentry
    captureError(error, {
      ...errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-glass flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col items-center">
            <div className="text-title font-bold text-primary-text mb-4">Erro inesperado</div>
            <div className="text-sublabel text-glow mb-2">Ocorreu um erro ao carregar o conteúdo.</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cta text-white rounded-2xl hover:bg-cta/80 transition-colors shadow-cta-glow mb-2"
            >
              Recarregar página
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/80 transition-colors"
            >
              Tentar novamente
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-glass rounded-2xl text-left">
                <p className="text-sm font-mono text-secondary-text whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 