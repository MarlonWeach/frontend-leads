'use client';
import ChartsDemo from '../src/components/ui/ChartsDemo';
import MainLayout from '../src/components/MainLayout';

export default function ChartsPage() {
  const breadcrumbs = [
    { name: 'Gráficos', href: '/charts' }
  ];

  return (
    <MainLayout title="Gráficos" breadcrumbs={breadcrumbs}>
      <ChartsDemo />
    </MainLayout>
  );
} 