'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, TrendingUp, DollarSign, Eye, BarChart3,
  Calendar, Filter, Search, ArrowRight, CheckCircle, Clock,
  Phone, Mail, Globe, Settings, ChevronRight, PieChart,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AdvertisersDashboard() {
  const [advertisers, setAdvertisers] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [overallMetrics, setOverallMetrics] = useState({});
  const [dateRange, setDateRange] = useState('30d');
  const [viewMode, setViewMode] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdvertisersData();
  }, [dateRange]);

  const fetchAdvertisersData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar anunciantes
      const { data: advertisersData, error: advertisersError } = await supabase
        .from('advertisers')
        .select('*')
        .order('created_at', { ascending: false });

      if (advertisersError) throw advertisersError;

      // Para cada anunciante, calcular métricas
      const advertisersWithMetrics = await Promise.all(
        (advertisersData || []).map(async (advertiser) => {
          const metrics = await calculateAdvertiserMetrics(advertiser.id);
          return {
            ...advertiser,
            metrics
          };
        })
      );

      // Calcular métricas gerais
      const totals = advertisersWithMetrics.reduce((acc, adv) => ({
        total_campaigns: acc.total_campaigns + (adv.metrics?.total_campaigns || 0),
        active_campaigns: acc.active_campaigns + (adv.metrics?.active_campaigns || 0),
        total_leads: acc.total_leads + (adv.metrics?.total_leads || 0),
        converted_leads: acc.converted_leads + (adv.metrics?.converted_leads || 0),
        total_spend: acc.total_spend + (adv.metrics?.total_spend || 0)
      }), {
        total_campaigns: 0,
        active_campaigns: 0,
        total_leads: 0,
        converted_leads: 0,
        total_spend: 0
      });

      setAdvertisers(advertisersWithMetrics);
      setOverallMetrics(totals);

    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar anunciantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAdvertiserMetrics = async (advertiserId) => {
    try {
      // Contar campanhas
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('advertiser_id', advertiserId);

      // Contar campanhas ativas
      const { count: activeCampaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('advertiser_id', advertiserId)
        .eq('status', 'ACTIVE');

      // Contar leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('advertiser_id', advertiserId);

      // Contar leads convertidos
      const { count: convertedLeadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('advertiser_id', advertiserId)
        .eq('status', 'converted');

      // Calcular gasto total
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('spend')
        .eq('advertiser_id', advertiserId);

      const totalSpend = (campaigns || []).reduce((sum, campaign) => {
        return sum + (parseFloat(campaign.spend || 0));
      }, 0);

      const conversionRate = leadsCount > 0 ? ((convertedLeadsCount || 0) / leadsCount * 100) : 0;

      return {
        total_campaigns: campaignsCount || 0,
        active_campaigns: activeCampaignsCount || 0,
        total_leads: leadsCount || 0,
        converted_leads: convertedLeadsCount || 0,
        total_spend: totalSpend,
        conversion_rate: conversionRate.toFixed(1)
      };

    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return {
        total_campaigns: 0,
        active_campaigns: 0,
        total_leads: 0,
        converted_leads: 0,
        total_spend: 0,
        conversion_rate: 0
      };
    }
  };

  const fetchAdvertiserDetails = async (advertiserId) => {
    try {
      setLoading(true);

      // Buscar dados do anunciante
      const { data: advertiser, error: advertiserError } = await supabase
        .from('advertisers')
        .select('*')
        .eq('id', advertiserId)
        .single();

      if (advertiserError) throw advertiserError;

      // Buscar campanhas
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name, status, spend, impressions, clicks')
        .eq('advertiser_id', advertiserId)
        .order('created_time', { ascending: false });

      if (campaignsError) {
        console.warn('Erro ao buscar campanhas:', campaignsError);
      }

      // Para cada campanha, contar leads
      const campaignsWithLeads = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          return {
            ...campaign,
            leads_count: leadsCount || 0
          };
        })
      );

      // Buscar leads recentes
      const { data: recentLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, full_name, email, status, created_time, campaign_id')
        .eq('advertiser_id', advertiserId)
        .order('created_time', { ascending: false })
        .limit(10);

      if (leadsError) {
        console.warn('Erro ao buscar leads:', leadsError);
      }

      // Enriquecer leads com nome da campanha
      const leadsWithCampaignNames = (recentLeads || []).map(lead => {
        const campaign = campaignsWithLeads.find(c => c.id === lead.campaign_id);
        return {
          ...lead,
          campaign_name: campaign?.name || 'Campanha Desconhecida'
        };
      });

      // Calcular métricas
      const metrics = await calculateAdvertiserMetrics(advertiserId);

      setSelectedAdvertiser({
        ...advertiser,
        metrics,
        campaigns: campaignsWithLeads,
        recent_leads: leadsWithCampaignNames
      });

    } catch (error) {
      setError(error.message);
      console.error('Erro ao buscar detalhes do anunciante:', error);
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

  if (loading && advertisers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando anunciantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Erro: {error}</p>
          <button 
            onClick={fetchAdvertisersData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
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
    </div>
  );

  const AdvertiserCard = ({ advertiser, onClick }) => (
    <div 
      onClick={() => onClick(advertiser.id)}
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: advertiser.brand_color || '#3B82F6' }}
          >
            {advertiser.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{advertiser.name}</h3>
            <p className="text-sm text-gray-500">{advertiser.company_name}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-blue-600">{advertiser.metrics?.total_campaigns || 0}</p>
          <p className="text-xs text-gray-500">Campanhas</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{advertiser.metrics?.total_leads || 0}</p>
          <p className="text-xs text-gray-500">Leads</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(advertiser.metrics?.total_spend)}</p>
          <p className="text-xs text-gray-500">Gasto Total</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-600">{advertiser.metrics?.conversion_rate || 0}%</p>
          <p className="text-xs text-gray-500">Conversão</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          advertiser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {advertiser.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
        <div className="flex items-center gap-2">
          {advertiser.email && (
            <a 
              href={`mailto:${advertiser.email}`} 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
          {advertiser.website && (
            <a 
              href={advertiser.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const DetailedView = ({ advertiser }) => (
    <div className="space-y-8">
      {/* Header do anunciante */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: advertiser.brand_color || '#3B82F6' }}
            >
              {advertiser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{advertiser.name}</h2>
              <p className="text-gray-600">{advertiser.company_name}</p>
              <div className="flex items-center gap-4 mt-2">
                {advertiser.email && (
                  <a href={`mailto:${advertiser.email}`} className="text-sm text-blue-600 hover:underline">
                    {advertiser.email}
                  </a>
                )}
                {advertiser.phone && (
                  <span className="text-sm text-gray-500">{advertiser.phone}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setViewMode('overview');
              setSelectedAdvertiser(null);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Voltar
          </button>
        </div>
      </div>

      {/* Métricas detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Campanhas Ativas"
          value={advertiser.metrics?.active_campaigns || 0}
          subtitle={`${advertiser.metrics?.total_campaigns || 0} total`}
          icon={BarChart3}
          color="blue"
        />
        <MetricCard
          title="Total de Leads"
          value={advertiser.metrics?.total_leads || 0}
          subtitle={`${advertiser.metrics?.converted_leads || 0} convertidos`}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${advertiser.metrics?.conversion_rate || 0}%`}
          subtitle="Leads convertidos"
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Investimento"
          value={formatCurrency(advertiser.metrics?.total_spend)}
          subtitle="Período selecionado"
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Campanhas do anunciante */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas</h3>
        {advertiser.campaigns && advertiser.campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Leads</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Gasto</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">CPL</th>
                </tr>
              </thead>
              <tbody>
                {advertiser.campaigns.map((campaign, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{campaign.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{campaign.leads_count || 0}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(campaign.spend)}</td>
                    <td className="py-3 px-4 text-right">
                      {campaign.leads_count > 0 ? formatCurrency(campaign.spend / campaign.leads_count) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhuma campanha encontrada</p>
        )}
      </div>

      {/* Leads recentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Recentes</h3>
        {advertiser.recent_leads && advertiser.recent_leads.length > 0 ? (
          <div className="space-y-3">
            {advertiser.recent_leads.map((lead, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{lead.full_name}</p>
                  <p className="text-sm text-gray-500">{lead.email} • {lead.campaign_name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                    lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(lead.created_time).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhum lead encontrado</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel por Anunciante</h1>
              <p className="text-gray-600">Gerencie performance por cliente/empresa</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'overview' ? (
          <>
            {/* Métricas gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Anunciantes"
                value={advertisers.length}
                subtitle={`${advertisers.filter(a => a.status === 'active').length} ativos`}
                icon={Building2}
                color="blue"
              />
              <MetricCard
                title="Total Campanhas"
                value={overallMetrics.total_campaigns || 0}
                subtitle={`${overallMetrics.active_campaigns || 0} ativas`}
                icon={BarChart3}
                color="green"
              />
              <MetricCard
                title="Total Leads"
                value={overallMetrics.total_leads || 0}
                subtitle={`${overallMetrics.converted_leads || 0} convertidos`}
                icon={Users}
                color="purple"
              />
              <MetricCard
                title="Investimento Total"
                value={formatCurrency(overallMetrics.total_spend)}
                subtitle="Todos os anunciantes"
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Grid de anunciantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisers.map((advertiser) => (
                <AdvertiserCard
                  key={advertiser.id}
                  advertiser={advertiser}
                  onClick={async (id) => {
                    setViewMode('detailed');
                    await fetchAdvertiserDetails(id);
                  }}
                />
              ))}
            </div>

            {advertisers.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Nenhum anunciante encontrado</p>
                <p className="text-gray-400 text-sm">Execute o SQL para inserir dados de teste</p>
              </div>
            )}
          </>
        ) : (
          selectedAdvertiser && <DetailedView advertiser={selectedAdvertiser} />
        )}
      </div>
    </div>
  );
}