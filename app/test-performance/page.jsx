'use client';

import { usePerformanceData } from '../../src/hooks/usePerformanceData';

export default function TestPerformancePage() {
  const {
    data,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    goToPage,
    hasData,
    isEmpty,
    refresh
  } = usePerformanceData({
    initialFilters: {
      status: 'ACTIVE',
      limit: 5
    }
  });

  console.log('Componente: Estados atuais:', {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    filters
  });

  if (loading) {
    return <div>Carregando dados de performance...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (isEmpty) {
    return <div>Nenhum dado encontrado</div>;
  }

  const campaigns = data?.campaigns || [];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Teste do Hook usePerformanceData</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Estados de Debug</h3>
        <p>Loading: {loading ? 'Sim' : 'Não'}</p>
        <p>Error: {error || 'Nenhum'}</p>
        <p>HasData: {hasData ? 'Sim' : 'Não'}</p>
        <p>IsEmpty: {isEmpty ? 'Sim' : 'Não'}</p>
        <p>Data: {data ? 'Presente' : 'Nulo'}</p>
        <p>Campaigns: {campaigns.length}</p>
        <p>Data completo: {JSON.stringify(data, null, 2)}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Filtros Atuais</h3>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Paginação</h3>
        <pre>{JSON.stringify(pagination, null, 2)}</pre>
        <button onClick={() => goToPage(1)}>Página 1</button>
        <button onClick={() => goToPage(2)}>Página 2</button>
        <button onClick={refresh}>Refresh</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Métricas</h3>
        {data?.metrics && (
          <div>
            <p>Total de Leads: {data.metrics.totalLeads}</p>
            <p>Total de Gastos: R$ {data.metrics.totalSpend.toLocaleString('pt-BR')}</p>
            <p>CTR Médio: {data.metrics.averageCTR}%</p>
            <p>CPL Médio: R$ {data.metrics.averageCPL.toLocaleString('pt-BR')}</p>
            <p>ROI Médio: {data.metrics.averageROI}%</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Campanhas ({campaigns.length})</h3>
        {campaigns.map((campaign) => (
          <div key={campaign.campaign_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
            <h4>{campaign.campaign_name}</h4>
            <p>Status: {campaign.status}</p>
            <p>Leads: {campaign.leads}</p>
            <p>Gasto: R$ {campaign.spend.toLocaleString('pt-BR')}</p>
            <p>CTR: {campaign.ctr}%</p>
            <p>CPL: R$ {campaign.cpl.toLocaleString('pt-BR')}</p>
            <p>ROI: {campaign.roi}%</p>
            <p>Período: {campaign.data_start_date} a {campaign.data_end_date}</p>
          </div>
        ))}
      </div>

      <div>
        <h3>Controles</h3>
        <button onClick={() => setFilters({ status: 'ACTIVE' })}>
          Apenas Ativas
        </button>
        <button onClick={() => setFilters({ status: 'PAUSED' })}>
          Apenas Pausadas
        </button>
        <button onClick={() => setFilters({ sortBy: 'leads', sortOrder: 'desc' })}>
          Ordenar por Leads (Dec)
        </button>
        <button onClick={() => setFilters({ sortBy: 'spend', sortOrder: 'desc' })}>
          Ordenar por Gasto (Dec)
        </button>
      </div>
    </div>
  );
} 