'use client';

import MainLayout from '../../src/components/MainLayout';
import DashboardOverview from '../../src/components/DashboardOverview';

export default function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <DashboardOverview />
    </MainLayout>
  );
}