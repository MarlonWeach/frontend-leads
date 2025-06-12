'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../src/components/MainLayout';

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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [metrics, setMetrics] = useState({
    leads: { total: 0, new: 0, converted: 0, conversion_rate: 0 },
    performance: { spend: 0, impressions: 0, clicks: 0, ctr: 0 },
    campaigns: { total: 0, active: 0 },
    advertisers: { total: 0, active: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' }
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
      // Calcular datas baseadas no período, garantindo UTC
      const now = new Date();
      const currentYear = now.getUTCFullYear(); 
      const currentMonth = now.getUTCMonth();
      const currentDay = now.getUTCDate();

      // endDate será o início do dia seguinte (UTC)
      let endDate = new Date(Date.UTC(currentYear, currentMonth, currentDay + 1, 0, 0, 0, 0));
      let startDate = new Date(endDate); // Começa a partir do início do dia seguinte
      
      switch (period) {
        case '7d':
          startDate.setUTCDate(endDate.getUTCDate() - 7); // Retrocede 7 dias do início do dia seguinte
          break;
        case '30d':
          startDate.setUTCDate(endDate.getUTCDate() - 30); // Retrocede 30 dias
          break;
        case '90d':
          startDate.setUTCDate(endDate.getUTCDate() - 90); // Retrocede 90 dias
          break;
        default:
          startDate.setUTCDate(endDate.getUTCDate() - 30); // Padrão 30 dias
      }

      // startDate já estará em 00:00:00.000Z devido à forma como foi derivado

      console.log('Frontend: Enviando requisição com date_from:', startDate.toISOString(), 'e date_to:', endDate.toISOString());

      // Buscar dados do dashboard
      const response = await fetch(`/api/dashboard/overview?date_from=${startDate.toISOString()}&date_to=${endDate.toISOString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar dados do dashboard');
      }

      setMetrics(data.metrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError({
        message: error.message || 'Erro ao carregar dados. Tente novamente mais tarde.',
        code: error.code || 'UNKNOWN_ERROR'
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

  return (
    <MainLayout title="Dashboard" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header com filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500">
              Status: <strong>
                {connectionStatus === 'checking' ? '🔄 Verificando conexão...' :
                 connectionStatus === 'connected' ? '✅ Conectado' :
                 '❌ Erro de conexão'}
              </strong>
              {connectionStatus === 'connected' && (
                <>
                  | Filtro ativo: <strong>{currentPeriod}</strong> | 
                  Total de campanhas: <strong>{metrics.campaigns.total}</strong> | 
                  Ativas: <strong>{metrics.campaigns.active}</strong>
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
                    <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.leads.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Novos Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.leads.new)}</p>
                    <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Valor Investido</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.performance.spend)}</p>
                    <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.leads.conversion_rate.toFixed(2)}%</p>
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
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.performance.impressions)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Cliques</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.performance.clicks)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">CTR</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.performance.ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">CPM</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.performance.impressions > 0 
                        ? (metrics.performance.spend / metrics.performance.impressions) * 1000 
                        : 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Ver Dashboard Completo */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.push('/performance')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Dashboard Completo
              </button>
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