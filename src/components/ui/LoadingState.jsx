import React from 'react';

export function LoadingState({ 
  message = 'Carregando...', 
  size = 'default',
  className = '' 
}) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-electric border-t-transparent`} />
      {message && (
        <p className="text-sublabel-refined text-white/70 text-center">{message}</p>
      )}
    </div>
  );
} 