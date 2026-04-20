'use client';

import React from 'react';
import MainLayout from '../../../src/components/MainLayout';
import RecommendationsPanel from '../../../src/components/recommendations/RecommendationsPanel';

export default function RecomendacoesPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Recomendações', href: '/dashboard/recomendacoes' },
  ];

  return (
    <MainLayout title="Recomendações" breadcrumbs={breadcrumbs}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Recomendações</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          Sugestões com base nos últimos 7 dias e nas metas do período. Aplicação manual — nada é alterado na
          Meta sem o seu processo interno após registrar a decisão aqui.
        </p>
      </div>
      <RecommendationsPanel />
    </MainLayout>
  );
}
