'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../src/components/MainLayout';
import { fetchPerformanceMetrics } from '../../src/services/performanceService';

export default function PerformancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado para métricas de leads
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
  
  // Estado para dados das campanhas
  const [campaignsData, setCampaignsData] = useState({
    campaigns: [],
    totalCampaigns: 0,
    activeCampaigns: 0
  });
  
  const [loading, setLoading] = useState(false);

  const breadcrumbs = [
    { name: 'Performance', href: '/performance' }
  ];

  // Função para calcular métricas baseadas nos dados reais
  const calculateMetrics = (campaigns, period) => {
    if (!campaigns || campaigns.length === 0) {
      return {
        results: 0,
        costPerResult: 0,
        amountSpent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        conversionRate: 0
      };
    }

    // Filtrar apenas campanhas ativas
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
    
    // Calcular o budget total das campanhas ativas
    let totalBudget = 0;
    let totalAdsets = 0;
    let totalAds = 0;

    activeCampaigns.forEach(campaign => {
      if (campaign.adsets && Array.isArray(campaign.adsets)) {
        totalAdsets += campaign.adsets.length;
        
        campaign.adsets.forEach(adset => {
          // Somar budgets (considerando que podem estar em centavos)
          const dailyBudget = parseFloat(adset.daily_budget || 0);
          const lifetimeBudget = parseFloat(adset.lifetime_budget || 0);
          const budget = Math.max(dailyBudget, lifetimeBudget) / 100; // Converter de centavos para reais
          totalBudget += budget;
          
          // Contar ads
          if (adset.ads && Array.isArray(adset.ads)) {
            totalAds += adset.ads.length;
          }
        });
      }
    });

    // Ajustar o budget baseado no período selecionado
    const dayMultiplier = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const adjustedBudget = totalBudget * (dayMultiplier / 30); // Assumindo budget mensal

    // Calcular métricas estimadas (você pode ajustar essas fórmulas)
    const estimatedImpressions = totalAds * 5000 * (dayMultiplier / 30);
    const estimatedClicks = estimatedImpressions * 0.03; // CTR de 3%
    const estimatedLeads = estimatedClicks * 0.10; // Taxa de conversão de 10%
    const costPerLead = estimatedLeads > 0 ? adjustedBudget / estimatedLeads : 0;
    const cpm = estimatedImpressions > 0 ? (adjustedBudget / estimatedImpressions) * 1000 : 0;

    return {
      results: Math.round(estimatedLeads),
      costPerResult: costPerLead,
      amountSpent: adjustedBudget,
      impressions: Math.round(estimatedImpressions),
      clicks: Math.round(estimatedClicks),
      ctr: 3.0,
      cpm: cpm,
      conversionRate: 10.0
    };
  };

  // Função para carregar dados
  const loadData = async (period) => {
    console.log('🔍 Carregando dados para período:', period);
    setLoading(true);
    
    try {
      // Buscar dados das campanhas
      const data = await fetchPerformanceMetrics({});
      console.log('📊 Dados recebidos:', data);
      
      if (data && data.campaigns) {
        // Calcular métricas baseadas nos dados reais
        const calculatedMetrics = calculateMetrics(data.campaigns, period);
        setMetrics(calculatedMetrics);
        
        // Atualizar dados das campanhas
        setCampaignsData({
          campaigns: data.campaigns,
          totalCampaigns: data.metrics?.totalCampaigns || data.campaigns.length,
          activeCampaigns: data.metrics?.activeCampaigns || data.campaigns.filter(c => c.status === 'ACTIVE').length
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      // Definir valores padrão em caso de erro
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
  };

  // Função para mudar período
  const handleFilterClick = (preset) => {
    console.log('🎯 Filtro clicado:', preset);
    
    // Atualizar URL com o novo período
    const newUrl = `${window.location.pathname}?period=${preset}`;
    window.history.pushState({}, '', newUrl);
    
    // Recarregar dados para o novo período
    loadData(preset);
  };

  // Obter período atual da URL
  const currentPeriod = searchParams.get('period') || '30d';

  // Carregar dados quando o componente monta ou quando o período muda
  useEffect(() => {
    loadData(currentPeriod);
  }, [currentPeriod]);

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
    <MainLayout title="Dashboard de Performance" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header com filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Performance</h2>
            <p className="text-sm text-gray-500">
              Filtro ativo: <strong>{currentPeriod}</strong> | 
              Total de campanhas: <strong>{campaignsData.totalCampaigns}</strong> | 
              Ativas: <strong>{campaignsData.activeCampaigns}</strong>
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleFilterClick('7d')}
              disabled={loading}
              className={`px-4 py-2 rounded transition-colors ${
                currentPeriod === '7d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              7 dias
            </button>
            <button 
              onClick={() => handleFilterClick('30d')}
              disabled={loading}
              className={`px-4 py-2 rounded transition-colors ${
                currentPeriod === '30d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              30 dias
            </button>
            <button 
              onClick={() => handleFilterClick('90d')}
              disabled={loading}
              className={`px-4 py-2 rounded transition-colors ${
                currentPeriod === '90d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              90 dias
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        )}

        {/* Métricas principais */}
        {!loading && (
          <>
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
        <div className="bg-gray-100 rounded-lg p-4 text-sm">
          <p><strong>Status:</strong> ✅ Dashboard carregado!</p>
          <p><strong>Filtro atual:</strong> {currentPeriod}</p>
          <p><strong>Leads:</strong> {formatNumber(metrics.results)}</p>
          <p><strong>Investimento:</strong> {formatCurrency(metrics.amountSpent)}</p>
          <p><strong>Campanhas totais:</strong> {campaignsData.totalCampaigns}</p>
          <p><strong>Campanhas ativas:</strong> {campaignsData.activeCampaigns}</p>
        </div>
      </div>
    </MainLayout>
  );
}