'use client';

// Page: /metas — rota canônica do dashboard de metas (MainLayout aponta aqui).
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import React from 'react';
import MainLayout from '../../src/components/MainLayout';
import AdsetGoalsOverview from '../../src/components/metas/AdsetGoalsOverview';

export default function MetasPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Metas', href: '/metas' },
  ];

  return (
    <MainLayout title="Acompanhamento de Metas" breadcrumbs={breadcrumbs}>
      <AdsetGoalsOverview />
    </MainLayout>
  );
}
