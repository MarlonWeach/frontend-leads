'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Building2, Target, DollarSign, Eye, 
  MousePointer, CheckCircle, Clock, AlertCircle, ArrowRight,
  BarChart3, PieChart, Calendar, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState({
    campaigns: { total: 0, active: 0 },
    leads: { total: 0, new: 0, converted: 0, conversion_rate: 0 },
    advertisers: { total: 0, active: 0 },
    performance: { spend: 0, impressions: 0, clicks: 0, ctr: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar métricas de campanhas
      const [
        { count: totalCampaigns },
        { count: activeCampaigns }
      ] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
      ]);

      // Buscar métricas de leads
      const [
        { count: totalLeads },
        { count: newLeads },
        { count: convertedLeads }
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted')
      ]);

      // Buscar métricas de anunciantes
      const [
        { count: totalAdvertisers },
        { count: activeAdvertisers }
      ] = await Promise.all([
        supabase.from('advertisers').select('*', { count: 'exact', head: true }),
        supabase.from('advertisers').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      // Calcular métricas de performance
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('spend, impressions, clicks');

      const performance = (campaignsData || []).reduce((acc, campaign) => ({
        spend: acc.spend + (parseFloat(campaign.spend) || 0),
        impressions: acc.impressions + (parseInt(campaign.impressions) || 0),
        clicks: acc.clicks + (parseInt(campaign.clicks) || 0)
      }), { spend: 0, impressions: 0, clicks: 0 });

      const ctr = performance.impressions > 0 ? (performance.clicks / performance.impressions * 100) : 0;

      // Buscar atividade recente (leads dos últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, full_name, email, status, created_time, campaign_id')
        .gte('created_time', sevenDaysAgo.toISOString())
        .order('created_time', { ascending: false })
        .limit(10);

      // Gerar alertas baseados nas métricas
      const generatedAlerts = [];
      
      if (activeCampaigns === 0) {
        generatedAlerts.push({
          type: 'warning',
          title: 'Nenhuma campanha ativa',
          message: 'Você não tem campanhas ativas no momento.',
          action: 'Ativar campanhas',
          href: '/campaigns'
        });
      }

      if (newLeads > 10) {
        generatedAlerts.push({
          type: 'info',
          title: `${newLeads} novos leads`,
          message: 'Você tem leads aguardando contato.',
          action: 'Ver leads',
          href: '/leads'
        });
      }

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;
      if (conversionRate < 5 && totalLeads > 20) {
        generatedAlerts.push({
          type: 'warning',
          title: 'Taxa de conversão baixa',
          message: `Taxa atual: ${conversionRate.toFixed(1)}%. Meta: 5%+`,
          action: 'Ver performance',
          href: '/performance'
        });
      }

      setMetrics({
        campaigns: { total: totalCampaigns || 0, active: activeCampaigns || 0 },
        leads: { 
          total: totalLeads || 0, 
          new: newLeads || 0, 
          converted: convertedLeads || 0,
          conversion_rate: conversionRate
        },
        advertisers: { total: totalAdvertisers || 0, active: activeAdvertisers || 0 },
        performance: { ...performance, ctr }
      });

      setRecentActivity(recentLeads || []);
      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null, href = null }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 bg-${color}-50 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className={`h-4 w-4 mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
        </div>
      )}
      {href && (
        <div className="mt-4">
          <div className="flex items-center text-sm text-blue-600 hover:text-blue-700">
            Ver detalhes <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      )}
    </div>
  );

  const AlertCard = ({ alert }) => {
    const colorClasses = {
      info: 'border-blue-200 bg-blue-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
      success: 'border-green-200 bg-green-50'
    };

    const iconClasses = {
      info: 'text-blue-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      success: 'text-green-500'
    };

    return (
      <div className={`border rounded-lg p-4 ${colorClasses[alert.type] || colorClasses.info}`}>
        <div className="flex items-start">
          <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 ${iconClasses[alert.type] || iconClasses.info}`} />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
            {alert.action && alert.href && (
              <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                {alert.action} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Leads"
          value={formatNumber(metrics.leads.total)}
          subtitle={`${metrics.leads.new} novos • ${metrics.leads.conversion_rate.toFixed(1)}% conversão`}
          icon={Users}
          color="blue"
          trend={15.2}
          href="/leads"
        />
        <MetricCard
          title="Campanhas Ativas"
          value={metrics.campaigns.active}
          subtitle={`${metrics.campaigns.total} total`}
          icon={Target}
          color="green"
          trend={8.1}
          href="/campaigns"
        />
        <MetricCard
          title="Anunciantes"
          value={metrics.advertisers.active}
          subtitle={`${metrics.advertisers.total} cadastrados`}
          icon={Building2}
          color="purple"
          trend={5.3}
          href="/advertisers"
        />
        <MetricCard
          title="Investimento"
          value={formatCurrency(metrics.performance.spend)}
          subtitle={`CTR: ${metrics.performance.ctr.toFixed(2)}%`}
          icon={DollarSign}
          color="orange"
          trend={-2.4}
          href="/performance"
        />
      </div>

      {/* Alertas e atividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tudo funcionando perfeitamente!</p>
            </div>
          )}
        </div>

        {/* Atividade recente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((lead, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full ${
                    lead.status === 'converted' ? 'bg-green-500' :
                    lead.status === 'qualified' ? 'bg-blue-500' :
                    lead.status === 'contacted' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lead.full_name || lead.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(lead.created_time).toLocaleDateString('pt-BR')} • {lead.status}
                    </p>
                  </div>
                </div>
              ))}
              
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 py-2">
                Ver todos os leads →
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.performance.impressions)}</p>
            <p className="text-sm text-gray-600">Impressões</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatNumber(metrics.performance.clicks)}</p>
            <p className="text-sm text-gray-600">Cliques</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{metrics.performance.ctr.toFixed(2)}%</p>
            <p className="text-sm text-gray-600">CTR</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.performance.spend)}</p>
            <p className="text-sm text-gray-600">Investido</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Dashboard Completo
          </button>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/campaigns" className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Campanhas</span>
          </a>
          <a href="/leads" className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Leads</span>
          </a>
          <a href="/performance" className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Performance</span>
          </a>
          <a href="/advertisers" className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Building2 className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Anunciantes</span>
          </a>
        </div>
      </div>
    </div>
  );
}