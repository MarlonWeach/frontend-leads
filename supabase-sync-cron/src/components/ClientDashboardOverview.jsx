import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(() => import('./DashboardOverview'), {
  ssr: false,
});

export default DashboardOverview; 