"use client";

import { usePerformanceData } from '../../src/hooks/usePerformanceData';
import PerformanceDashboard from '../../src/components/PerformanceDashboard';
import MainLayout from '../../src/components/MainLayout';
import LoadingState from '../../src/components/ui/LoadingState';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function PerformancePageClient() {
  const { data, isLoading, error, refetch } = usePerformanceData();

  const breadcrumbs = [
    { name: 'Performance', href: '/performance' }
  ];

  if (isLoading) {
    return (
      <MainLayout title="Performance" breadcrumbs={breadcrumbs}>
        <LoadingState type="table" />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Performance" breadcrumbs={breadcrumbs}>
        <ErrorMessage
          message={error.message}
          onRetry={refetch}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Performance" breadcrumbs={breadcrumbs}>
      <PerformanceDashboard data={data} />
    </MainLayout>
  );
} 