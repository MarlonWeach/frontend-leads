'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, DollarSign, BarChart3,
  AlertCircle, ChevronRight, Mail, Globe, ArrowRight, CheckCircle, TrendingUp, Search, Filter, Download, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAdvertisersData } from '../hooks/useAdvertisersData';
import { Tooltip } from './Tooltip';

export default function AdvertisersDashboard() {
  const [advertisers, setAdvertisers] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [overallMetrics, setOverallMetrics] = useState({});
  const [dateRange, setDateRange] = useState('30d');
  const [viewMode, setViewMode] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading, error: useAdvertisersDataError, refetch } = useAdvertisersData();

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
    return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando anunciantes...</p>
        </div>
      </div>
    );
  }

  if (useAdvertisersDataError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Erro: {useAdvertisersDataError.message}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'violet' }) => (
    <div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col items-center">
      <div className={`mb-2 text-violet`}><Icon className="h-8 w-8" /></div>
      <div className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{value}</div>
      <div className="text-sublabel text-violet mt-1">{title}</div>
      {subtitle && <div className="text-xs text-electric/80 mt-1">{subtitle}</div>}
    </div>
  );

  const AdvertiserCard = ({ advertiser, onClick }) => (
    <div
      className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 cursor-pointer hover:scale-[1.02] transition-transform flex flex-col"
      onClick={onClick}
    >
      <div className="flex items-center mb-2">
        <Building2 className="h-6 w-6 text-electric mr-2" />
        <span className="text-title font-bold text-mint">{advertiser.name}</span>
      </div>
      <div className="text-sublabel text-glow mb-2">{advertiser.email}</div>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="bg-mint/10 text-mint rounded-full px-3 py-1 text-xs">{advertiser.metrics.total_campaigns} campanhas</span>
        <span className="bg-electric/10 text-electric rounded-full px-3 py-1 text-xs">{advertiser.metrics.total_leads} leads</span>
        <span className="bg-violet/10 text-violet rounded-full px-3 py-1 text-xs">{advertiser.metrics.converted_leads} convertidos</span>
        <span className="bg-mint/10 text-mint rounded-full px-3 py-1 text-xs">R$ {advertiser.metrics.total_spend}</span>
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

  const advertisersData = data?.advertisers || [];
  const metricsData = data?.metrics || {
    total: 0,
    active: 0,
    inactive: 0,
    totalSpend: 0,
    totalLeads: 0
  };

  // Filtrar anunciantes
  const filteredAdvertisers = advertisersData.filter(advertiser => {
    const matchesSearch = advertiser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advertiser.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || advertiser.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-header font-bold text-white mb-2">Anunciantes</h1>
          <p className="text-sublabel-refined text-white/70">
            Gerencie e monitore seus anunciantes
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-electric text-background rounded-2xl hover:bg-violet transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Total de Anunciantes</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(metricsData.total)}</p>
            </div>
            <Building2 className="h-8 w-8 text-violet" />
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Anunciantes Ativos</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(metricsData.active)}</p>
            </div>
            <Users className="h-8 w-8 text-violet" />
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Anunciantes Inativos</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(metricsData.inactive)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-violet" />
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Investimento Total</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatCurrency(metricsData.totalSpend)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-violet" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card backdrop-blur-lg p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar anunciantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-electric"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric appearance-none"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Anunciantes */}
      <div className="glass-card backdrop-blur-lg p-8">
        <h2 className="text-header font-semibold text-white mb-6">Lista de Anunciantes</h2>
        
        {filteredAdvertisers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-sublabel-refined text-white/70">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum anunciante encontrado com os filtros aplicados'
                : 'Nenhum anunciante cadastrado'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAdvertisers.map((advertiser) => (
              <div
                key={advertiser.id}
                className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-electric/20 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-electric" />
                  </div>
                  <div>
                    <h3 className="text-sublabel-refined font-medium text-white">{advertiser.name}</h3>
                    <p className="text-xs text-white/70">{advertiser.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sublabel-refined font-medium text-white">
                      {formatCurrency(advertiser.totalSpend || 0)}
                    </p>
                    <p className="text-xs text-white/70">Investimento total</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sublabel-refined font-medium text-white">
                      {formatNumber(advertiser.totalLeads || 0)}
                    </p>
                    <p className="text-xs text-white/70">Leads gerados</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      advertiser.status === 'active'
                        ? 'bg-electric/20 text-electric'
                        : 'bg-violet/20 text-violet'
                    }`}>
                      {advertiser.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <button className="p-2 text-white/70 hover:text-electric transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}