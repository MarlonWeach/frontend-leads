import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorMessage({ 
  error, 
  onRetry, 
  title = 'Erro',
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 p-8 ${className}`}>
      <div className="glass-card backdrop-blur-lg p-6 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-4">
          <AlertCircle className="h-8 w-8 text-violet flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-header font-semibold text-white mb-2">{title}</h3>
            <p className="text-sublabel-refined text-white/80">
              {error?.message || 'Ocorreu um erro inesperado'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-electric text-background rounded-xl hover:bg-violet transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tentar novamente</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 