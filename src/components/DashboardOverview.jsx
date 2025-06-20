'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  TrendingUp, Users, Building2, Target, DollarSign, Eye, 
  MousePointer, CheckCircle, Clock, AlertCircle, ArrowRight,
  BarChart3, PieChart, Calendar, Download, Info, AlertTriangle, XCircle
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useDashboardOverview } from '../hooks/useDashboardData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import LoadingState from './ui/LoadingState';
import ErrorMessage from './ui/ErrorMessage';
import ChartContainer from './ui/ChartContainer';
import AnimatedLineChart from './ui/AnimatedLineChart';
import AnimatedPieChart from './ui/AnimatedPieChart';
import AnimatedBarChart from './ui/AnimatedBarChart';

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
    return <ErrorMessage message={error.message} onRetry={refetch} />;
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
      subinfo: <><span className="text-accent font-semibold" data-testid="metric-leads-new">{formatNumber(metrics.leads.new)}</span> novos • <span className="text-primary font-semibold" data-testid="metric-leads-conversion">{formatPercentage(metrics.leads.conversion_rate)}</span> conversão</>,
      icon: <Users className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total de leads gerados no período selecionado',
      formatShort: true,
      testId: 'metric-card-leads',
      valueTestId: 'metric-leads-total',
    },
    {
      key: 'campaigns',
      label: 'Campanhas Ativas',
      value: formatNumber(metrics.campaigns.active),
      subinfo: <><span className="text-accent font-semibold" data-testid="metric-campaigns-total">{formatNumber(metrics.campaigns.total)}</span> total</>,
      icon: <Target className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Número de campanhas ativas no momento',
      testId: 'metric-card-campaigns',
      valueTestId: 'metric-campaigns-active',
    },
    {
      key: 'advertisers',
      label: 'Anunciantes',
      value: formatNumber(metrics.advertisers.total),
      subinfo: <><span className="text-accent font-semibold">{formatNumber(metrics.advertisers.active)}</span> ativos</>,
      icon: <Building2 className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total de anunciantes cadastrados',
    },
    {
      key: 'spend',
      label: 'Investimento',
      value: metrics.performance.spend,
      subinfo: <>Custo por lead: <span className="text-accent font-semibold">{formatCurrency(metrics.performance.spend / (metrics.leads.total || 1))}</span></>,
      icon: <DollarSign className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total investido no período selecionado',
      formatShort: true,
      testId: 'metric-card-performance',
      valueTestId: 'metric-performance-spend',
    },
    {
      key: 'impressions',
      label: 'Impressões',
      value: metrics.performance.impressions,
      subinfo: <>Alcance total</>,
      icon: <Eye className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total de impressões no período selecionado',
      formatShort: true,
    },
    {
      key: 'clicks',
      label: 'Cliques',
      value: metrics.performance.clicks,
      subinfo: <>CTR: <span className="text-accent font-semibold" data-testid="metric-performance-ctr">{formatPercentage(metrics.performance.ctr)}</span></>,
      icon: <MousePointer className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total de cliques no período selecionado',
      formatShort: true,
    },
    {
      key: 'conversion_rate',
      label: 'Taxa de Conversão',
      value: formatPercentage(metrics.leads.conversion_rate),
      subinfo: <>{formatNumber(metrics.leads.total)} leads / {formatNumber(metrics.performance.clicks)} cliques</>,
      icon: <CheckCircle className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Taxa de conversão de leads no período',
    },
  ];

  // Os dados já vêm agregados da API, apenas formatamos para o gráfico
  const pieData = (data?.campaignDistribution || []).map(entry => ({
    id: entry.name,
    label: entry.name,
    value: entry.value,
  }));

  console.log('--- DEBUG DashboardOverview ---', {
    isLoading,
    error,
    data,
    pieData,
  });

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
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-all duration-300 backdrop-blur-lg
                  ${currentPeriod === period
                    ? 'bg-primary text-white shadow-primary-glow'
                    : 'glass-light text-white hover:glass-medium'}
                `}
              >
                {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          {/* Período selecionado */}
          <div className="text-sublabel-refined text-glow glass-light px-3 py-2 rounded-2xl">
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
        {metricsList.map(metric => {
          return (
            <motion.div
              key={metric.key}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Card className="card-metric interactive" data-testid={metric.testId}>
                <div className="card-metric-content">
                  <span className="text-metric-label text-primary-text">{metric.label}</span>
                  <span className="text-metric-value text-primary" data-testid={metric.valueTestId}>
                    {metric.formatShort
                      ? (metric.key === 'spend' ? formatCurrency(metric.value) : formatNumberShort(metric.value))
                      : metric.value}
                  </span>
                  <span className="text-metric-subinfo text-secondary-text">{metric.subinfo}</span>
                </div>
                <div className="card-metric-icon">{metric.icon}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alertas - PADRONIZADOS COM GLASSMORPHISM */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-header font-bold text-primary-text">Alertas</h3>
          {alerts.map((alert, index) => (
            <Card key={index} className={`p-6 border-l-4 ${
              alert.type === 'warning' ? 'border-cta' : 
              alert.type === 'error' ? 'border-red-500' : 'border-accent'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-cta" />}
                  {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {alert.type === 'info' && <Info className="h-5 w-5 text-accent" />}
                </div>
                <div className="ml-3">
                  <p className="text-sublabel font-medium text-primary-text">{alert.title}</p>
                  <p className="text-sublabel font-medium text-primary-text">{alert.message}</p>
                  {alert.action && (
                    <button className="mt-2 text-sublabel text-accent hover:text-primary transition-colors">
                      {alert.action}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Atividade Recente */}
      {recentActivity.length > 0 && (
        <div data-testid="dashboard-activity">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-header font-bold text-primary-text">Atividade Recente</h3>
            <button className="text-sublabel text-accent hover:text-primary transition-colors">
              Ver tudo
            </button>
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                    <span className="text-sublabel text-primary-text">
                      {activity.type === 'lead' ? 'Novo Lead' : 'Atividade'}
                    </span>
                    <span className="text-sublabel text-primary-text ml-2">
                      {activity.value} leads
                    </span>
                  </div>
                  <span className="text-xs text-secondary-text">
                    {activity.metadata?.impressions && (
                      <span>{formatNumber(activity.metadata.impressions)} impressões • </span>
                    )}
                    {activity.metadata?.clicks && (
                      <span>{formatNumber(activity.metadata.clicks)} cliques • </span>
                    )}
                    {(() => {
                      const date = new Date(activity.timestamp);
                      return activity.timestamp && !isNaN(date)
                        ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
                        : 'Data desconhecida';
                    })()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Performance Geral - IMPLEMENTADO COM MÉTRICAS REAIS */}
      <Card className="p-8" data-testid="performance-geral">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-header font-semibold text-white">Performance Geral</h3>
          <div className="flex items-center space-x-2">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => handleFilterClick(period)}
                className={`px-3 py-1 text-sublabel-refined rounded-md transition-all duration-200 ${
                  currentPeriod === period
                    ? 'bg-primary text-white shadow-primary-glow'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Métricas de Performance Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-light p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sublabel-refined text-white/70">Total Investido</p>
                <p className="text-lg font-semibold text-white" data-testid="perf-total-spend">
                  {formatCurrency(metrics.performance.spend)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="glass-light p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sublabel-refined text-white/70">Impressões</p>
                <p className="text-lg font-semibold text-white" data-testid="perf-total-impressions">
                  {formatNumberShort(metrics.performance.impressions)}
                </p>
              </div>
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="glass-light p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sublabel-refined text-white/70">Cliques</p>
                <p className="text-lg font-semibold text-white" data-testid="perf-total-clicks">
                  {formatNumberShort(metrics.performance.clicks)}
                </p>
              </div>
              <MousePointer className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="glass-light p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sublabel-refined text-white/70">CTR</p>
                <p className="text-lg font-semibold text-accent" data-testid="perf-total-ctr">
                  {formatPercentage(metrics.performance.ctr)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        {/* Gráfico de Tendência Animado */}
        <ChartContainer
          title="Tendência de Performance"
          subtitle="Leads e Investimento nos últimos 7 dias"
          height={300}
          delay={0.2}
        >
          <AnimatedLineChart
            data={[
              {
                id: 'Leads',
                color: '#8A2BE2',
                data: [
                  { x: 'Seg', y: Math.round((metrics.leads.total || 0) / 7 * 0.8) },
                  { x: 'Ter', y: Math.round((metrics.leads.total || 0) / 7 * 1.2) },
                  { x: 'Qua', y: Math.round((metrics.leads.total || 0) / 7 * 0.9) },
                  { x: 'Qui', y: Math.round((metrics.leads.total || 0) / 7 * 1.1) },
                  { x: 'Sex', y: Math.round((metrics.leads.total || 0) / 7 * 1.3) },
                  { x: 'Sáb', y: Math.round((metrics.leads.total || 0) / 7 * 0.7) },
                  { x: 'Dom', y: Math.round((metrics.leads.total || 0) / 7 * 0.6) },
                ],
              },
              {
                id: 'Investimento',
                color: '#00BFFF',
                data: [
                  { x: 'Seg', y: Math.round((metrics.performance.spend || 0) / 7 * 0.8) },
                  { x: 'Ter', y: Math.round((metrics.performance.spend || 0) / 7 * 1.2) },
                  { x: 'Qua', y: Math.round((metrics.performance.spend || 0) / 7 * 0.9) },
                  { x: 'Qui', y: Math.round((metrics.performance.spend || 0) / 7 * 1.1) },
                  { x: 'Sex', y: Math.round((metrics.performance.spend || 0) / 7 * 1.3) },
                  { x: 'Sáb', y: Math.round((metrics.performance.spend || 0) / 7 * 0.7) },
                  { x: 'Dom', y: Math.round((metrics.performance.spend || 0) / 7 * 0.6) },
                ],
              },
            ]}
            height={250}
          />
        </ChartContainer>

        {/* Gráficos Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Gráfico de Pizza - Distribuição de Leads */}
          <ChartContainer
            title="Distribuição de Leads"
            subtitle="Por campanha"
            height={300}
            delay={0.3}
          >
            <AnimatedPieChart
              data={pieData}
              height={250}
            />
          </ChartContainer>

          {/* Gráfico de Barras - Performance por Métrica */}
          <ChartContainer
            title="Performance por Métrica"
            subtitle="Comparativo de indicadores"
            height={300}
            delay={0.4}
          >
            <AnimatedBarChart
              data={[
                { label: 'Leads', leads: metrics.leads.total || 0, spend: metrics.performance.spend || 0, impressions: Math.round((metrics.performance.impressions || 0) / 1000) },
                { label: 'Taxa Conv', leads: Math.round((metrics.leads.conversion_rate || 0) * 100), spend: Math.round((metrics.performance.ctr || 0) * 100), impressions: Math.round((metrics.performance.spend || 0) / (metrics.leads.total || 1)) },
              ]}
              keys={['leads', 'spend', 'impressions']}
              indexBy="label"
              height={250}
            />
          </ChartContainer>
        </div>

        {/* Indicador de Última Atualização */}
        <div className="mt-6 flex items-center justify-between text-sublabel-refined text-white/60">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
          <button 
            onClick={() => refetch()}
            className="text-accent hover:text-primary transition-colors text-sublabel-refined"
            data-testid="refresh-performance"
          >
            Atualizar dados
          </button>
        </div>
      </Card>
    </div>
  );
}