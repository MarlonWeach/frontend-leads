'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, DollarSign, BarChart3,
  AlertCircle, ChevronRight, Mail, Globe, ArrowRight, CheckCircle, TrendingUp, Search, Filter, Download, Eye, Target, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAdvertisersData } from '../hooks/useAdvertisersData';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';
import { SectionTransition } from './ui/transitions';

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
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
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

  const periodOptions = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' }
  ];

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

  // Métricas gerais para cards principais
  const metricsList = [
    {
      key: 'active_campaigns',
      label: 'Campanhas Ativas',
      value: overallMetrics.active_campaigns || 0,
      subinfo: <><span className="text-accent font-semibold">{overallMetrics.total_campaigns || 0}</span> total</>,
      icon: <Target className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Número de campanhas ativas dos anunciantes',
    },
    {
      key: 'total_leads',
      label: 'Total de Leads',
      value: overallMetrics.total_leads || 0,
      subinfo: <><span className="text-accent font-semibold">{overallMetrics.converted_leads || 0}</span> convertidos</>,
      icon: <Users className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total de leads gerados por todos os anunciantes',
    },
    {
      key: 'total_spend',
      label: 'Investimento',
      value: formatCurrency(overallMetrics.total_spend),
      subinfo: <>Custo por lead: <span className="text-accent font-semibold">{overallMetrics.total_leads > 0 ? formatCurrency(overallMetrics.total_spend / overallMetrics.total_leads) : '-'}</span></>,
      icon: <DollarSign className="h-7 w-7 text-primary mt-2 self-end" />,
      tooltip: 'Total investido pelos anunciantes',
    },
  ];

  return (
    <SectionTransition direction="up" duration={600} className="space-y-8">
      {/* Filtros de período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedPeriod(opt.value)}
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-colors shadow-glass backdrop-blur-lg
                  ${selectedPeriod === opt.value
                    ? 'bg-primary text-white'
                    : 'glass-card text-white hover:bg-white/10'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="text-sublabel-refined text-glow glass-card px-3 py-2 rounded-2xl shadow-glass backdrop-blur-lg">
            <span className="font-medium text-white">Período:</span> Últimos {periodOptions.find(p => p.value === selectedPeriod)?.label}
          </div>
        </div>
        <div className="text-sublabel-refined text-white/70">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Grid de cards de métricas principais */}
      <div data-testid="metrics-summary" className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] auto-rows-fr">
        {metricsList.map(metric => (
          <motion.div
            key={metric.key}
            className="glass-card p-6 flex flex-col justify-between items-center min-h-[180px]"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex flex-col gap-y-2 flex-1 items-center w-full">
              <span className="text-sublabel-refined text-primary-text text-center w-full">
                {metric.label}
                <Tooltip content={metric.tooltip}>
                  <Info className="inline h-4 w-4 ml-1 text-accent align-text-top" />
                </Tooltip>
              </span>
              <span className="text-[clamp(1.2rem,2vw,2rem)] font-bold text-primary text-center w-full">
                {metric.value}
              </span>
              <span className="text-xs text-secondary-text mt-1 text-center w-full">{metric.subinfo}</span>
            </div>
            <div className="mt-2">{metric.icon}</div>
          </motion.div>
        ))}
      </div>

      {/* Grid de cards de anunciantes */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] auto-rows-fr mt-8">
        {advertisers.map(advertiser => (
          <motion.div
            key={advertiser.id}
            className="glass-card p-6 flex flex-col justify-between items-center min-h-[180px] cursor-pointer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setSelectedAdvertiser(advertiser)}
          >
            <div className="flex flex-col gap-y-2 flex-1 items-center w-full">
              <span className="text-sublabel-refined text-primary-text text-center w-full">
                {advertiser.name}
                <Tooltip content="Nome do anunciante">
                  <Info className="inline h-4 w-4 ml-1 text-accent align-text-top" />
                </Tooltip>
              </span>
              <span className="text-[clamp(1.2rem,2vw,2rem)] font-bold text-primary text-center w-full">
                {advertiser.metrics?.total_leads || 0} leads
              </span>
              <span className="text-xs text-secondary-text mt-1 text-center w-full">
                {advertiser.metrics?.active_campaigns || 0} campanhas ativas
              </span>
              <span className="text-xs text-secondary-text mt-1 text-center w-full">
                Investido: <span className="text-accent font-semibold">{formatCurrency(advertiser.metrics?.total_spend)}</span>
              </span>
            </div>
            <div className="mt-2"><Building2 className="h-7 w-7 text-primary mt-2 self-end" /></div>
          </motion.div>
        ))}
      </div>
    </SectionTransition>
  );
}