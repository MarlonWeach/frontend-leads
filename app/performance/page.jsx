'use client';

import MainLayout from '../../src/components/MainLayout';
import PerformanceDashboard from '../../src/components/PerformanceDashboardNew';

export default function PerformancePage() {
  const breadcrumbs = [
    { name: 'Performance', href: '/performance' }
  ];

  return (
    <MainLayout title="Dashboard de Performance" breadcrumbs={breadcrumbs}>
      <PerformanceDashboard />
    </MainLayout>
  );
}