import React from 'react';

const LoadingState = ({ message = 'Carregando...', hideSpinner = false }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        {!hideSpinner && (
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"
            data-testid="loading-spinner"
          ></div>
        )}
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState; 