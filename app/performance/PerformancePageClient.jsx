"use client";

import { usePerformanceData } from '../../src/hooks/usePerformanceData';
import PerformanceDashboard from '../../src/components/PerformanceDashboard';
import MainLayout from '../../src/components/MainLayout';

export default function PerformancePageClient() {
  const { data, isLoading, error } = usePerformanceData();

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 py-8">
          Erro ao carregar dados: {error}
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          Carregando...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PerformanceDashboard data={data} />
    </MainLayout>
  );
} 