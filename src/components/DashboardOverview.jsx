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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card backdrop-blur-lg p-6 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-white/30 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, refetch }) {
  return (
    <div data-testid="error-message" className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <AlertCircle className="h-12 w-12 text-electric" />
      <h2 className="text-header text-white">Ops! Algo deu errado</h2>
      <p className="text-sublabel-refined text-glow">{error?.message || 'Erro ao carregar dados do dashboard'}</p>
      <button
        data-testid="retry-button"
        onClick={() => refetch()}
        className="px-4 py-2 bg-electric text-background rounded-2xl hover:bg-violet transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// Utilitário para abreviar números grandes
function formatNumberShort(num) {
  if (num === null || num === undefined) return '';
  if (typeof num === 'string') num = Number(num.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '';
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString('pt-BR');
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

  // Lista de métricas para exibir nos cards
  const metricsList = [
    {
      key: 'leads',
      label: 'Total de Leads',
      value: formatNumber(metrics.leads.total),
      subinfo: <><span className="text-electric font-semibold">{formatNumber(metrics.leads.new)}</span> novos • <span className="text-violet font-semibold">{formatPercentage(metrics.leads.conversion_rate)}</span> conversão</>,
      icon: <Users className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Total de leads gerados no período selecionado',
      formatShort: true,
    },
    {
      key: 'campaigns',
      label: 'Campanhas Ativas',
      value: formatNumber(metrics.campaigns.active),
      subinfo: <><span className="text-electric font-semibold">{formatNumber(metrics.campaigns.total)}</span> total</>,
      icon: <Target className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Número de campanhas ativas no momento',
    },
    {
      key: 'advertisers',
      label: 'Anunciantes',
      value: formatNumber(metrics.advertisers.total),
      subinfo: <><span className="text-electric font-semibold">{formatNumber(metrics.advertisers.active)}</span> ativos</>,
      icon: <Building2 className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Total de anunciantes cadastrados',
    },
    {
      key: 'spend',
      label: 'Investimento',
      value: metrics.performance.spend,
      subinfo: <>Custo por lead: <span className="text-electric font-semibold">{formatCurrency(metrics.performance.spend / (metrics.leads.total || 1))}</span></>,
      icon: <DollarSign className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Total investido no período selecionado',
      formatShort: true,
    },
    {
      key: 'impressions',
      label: 'Impressões',
      value: formatNumber(metrics.performance.impressions),
      subinfo: <>Alcance total</>,
      icon: <Eye className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Total de impressões no período selecionado',
      formatShort: true,
    },
    {
      key: 'clicks',
      label: 'Cliques',
      value: formatNumber(metrics.performance.clicks),
      subinfo: <>CTR: <span className="text-electric font-semibold">{formatPercentage(metrics.performance.ctr)}</span></>,
      icon: <MousePointer className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Total de cliques no período selecionado',
      formatShort: true,
    },
    {
      key: 'conversion_rate',
      label: 'Taxa de Conversão',
      value: formatPercentage(metrics.leads.conversion_rate),
      subinfo: <>{formatNumber(metrics.leads.total)} leads / {formatNumber(metrics.performance.clicks)} cliques</>,
      icon: <CheckCircle className="h-7 w-7 text-violet mt-2 self-end" />,
      tooltip: 'Taxa de conversão de leads no período',
    },
  ];

  return (
    <div data-testid="dashboard-overview" className="space-y-8">
      {/* Filtros de período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => handleFilterClick(period)}
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-colors shadow-glass backdrop-blur-lg
                  ${currentPeriod === period
                    ? 'bg-electric text-background'
                    : 'glass-card text-white hover:bg-white/10'}
                `}
              >
                {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          {/* Período selecionado */}
          <div className="text-sublabel-refined text-glow glass-card px-3 py-2 rounded-2xl shadow-glass backdrop-blur-lg">
            <span className="font-medium text-white">Período:</span> {
              dateFrom && dateTo 
                ? `${new Date(dateFrom).toLocaleDateString('pt-BR')} a ${new Date(dateTo).toLocaleDateString('pt-BR')}`
                : 'Últimos 30 dias'
            }
          </div>
        </div>
        <div className="text-sublabel-refined text-white/70">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Métricas principais */}
      <div data-testid="metrics-summary" className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] auto-rows-fr">
        {metricsList.map(metric => (
          <div key={metric.key} className="glass-card p-6 flex flex-col justify-between items-center min-h-[180px]">
            <div className="flex flex-col gap-y-2 flex-1 items-center w-full">
              <span className="text-sublabel-refined text-white/80 text-center w-full">{metric.label}</span>
              <span className="text-[clamp(1.2rem,2vw,2rem)] font-bold text-violet text-center w-full">
                {metric.formatShort
                  ? (metric.key === 'spend' ? `R$ ${formatNumberShort(metric.value)}` : formatNumberShort(metric.value))
                  : metric.value}
              </span>
              <span className="text-xs text-electric/80 mt-1 text-center w-full">{metric.subinfo}</span>
            </div>
            <div className="mt-2">{metric.icon}</div>
          </div>
        ))}
      </div>

      {/* Alertas - PADRONIZADOS COM GLASSMORPHISM */}
      {alerts.length > 0 && (
        <div className="space-y-6">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="glass-card backdrop-blur-lg p-6"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {alert.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-violet" />
                  ) : (
                    <Info className="h-5 w-5 text-electric" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sublabel-refined font-medium text-white">{alert.title}</h3>
                  <div className="mt-2 text-sublabel-refined text-white/80">
                    <p>{alert.message}</p>
                  </div>
                  {alert.action && (
                    <div className="mt-4">
                      <a
                        href={alert.href}
                        className="text-sublabel-refined font-medium text-electric hover:text-violet transition-colors"
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

      {/* Atividade Recente - PADRONIZADA COM GLASSMORPHISM */}
      {recentActivity.length > 0 && (
        <div data-testid="dashboard-activity" className="glass-card backdrop-blur-lg p-8">
          <h2 className="text-header font-medium text-white mb-6">Atividade Recente</h2>
          <div className="space-y-6">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-white/20 last:border-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {activity.type === 'lead' ? (
                      <Users className="h-5 w-5 text-electric" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-electric" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sublabel-refined font-medium text-white">
                      {activity.type === 'lead' ? 'Novo Lead' : 'Investimento'}
                    </p>
                    <p className="text-xs text-white/70">
                      {new Date(activity.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sublabel-refined font-medium text-white">
                    {activity.type === 'lead' 
                      ? `${formatNumber(activity.value)} leads`
                      : formatCurrency(activity.value)
                    }
                  </p>
                  {activity.metadata && (
                    <p className="text-xs text-white/70">
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

      {/* Vendas Recentes (simulado) - PADRONIZADO COM GLASSMORPHISM */}
      <div data-testid="dashboard-recent-sales" className="glass-card backdrop-blur-lg p-8">
        <h3 className="text-header font-semibold text-white mb-6">Vendas Recentes</h3>
        <div className="text-white/70">(Simulação para testes E2E)</div>
      </div>

      {/* Gráfico de performance rápida - PADRONIZADO COM GLASSMORPHISM */}
      <div className="glass-card backdrop-blur-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-header font-semibold text-white">Performance Geral</h3>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              7 dias
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-electric text-background rounded-md">
              30 dias
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              90 dias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}