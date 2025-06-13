'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../src/components/MainLayout';
import { fetchPerformanceMetrics } from '../../src/services/performanceService';
import { testConnection, supabase } from '../../src/lib/supabaseClient';
import { calculateMetrics } from '../../src/lib/metrics';
import PerformancePageClient from './PerformancePageClient';

// Componente de erro
const ErrorMessage = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
        <p className="text-sm text-red-700 mt-1">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  </div>
);

// Componente de loading
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-32 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="text-sm text-gray-600">Carregando dados...</span>
  </div>
);

let searchParams;

function SearchParamsWrapper({ children }) {
  searchParams = useSearchParams();
  return children;
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PerformancePageClient>
        {/* TODO: mover o conteúdo principal da página para cá, usando searchParams e router se necessário */}
      </PerformancePageClient>
    </Suspense>
  );
}