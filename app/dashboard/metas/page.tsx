'use client';

// Page: /dashboard/metas
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import React from 'react';
import MainLayout from '@/components/MainLayout';
import AdsetGoalsOverview from '@/components/metas/AdsetGoalsOverview';

export default function MetasPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Metas', href: '/dashboard/metas' }
  ];

  return (
    <MainLayout title="Acompanhamento de Metas" breadcrumbs={breadcrumbs}>
      <AdsetGoalsOverview />
    </MainLayout>
  );
} 