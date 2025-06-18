import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(() => import('./DashboardOverview'), {
  ssr: false,
});

export default DashboardOverview;

// Exemplo de aplicação para painel de overview do cliente:
<div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col items-center">
  <div className="text-title font-bold text-mint mb-4">Resumo do Cliente</div>
  {/* Conteúdo do painel */}
</div> 