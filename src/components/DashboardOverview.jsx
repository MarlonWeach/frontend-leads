'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  TrendingUp, Users, Building2, Target, DollarSign, Eye, 
  MousePointer, CheckCircle, Clock, AlertCircle, ArrowRight,
  BarChart3, PieChart, Calendar, Download, Info
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useDashboardOverview } from '../hooks/useDashboardData';

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, refetch }) {
  return (
    <div data-testid="error-message" className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold text-gray-900">Ops! Algo deu errado</h2>
      <p className="text-gray-600">{error?.message || 'Erro ao carregar dados do dashboard'}</p>
      <button
        data-testid="retry-button"
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState('30d');

  // Initialize dates from URL or set default
  useEffect(() => {
    const period = searchParams.get('period') || '30d';
    setCurrentPeriod(period);
    applyDateFilter(period);
  }, [searchParams]);

  const applyDateFilter = useCallback((period) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 6);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 29);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 89);
        break;
      default:
        startDate.setDate(endDate.getDate() - 29);
    }
    startDate.setHours(0, 0, 0, 0);

    setDateFrom(startDate.toISOString());
    setDateTo(endDate.toISOString());
  }, []);

  const handleFilterClick = useCallback((preset) => {
    setCurrentPeriod(preset);
    router.push(`/dashboard?period=${preset}`);
    applyDateFilter(preset);
  }, [router, applyDateFilter]);

  const { data, isLoading, error, refetch } = useDashboardOverview(dateFrom, dateTo);

  if (error) {
    return <ErrorState error={error} refetch={refetch} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const metrics = data?.metrics || {
    campaigns: { total: 0, active: 0 },
    leads: { total: 0, new: 0, converted: 0, conversion_rate: 0 },
    advertisers: { total: 0, active: 0 },
    performance: { spend: 0, impressions: 0, clicks: 0, ctr: 0 }
  };

  const recentActivity = data?.recentActivity || [];
  const alerts = data?.alerts || [];

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

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((value || 0) / 100);
  };

  return (
    <div data-testid="dashboard-overview" className="space-y-8">
      {/* Filtros de período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterClick('7d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentPeriod === '7d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => handleFilterClick('30d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentPeriod === '30d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => handleFilterClick('90d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentPeriod === '90d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              90 dias
            </button>
          </div>
          {/* Período selecionado */}
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
            <span className="font-medium">Período:</span> {
              dateFrom && dateTo 
                ? `${new Date(dateFrom).toLocaleDateString('pt-BR')} a ${new Date(dateTo).toLocaleDateString('pt-BR')}`
                : 'Últimos 30 dias'
            }
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Métricas principais */}
      <div data-testid="metrics-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        <div data-testid="metric-card-leads" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <Tooltip content="Total de leads gerados no período selecionado">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-leads-total" className="text-3xl font-bold text-gray-900">{formatNumber(metrics.leads.total)}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span data-testid="metric-leads-new">{formatNumber(metrics.leads.new)}</span> novos • <span data-testid="metric-leads-conversion">{formatPercentage(metrics.leads.conversion_rate)}</span> conversão
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-blue-500">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-campaigns" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
                <Tooltip content="Número de campanhas ativas no momento">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-campaigns-active" className="text-3xl font-bold text-gray-900">{formatNumber(metrics.campaigns.active)}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span data-testid="metric-campaigns-total">{formatNumber(metrics.campaigns.total)}</span> total
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-green-500">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-advertisers" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Anunciantes</p>
                <Tooltip content="Número de anunciantes ativos e total">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-advertisers-active" className="text-3xl font-bold text-gray-900">{formatNumber(metrics.advertisers.active)}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span data-testid="metric-advertisers-total">{formatNumber(metrics.advertisers.total)}</span> cadastrados
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-purple-500">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-performance" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Investimento</p>
                <Tooltip content="Valor total investido no período selecionado">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-performance-spend" className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.performance.spend)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Custo por lead: {formatCurrency(metrics.performance.spend / (metrics.leads.total || 1))}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-orange-500">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-impressions" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Impressões</p>
                <Tooltip content="Total de impressões no período selecionado">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-performance-impressions" className="text-3xl font-bold text-gray-900">{formatNumber(metrics.performance.impressions)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Alcance total
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-indigo-500">
              <Eye className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-clicks" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Cliques</p>
                <Tooltip content="Total de cliques no período selecionado">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-performance-clicks" className="text-3xl font-bold text-gray-900">{formatNumber(metrics.performance.clicks)}</p>
              <p className="text-xs text-gray-500 mt-1">
                CTR: <span data-testid="metric-performance-ctr-secondary">{formatPercentage(metrics.performance.ctr)}</span>
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-teal-500">
              <MousePointer className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div data-testid="metric-card-conversion-rate" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <Tooltip content="Taxa de conversão: leads / cliques">
                  <Info className="h-4 w-4 ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <p data-testid="metric-conversion-rate" className="text-3xl font-bold text-gray-900">{formatPercentage(metrics.leads.conversion_rate)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(metrics.leads.total)} leads / {formatNumber(metrics.performance.clicks)} cliques
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 text-emerald-500">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                alert.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {alert.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{alert.message}</p>
                  </div>
                  {alert.action && (
                    <div className="mt-4">
                      <a
                        href={alert.href}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {alert.action} <ArrowRight className="inline h-4 w-4 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Atividade Recente */}
      {recentActivity.length > 0 && (
        <div data-testid="dashboard-activity" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {activity.type === 'lead' ? (
                      <Users className="h-5 w-5 text-blue-500" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'lead' ? 'Novo Lead' : 'Investimento'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === 'lead' 
                      ? `${formatNumber(activity.value)} leads`
                      : formatCurrency(activity.value)
                    }
                  </p>
                  {activity.metadata && (
                    <p className="text-xs text-gray-500">
                      {activity.metadata.impressions && `${formatNumber(activity.metadata.impressions)} impressões`}
                      {activity.metadata.clicks && ` • ${formatNumber(activity.metadata.clicks)} cliques`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendas Recentes (simulado) */}
      <div data-testid="dashboard-recent-sales" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
        <div className="text-gray-500">(Simulação para testes E2E)</div>
      </div>

      {/* Gráfico de performance rápida */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Geral</h3>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
              7 dias
            </button>
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
              30 dias
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
              90 dias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}