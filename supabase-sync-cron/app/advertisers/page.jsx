'use client';

import MainLayout from '../../src/components/MainLayout';
import AdvertisersDashboard from '../../src/components/AdvertisersDashboard';

export default function AdvertisersPage() {
  const breadcrumbs = [
    { name: 'Anunciantes', href: '/advertisers' }
  ];

  return (
    <MainLayout title="Painel por Anunciante" breadcrumbs={breadcrumbs}>
      <AdvertisersDashboard />
    </MainLayout>
  );
}