'use client';

import React, { Suspense } from 'react';
import DashboardPageClient from './DashboardPageClient';

// Componente de loading
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-32 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="text-sm text-gray-600">Carregando dados...</span>
  </div>
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardPageClient />
    </Suspense>
  );
}