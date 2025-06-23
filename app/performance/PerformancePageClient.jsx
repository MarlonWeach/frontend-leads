"use client";

import { usePerformanceData } from '../../src/hooks/usePerformanceData';
import PerformanceDashboard from '../../src/components/PerformanceDashboard';
import LoadingState from '../../src/components/ui/LoadingState';
import ErrorMessage from '../../src/components/ui/ErrorMessage';

export default function PerformancePageClient() {
  const { data, isLoading, error, refetch } = usePerformanceData();

  if (isLoading) {
    return <LoadingState type="table" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <PerformanceDashboard data={data} />
  );
} 