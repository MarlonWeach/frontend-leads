'use client';

import React from 'react';
import { Card } from './card';
import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({
  title = "Ops! Algo deu errado",
  message,
  onRetry,
}) {
  return (
    <div data-testid="error-message" className="flex items-center justify-center min-h-[400px]">
       <Card className="p-8 text-center glass-light border-accent/30 shadow-lg shadow-accent/10">
        <AlertCircle className="h-12 w-12 text-accent mx-auto mb-4" />
        <h2 className="text-header text-white mb-2">{title}</h2>
        {message && <p className="text-sublabel-refined text-glow mb-6">{message}</p>}
        {onRetry && (
          <button
            data-testid="retry-button"
            onClick={onRetry}
            className="px-4 py-2 bg-cta text-white rounded-2xl hover:bg-cta/80 transition-colors shadow-cta-glow"
          >
            Tentar novamente
          </button>
        )}
      </Card>
    </div>
  );
} 