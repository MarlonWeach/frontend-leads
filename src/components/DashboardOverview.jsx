'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCampaignsData } from '../hooks/useCampaignsData';
import { useMetaActivities } from '../hooks/useMetaActivities';
import { TrendingUp, Users, Target, DollarSign, Eye, MousePointer, CheckCircle, Clock, Layers, TrendingDown } from 'lucide-react';
import { Card } from './ui/card';
import LoadingState from './ui/LoadingState';
import ErrorMessage from './ui/ErrorMessage';
import ChartContainer from './ui/ChartContainer';
import AnimatedPieChart from './ui/AnimatedPieChart';
import AnimatedBarChart from './ui/AnimatedBarChart';
import Pagination from './ui/Pagination';

function formatNumberShort(num) {
  if (num === null || num === undefined) return '';
  if (typeof num === 'string') num = Number(num.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '';
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString('pt-BR');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatPercentage(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((value || 0) / 100);
}

const PERIODS = [
  { key: 'ontem', label: 'Ontem' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' }
];

const ALL_EVENT_TYPES = [
  "ad_account_billing_charge",
  "add_images",
  "create_ad",
  "create_ad_set",
  "edit_images",
  "first_delivery_event",
  "update_ad_creative",
  "update_ad_run_status",
  "update_ad_set_bid_strategy",
  "update_ad_set_budget",
  "update_ad_set_optimization_goal",
  "update_ad_set_run_status",
  "update_ad_set_target_spec",
  "update_campaign_budget",
  "update_campaign_run_status"
];

const EVENT_TYPE_LABELS = {
  ad_account_billing_charge: 'Cobrança/Billing',
  add_images: 'Adicionar Imagens',
  create_ad: 'Criar Anúncio',
  create_ad_set: 'Criar Adset',
  edit_images: 'Editar Imagens',
  first_delivery_event: 'Primeira Entrega',
  update_ad_creative: 'Atualizar Criativo',
  update_ad_run_status: 'Status do Anúncio',
  update_ad_set_bid_strategy: 'Estratégia de Lance',
  update_ad_set_budget: 'Orçamento do Adset',
  update_ad_set_optimization_goal: 'Meta de Otimização',
  update_ad_set_run_status: 'Status do Adset',
  update_ad_set_target_spec: 'Segmentação do Adset',
  update_campaign_budget: 'Orçamento da Campanha',
  update_campaign_run_status: 'Status da Campanha'
};

function getActivityMessage(activity) {
  switch (activity.event_type) {
    case 'update_campaign_run_status':
      return `Status da Campanha - ${activity.object_name || 'Campanha'} - ${activity.value_new || ''}`;
    case 'update_campaign_budget':
      return `Orçamento da Campanha - ${activity.object_name || 'Campanha'}${activity.value_new ? ` - ${activity.value_new}` : ''}`;
    case 'update_ad_set_run_status':
      return `Status do Adset - ${activity.object_name || 'Adset'} - ${activity.value_new || ''}`;
    case 'update_ad_set_budget':
      return `Orçamento do Adset - ${activity.object_name || 'Adset'}${activity.value_new ? ` - ${activity.value_new}` : ''}`;
    case 'update_ad_run_status':
      return `Status do Anúncio - ${activity.object_name || 'Anúncio'} - ${activity.value_new || ''}`;
    case 'update_ad_creative':
      return `Criativo do Anúncio Atualizado - ${activity.object_name || 'Anúncio'}`;
    case 'ad_account_billing_charge':
      return `Cobrança/Billing - ${activity.value_new || ''}`;
    case 'add_images':
      return `Imagens adicionadas - ${activity.object_name || ''}`;
    case 'edit_images':
      return `Imagens editadas - ${activity.object_name || ''}`;
    case 'create_ad':
      return `Anúncio criado - ${activity.object_name || ''}`;
    case 'create_ad_set':
      return `Adset criado - ${activity.object_name || ''}`;
    case 'update_ad_set_bid_strategy':
      return `Estratégia de Lance do Adset - ${activity.object_name || ''} - ${activity.value_new || ''}`;
    case 'update_ad_set_optimization_goal':
      return `Meta de Otimização do Adset - ${activity.object_name || ''} - ${activity.value_new || ''}`;
    case 'update_ad_set_target_spec':
      return `Segmentação do Adset - ${activity.object_name || ''}`;
    case 'first_delivery_event':
      return `Primeira Entrega - ${activity.object_name || ''}`;
    default:
      return `${EVENT_TYPE_LABELS[activity.event_type] || activity.event_type}${activity.object_name ? ' - ' + activity.object_name : ''}${activity.value_new ? ' - ' + activity.value_new : ''}`;
  }
}

export default function DashboardOverview() {
  const [period, setPeriod] = useState('7d');

  // Calcular datas de filtro
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate, endDate;
    endDate = now.toISOString().split('T')[0];
    if (period === 'ontem') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      startDate = y.toISOString().split('T')[0];
      endDate = startDate;
    } else if (period === '7d') {
      const w = new Date(now);
      w.setDate(now.getDate() - 6);
      startDate = w.toISOString().split('T')[0];
    } else {
      const m = new Date(now);
      m.setDate(now.getDate() - 29);
      startDate = m.toISOString().split('T')[0];
    }
    return { startDate, endDate };
  }, [period]);

  const { startDate, endDate } = getDateRange();
  const { campaigns, loading, error, refreshCampaigns } = useCampaignsData(startDate, endDate);

  // Métricas agregadas
  const metrics = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        total: 0,
        active: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        ctr: 0,
        cpl: 0
      };
    }
    const total = campaigns.length;
    const active = campaigns.filter(c => c.is_active).length;
    const spend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
    const impressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
    const clicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const leads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    return { total, active, spend, impressions, clicks, leads, ctr, cpl };
  }, [campaigns]);

  // Dados para gráficos
  const pieData = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.map(c => ({
      id: c.name,
      label: c.name,
      value: c.leads || 0
    })).filter(c => c.value > 0);
  }, [campaigns]);

  const barData = useMemo(() => [
    { label: 'Leads', leads: metrics.leads, spend: metrics.spend, impressions: Math.round(metrics.impressions / 1000) },
    { label: 'CTR', leads: Math.round(metrics.ctr * 100), spend: Math.round(metrics.ctr * 100), impressions: Math.round(metrics.spend / (metrics.leads || 1)) },
  ], [metrics]);

  // Estado para alertas
  const [alerts, setAlerts] = useState([]);

  // Filtro de tipos de atividade
  const [selectedTypes, setSelectedTypes] = useState(() =>
    ALL_EVENT_TYPES.filter(t => t !== 'ad_account_billing_charge')
  );

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Hook para logs de atividades da Meta (agora só do Supabase)
  const {
    activities: recentActivity,
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivities
  } = useMetaActivities({ limit: 50 });

  const filteredActivity = recentActivity.filter(a => selectedTypes.includes(a.event_type));

  // Estado para paginação da atividade
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);

  // Paginação dos logs filtrados
  const paginatedActivity = filteredActivity.slice(
    (activityPage - 1) * activityPageSize,
    activityPage * activityPageSize
  );
  const totalActivityPages = Math.ceil(filteredActivity.length / activityPageSize) || 1;

  // Resetar página ao filtrar
  useEffect(() => {
    setActivityPage(1);
  }, [filteredActivity, activityPageSize]);

  // Gerar alertas
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setAlerts([]);
      return;
    }
    
    // Exemplo: alerta se alguma campanha está com baixo desempenho
    const lowPerformance = campaigns.filter(c => Number(c.leads) < 5 && Number(c.spend) > 1000);
    const alertsArr = lowPerformance.length > 0 ? [{
      type: 'warning',
      title: 'Campanhas com poucos leads',
      message: `${lowPerformance.length} campanha(s) com menos de 5 leads e investimento acima de R$ 1.000`,
      action: 'Ver campanhas',
      href: '/campaigns?filter=low-leads'
    }] : [];
    setAlerts(alertsArr);
  }, [campaigns]);

  // Estado de loading/erro
  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error.message || error} onRetry={refreshCampaigns} />;

  // Debug removido
  return (
    <div data-testid="dashboard-overview" className="space-y-8">
      {/* Bloco de Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2" data-testid="dashboard-alerts">
          {alerts.map((alert, idx) => (
            <div key={idx} className="bg-yellow-900/30 border-l-4 border-yellow-500/60 p-4 rounded-lg flex items-center gap-4">
              <span className="text-yellow-400 font-bold">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-200">{alert.title}</div>
                <div className="text-yellow-100 text-sm">{alert.message}</div>
                {alert.action && alert.href && (
                  <a href={alert.href} className="text-blue-400 underline text-xs mt-1 inline-block">{alert.action}</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros de período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.key
                    ? 'bg-blue-600 text-white shadow-blue-500/20 shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Botão de atualizar dados */}
        <button onClick={refreshCampaigns} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-blue-500/20 shadow">
          Atualizar dados
        </button>
      </div>

      {/* Cards de métricas principais - Padrão idêntico à performance */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Campanhas Ativas */}
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20 hover:bg-blue-900/40 hover:border-blue-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-400 text-sm font-medium">Campanhas Ativas</div>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.active)}</div>
          <div className="text-xs text-white/60 mt-1">de {formatNumberShort(metrics.total)} total</div>
        </div>
        {/* Investimento Total */}
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/20 hover:bg-green-900/40 hover:border-green-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-400 text-sm font-medium">Investimento Total</div>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.spend)}</div>
          <div className="text-xs text-white/60 mt-1">CPL: {formatCurrency(metrics.cpl)}</div>
        </div>
        {/* Impressões */}
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20 hover:bg-purple-900/40 hover:border-purple-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-400 text-sm font-medium">Impressões</div>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.impressions)}</div>
          <div className="text-xs text-white/60 mt-1">CPM: {formatCurrency((metrics.spend / metrics.impressions) * 1000)}</div>
        </div>
        {/* Cliques */}
        <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/20 hover:bg-indigo-900/40 hover:border-indigo-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-indigo-400 text-sm font-medium">Cliques</div>
            <MousePointer className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.clicks)}</div>
          <div className="text-xs text-white/60 mt-1">CTR: {formatPercentage(metrics.ctr)}</div>
        </div>
      </div>
      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Leads */}
        <div className="bg-pink-900/30 rounded-lg p-4 border border-pink-500/20 hover:bg-pink-900/40 hover:border-pink-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-pink-400 text-sm font-medium">Leads Gerados</div>
            <Users className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.leads)}</div>
          <div className="text-xs text-white/60 mt-1">+15.3% vs período anterior</div>
        </div>
        {/* CTR */}
        <div className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-500/20 hover:bg-cyan-900/40 hover:border-cyan-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-cyan-400 text-sm font-medium">CTR Médio</div>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatPercentage(metrics.ctr)}</div>
          <div className="text-xs text-white/60 mt-1">+2.8% vs período anterior</div>
        </div>
        {/* CPL */}
        <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-500/20 hover:bg-orange-900/40 hover:border-orange-500/40 transition-all duration-300" tabIndex={0}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-orange-400 text-sm font-medium">CPL Médio</div>
            <Layers className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics.cpl)}</div>
          <div className="text-xs text-white/60 mt-1">-5.2% vs período anterior</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Distribuição de Leads por Campanha */}
        <Card className="p-6 glass-card border border-white/10 shadow-glass-light">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Leads por Campanha</h3>
          <ChartContainer>
            <AnimatedPieChart data={pieData} />
          </ChartContainer>
        </Card>

        {/* Gráfico de Barras - Comparativo de Indicadores */}
        <Card className="p-6 glass-card border border-white/10 shadow-glass-light">
          <h3 className="text-lg font-semibold text-white mb-4">Comparativo de Indicadores</h3>
          <ChartContainer>
            {barData && barData.length > 0 && barData.some(b => b.leads > 0 || b.spend > 0 || b.impressions > 0) ? (
              <AnimatedBarChart data={barData} keys={['leads','spend','impressions']} />
            ) : (
              <div className="text-white/60 text-center py-8">Sem dados suficientes para exibir o comparativo.</div>
            )}
          </ChartContainer>
        </Card>
      </div>

      {/* Bloco de Atividade Recente - Movido para o final */}
      {(recentActivity.length > 0 || activityLoading || activityError) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4" data-testid="dashboard-activity">
          <div className="font-semibold text-white mb-2">Atividade Recente da Meta</div>
          {/* Filtro de tipos de atividade */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_EVENT_TYPES.map(type => (
              <label key={type} className="flex items-center gap-1 text-xs text-white/80 bg-white/10 px-2 py-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="accent-blue-500"
                />
                {EVENT_TYPE_LABELS[type] || type}
              </label>
            ))}
          </div>
          {activityLoading ? (
            <div className="text-white/60 text-center py-4">Carregando atividades...</div>
          ) : activityError ? (
            <div className="text-red-400 text-center py-4">
              {activityError}<br />
              <button onClick={refreshActivities} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">Tentar novamente</button>
            </div>
          ) : (
            <>
            <ul className="divide-y divide-white/10">
              {paginatedActivity.map((activity, idx) => (
                <li key={activity.id} className="py-2 flex items-center gap-3">
                  <span className="text-blue-400 font-bold">
                    {activity.event_type === 'ad_account_update_spend_limit' ? '💰' :
                     activity.event_type === 'ad_account_update_status' ? '🔄' :
                     activity.event_type === 'campaign_update_status' ? '📊' :
                     activity.event_type === 'adset_update_status' ? '🎯' :
                     activity.event_type === 'ad_update_status' ? '📝' : '📝'}
                  </span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {getActivityMessage(activity)}
                    </div>
                    <div className="text-xs text-white/60">
                      {activity.object_name && `Objeto: ${activity.object_name}`}
                      {activity.value_old && activity.value_new && 
                        ` | ${activity.value_old} → ${activity.value_new}`}
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    {activity.event_time ? new Date(activity.event_time).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={activityPage}
              totalPages={totalActivityPages}
              totalItems={filteredActivity.length}
              pageSize={activityPageSize}
              onPageChange={setActivityPage}
              onPageSizeChange={setActivityPageSize}
              loading={activityLoading}
            />
            </>
          )}
        </div>
      )}
    </div>
  );
}