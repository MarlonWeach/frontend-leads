'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../src/components/MainLayout';
import { fetchPerformanceMetrics } from '../../src/services/performanceService';
import { testConnection, supabase } from '../../src/lib/supabaseClient';

// Componente de erro
const ErrorMessage = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
        <p className="text-sm text-red-700 mt-1">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  </div>
);

// Componente de loading
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-32 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="text-sm text-gray-600">Carregando dados...</span>
  </div>
);

export default function PerformancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [metrics, setMetrics] = useState({
    results: 0,
    costPerResult: 0,
    amountSpent: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpm: 0,
    conversionRate: 0
  });
  
  const [campaignsData, setCampaignsData] = useState({
    campaigns: [],
    totalCampaigns: 0,
    activeCampaigns: 0
  });
  
  const [loading, setLoading] = useState(true); // Começa como true para testar conexão
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const breadcrumbs = [
    { name: 'Performance', href: '/performance' }
  ];

  // Função para testar conexão com Supabase
  const checkConnection = useCallback(async () => {
    try {
      console.log('🔍 Testando conexão com Supabase...');
      const isConnected = await testConnection();
      
      if (!isConnected) {
        throw new Error('Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.');
      }
      
      setConnectionStatus('connected');
      console.log('✅ Conexão com Supabase estabelecida!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      setConnectionStatus('error');
      setError({
        message: error.message || 'Erro ao conectar com o banco de dados',
        code: 'CONNECTION_ERROR'
      });
      return false;
    }
  }, []);

  // Função para buscar o total de leads, spend, impressions e clicks do Meta no período
  const fetchMetaMetrics = async (dateFrom, dateTo) => {
    const { data, error } = await supabase
      .from('meta_leads')
      .select('lead_count, spend, impressions, clicks')
      .gte('created_time', dateFrom.toISOString())
      .lte('created_time', dateTo.toISOString());

    if (error) {
      console.error('Erro ao buscar métricas do Meta:', error);
      return {
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0
      };
    }

    // Soma todos os registros
    return data.reduce((totals, record) => ({
      leads: totals.leads + (record.lead_count || 0),
      spend: totals.spend + parseFloat(record.spend || 0),
      impressions: totals.impressions + parseInt(record.impressions || 0),
      clicks: totals.clicks + parseInt(record.clicks || 0)
    }), {
      leads: 0,
      spend: 0,
      impressions: 0,
      clicks: 0
    });
  };

  // Função para carregar dados com tratamento de erro
  const loadData = useCallback(async (period) => {
    if (connectionStatus !== 'connected') {
      console.log('⚠️ Aguardando conexão com Supabase...');
      return;
    }

    console.log('🔍 Carregando dados para período:', period);
    setLoading(true);
    setError(null);
    
    try {
      // Calcular datas baseadas no período
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // Define para o final do dia

      const startDate = new Date(endDate); // Começa com a mesma data final
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 6); // Para incluir 7 dias (hoje + 6 dias anteriores)
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 29); // Para incluir 30 dias (hoje + 29 dias anteriores)
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 89); // Para incluir 90 dias (hoje + 89 dias anteriores)
          break;
        default:
          startDate.setDate(endDate.getDate() - 29); // Padrão 30 dias
      }

      startDate.setHours(0, 0, 0, 0); // Define para o início do dia

      // Buscar dados das campanhas
      const response = await fetchPerformanceMetrics({});
      // Buscar todas as métricas agregadas do Meta para o período
      const metaMetrics = await fetchMetaMetrics(startDate, endDate);
      
      // Verificar se houve erro na resposta
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      console.log('📊 Dados recebidos:', response);
      
      if (response.campaigns) {
        // Calcular métricas baseadas nos dados reais e as métricas do Meta
        const calculatedMetrics = calculateMetrics(response.campaigns, period, startDate, endDate, metaMetrics);
        setMetrics(calculatedMetrics);
        
        // Atualizar dados das campanhas
        setCampaignsData({
          campaigns: response.campaigns,
          totalCampaigns: response.metrics?.totalCampaigns || response.campaigns.length,
          activeCampaigns: response.metrics?.activeCampaigns || response.campaigns.filter(c => c.status === 'ACTIVE').length
        });

        // Atualizar timestamp
        setLastUpdate(new Date());
      } else {
        throw new Error('Nenhum dado recebido da API');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError({
        message: error.message || 'Erro ao carregar dados. Tente novamente mais tarde.',
        code: error.code || 'UNKNOWN_ERROR'
      });
      
      // Resetar métricas em caso de erro
      setMetrics({
        results: 0,
        costPerResult: 0,
        amountSpent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, [connectionStatus]);

  // Função para mudar período
  const handleFilterClick = useCallback((preset) => {
    console.log('🎯 Filtro clicado:', preset);
    
    // Atualizar URL com o novo período
    const newUrl = `${window.location.pathname}?period=${preset}`;
    window.history.pushState({}, '', newUrl);
    
    // Recarregar dados para o novo período
    loadData(preset);
  }, [loadData]);

  // Obter período atual da URL
  const currentPeriod = searchParams.get('period') || '30d';

  // Efeito para testar conexão ao montar o componente
  useEffect(() => {
    const init = async () => {
      const isConnected = await checkConnection();
      if (isConnected) {
        loadData(currentPeriod);
      }
    };
    
    init();
  }, [checkConnection, currentPeriod, loadData]);

  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
  };

  // Função para calcular métricas
  const calculateMetrics = useCallback((campaigns, period, dateFrom, dateTo, metaMetrics) => {
    // Se não há campanhas, mas há leads, ainda mostra o resultado de leads
    if (!campaigns || campaigns.length === 0) {
      return {
        results: metaMetrics.leads || 0,
        costPerResult: metaMetrics.leads > 0 ? metaMetrics.spend / metaMetrics.leads : 0,
        amountSpent: metaMetrics.spend,
        impressions: metaMetrics.impressions,
        clicks: metaMetrics.clicks,
        ctr: metaMetrics.impressions > 0 ? (metaMetrics.clicks / metaMetrics.impressions) * 100 : 0,
        cpm: metaMetrics.impressions > 0 ? (metaMetrics.spend / metaMetrics.impressions) * 1000 : 0,
        conversionRate: metaMetrics.clicks > 0 ? (metaMetrics.leads / metaMetrics.clicks) * 100 : 0
      };
    }

    try {
      // Use as métricas agregadas do Meta diretamente
      const totalSpend = metaMetrics.spend;
      const totalImpressions = metaMetrics.impressions;
      const totalClicks = metaMetrics.clicks;
      const leadsCount = metaMetrics.leads;

      // Calcule médias se necessário
      // Não precisamos mais iterar sobre adsets e ads para spend, impressions, clicks
      // totalCPC, totalCPM e totalCTR podem ser calculados a partir dos totais ou removidos se não forem mais relevantes.
      // No entanto, para manter a consistência, vamos recalculá-los a partir dos totais
      const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      // Calcular métricas de conversão usando o lead_count
      const conversionRate = totalClicks > 0 ? (leadsCount / totalClicks) * 100 : 0;
      const costPerLead = leadsCount > 0 ? totalSpend / leadsCount : 0;

      return {
        results: leadsCount,
        costPerResult: costPerLead,
        amountSpent: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: avgCTR,
        cpm: avgCPM,
        conversionRate: conversionRate
      };
    } catch (error) {
      console.error('❌ Erro ao calcular métricas:', error);
      return {
        results: metaMetrics.leads || 0,
        costPerResult: metaMetrics.leads > 0 ? metaMetrics.spend / metaMetrics.leads : 0,
        amountSpent: metaMetrics.spend,
        impressions: metaMetrics.impressions,
        clicks: metaMetrics.clicks,
        ctr: metaMetrics.impressions > 0 ? (metaMetrics.clicks / metaMetrics.impressions) * 100 : 0,
        cpm: metaMetrics.impressions > 0 ? (metaMetrics.spend / metaMetrics.impressions) * 1000 : 0,
        conversionRate: metaMetrics.clicks > 0 ? (metaMetrics.leads / metaMetrics.clicks) * 100 : 0
      };
    }
  }, []);

  return (
    <MainLayout title="Dashboard de Performance" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header com filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Performance</h2>
            <p className="text-sm text-gray-500">
              Status: <strong>
                {connectionStatus === 'checking' ? '🔄 Verificando conexão...' :
                 connectionStatus === 'connected' ? '✅ Conectado' :
                 '❌ Erro de conexão'}
              </strong>
              {connectionStatus === 'connected' && (
                <>
                  | Filtro ativo: <strong>{currentPeriod}</strong> | 
                  Total de campanhas: <strong>{campaignsData.totalCampaigns}</strong> | 
                  Ativas: <strong>{campaignsData.activeCampaigns}</strong>
                  {lastUpdate && (
                    <span className="ml-2">
                      | Última atualização: <strong>{new Date(lastUpdate).toLocaleTimeString('pt-BR')}</strong>
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((preset) => (
              <button 
                key={preset}
                onClick={() => handleFilterClick(preset)}
                disabled={loading}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPeriod === preset 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {preset === '7d' ? '7 dias' : preset === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem de erro de conexão */}
        {connectionStatus === 'error' && (
          <ErrorMessage 
            error={error} 
            onRetry={checkConnection}
          />
        )}

        {/* Loading */}
        {loading && <LoadingState />}

        {/* Conteúdo principal */}
        {connectionStatus === 'connected' && (
          <>
            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.results)}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimativa para {currentPeriod}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Custo por Lead</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.costPerResult)}</p>
                    <p className="text-xs text-gray-500 mt-1">Média do período</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Valor Investido</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.amountSpent)}</p>
                    <p className="text-xs text-gray-500 mt-1">Projeção para {currentPeriod}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.conversionRate.toFixed(2)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Cliques para leads</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas secundárias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Impressões</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.impressions)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Cliques</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.clicks)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">CTR</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">CPM</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.cpm)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Campanhas Ativas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">
                  Campanhas Ativas ({campaignsData.campaigns.filter(c => c.status === 'ACTIVE').length})
                </h3>
              </div>
              <div className="p-6">
                {campaignsData.campaigns.filter(c => c.status === 'ACTIVE').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma campanha ativa encontrada</p>
                ) : (
                  <div className="space-y-3">
                    {campaignsData.campaigns
                      .filter(campaign => campaign.status === 'ACTIVE')
                      .slice(0, 5)
                      .map((campaign) => {
                        const campaignBudget = campaign.adsets?.reduce((sum, adset) => {
                          const dailyBudget = parseFloat(adset.daily_budget || 0);
                          const lifetimeBudget = parseFloat(adset.lifetime_budget || 0);
                          return sum + Math.max(dailyBudget, lifetimeBudget) / 100;
                        }, 0) || 0;

                        return (
                          <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-gray-500">
                                {campaign.objective || 'Sem objetivo'} • 
                                Budget: {formatCurrency(campaignBudget)} • 
                                {campaign.adsets?.length || 0} adsets • 
                                {campaign.adsets?.reduce((sum, adset) => sum + (adset.ads?.length || 0), 0) || 0} ads
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              Ativo
                            </span>
                          </div>
                        );
                      })}
                    {campaignsData.campaigns.filter(c => c.status === 'ACTIVE').length > 5 && (
                      <p className="text-center text-sm text-gray-500 pt-2">
                        E mais {campaignsData.campaigns.filter(c => c.status === 'ACTIVE').length - 5} campanhas ativas...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4 text-sm">
            <p><strong>Status da Conexão:</strong> {connectionStatus}</p>
            <p><strong>Variáveis de Ambiente:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado'}</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}</li>
            </ul>
            {error && (
              <>
                <p><strong>Erro:</strong> {error.message}</p>
                <p><strong>Código:</strong> {error.code}</p>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}