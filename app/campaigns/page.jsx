'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabaseClient';
import { motion } from 'framer-motion';
import { SectionTransition } from '../../src/components/ui/transitions';
import { BarChart3, Info, Eye, MousePointer, DollarSign } from 'lucide-react';
import { Tooltip } from '../../src/components/Tooltip';
import MainLayout from '../../src/components/MainLayout';

// Função para buscar métricas de campanhas
const fetchCampaignMetrics = async (dateFrom, dateTo) => {
  const { data, error } = await supabase
    .from('meta_leads')
    .select(`
      campaign_name,
      lead_count,
      spend,
      impressions,
      clicks,
      created_time
    `)
    .gte('created_time', dateFrom.toISOString())
    .lte('created_time', dateTo.toISOString());

  if (error) {
    console.error('Erro ao buscar métricas:', error);
    return [];
  }

  // Agrupar métricas por campanha
  const campaignMetrics = data.reduce((acc, record) => {
    const campaignName = record.campaign_name;
    if (!acc[campaignName]) {
      acc[campaignName] = {
        campaign_name: campaignName,
        leads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        cpl: 0
      };
    }

    // Acumular métricas
    acc[campaignName].leads += (record.lead_count || 0);
    acc[campaignName].spend += parseFloat(record.spend || 0);
    acc[campaignName].impressions += parseInt(record.impressions || 0);
    acc[campaignName].clicks += parseInt(record.clicks || 0);

    return acc;
  }, {});

  // Calcular métricas derivadas
  return Object.values(campaignMetrics).map(metrics => ({
    ...metrics,
    ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
    cpm: metrics.impressions > 0 ? (metrics.spend / metrics.impressions) * 1000 : 0,
    cpl: metrics.leads > 0 ? metrics.spend / metrics.leads : 0
  }));
};

const periodOptions = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' }
];

export default function CampaignsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30); // últimos 30 dias
        const dateTo = new Date();
        
        const metrics = await fetchCampaignMetrics(dateFrom, dateTo);
        setCampaigns(metrics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  if (loading) return <div>Carregando campanhas...</div>;
  if (error) return <div>Erro ao carregar campanhas: {error}</div>;

  return (
    <MainLayout title="Campanhas" breadcrumbs={[{ name: 'Campanhas', href: '/campaigns' }]}> 
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

        {/* Grid de cards de campanhas - padrão dashboard */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] auto-rows-fr">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.campaign_name}
              className="glass-card p-6 flex flex-col justify-between items-center min-h-[180px]"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="flex flex-col gap-y-2 flex-1 items-center w-full">
                <span className="text-sublabel-refined text-primary-text text-center w-full">
                  {campaign.campaign_name}
                  <Tooltip content="Nome da campanha no Meta Ads">
                    <Info className="inline h-4 w-4 ml-1 text-accent align-text-top" />
                  </Tooltip>
                </span>
                <span className="text-[clamp(1.2rem,2vw,2rem)] font-bold text-primary text-center w-full">
                  {campaign.leads} leads
                </span>
                <span className="text-xs text-secondary-text mt-1 text-center w-full">
                  Investimento: <span className="text-accent font-semibold">R$ {campaign.spend.toFixed(2)}</span>
                </span>
                <span className="text-xs text-secondary-text mt-1 text-center w-full">
                  Impressões: <span className="text-primary font-semibold">{campaign.impressions}</span> • Cliques: <span className="text-primary font-semibold">{campaign.clicks}</span>
                </span>
                <span className="text-xs text-secondary-text mt-1 text-center w-full">
                  CTR: <span className="text-accent font-semibold">{campaign.ctr.toFixed(2)}%</span> • CPL: <span className="text-accent font-semibold">R$ {campaign.cpl.toFixed(2)}</span>
                </span>
              </div>
              <div className="mt-2"><BarChart3 className="h-7 w-7 text-primary mt-2 self-end" /></div>
            </motion.div>
          ))}
        </div>
      </SectionTransition>
    </MainLayout>
  );
} 