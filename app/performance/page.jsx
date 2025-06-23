import React, { Suspense } from 'react';
import MainLayout from '../../src/components/MainLayout';
import PerformancePageClient from './PerformancePageClient';

// Componente de loading
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-32 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="text-sublabel-refined text-white/70">Carregando dados...</span>
  </div>
);

export default function PerformancePage() {
  const breadcrumbs = [
    { name: 'Performance', href: '/performance' }
  ];

  return (
    <MainLayout title="Performance" breadcrumbs={breadcrumbs}>
      <Suspense fallback={<LoadingState />}>
        <PerformancePageClient />
      </Suspense>
    </MainLayout>
  );
}