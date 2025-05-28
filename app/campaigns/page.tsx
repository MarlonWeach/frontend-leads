'use client';

import MainLayout from '../../src/components/MainLayout';

export default function CampaignsPage() {
  const breadcrumbs = [
    { name: 'Campanhas', href: '/campaigns' }
  ];

  return (
    <MainLayout title="Gerenciar Campanhas" breadcrumbs={breadcrumbs}>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Campanhas</h2>
        <p className="text-gray-600 mb-6">Painel de campanhas será integrado aqui</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Ver Campanhas Existentes
        </button>
      </div>
    </MainLayout>
  );
}