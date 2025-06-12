'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

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

export default function CampaignsPage() {
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Campanhas</h1>
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <div key={campaign.campaign_name} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{campaign.campaign_name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div>
                <p className="text-sm text-gray-600">Leads</p>
                <p className="font-medium">{campaign.leads}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Investimento</p>
                <p className="font-medium">R$ {campaign.spend.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CTR</p>
                <p className="font-medium">{campaign.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPL</p>
                <p className="font-medium">R$ {campaign.cpl.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 