'use client';

import MainLayout from '../../src/components/MainLayout';
import LeadsDashboard from '../../src/components/LeadsDashboard';

export default function LeadsPage() {
  const breadcrumbs = [
    { name: 'Leads', href: '/leads' }
  ];

  return (
    <MainLayout title="Painel de Leads" breadcrumbs={breadcrumbs}>
      <LeadsDashboard />
    </MainLayout>
  );
}