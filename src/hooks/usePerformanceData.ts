import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface CampaignPerformance {
  campaign_id: string;
  date: string;
  leads: number;
  spend: number;
  impressions: number;
  clicks: number;
}

export function usePerformanceData(dateFrom: string, dateTo: string): {
  data: CampaignPerformance[] | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<CampaignPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // campaign_insights não existe no schema atual.
      // Usamos ad_insights + ads para agregar por campanha.
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('id, campaign_id');

      if (adsError) {
        throw new Error(`Erro ao buscar ads: ${adsError.message}`);
      }

      const adIds = (adsData || []).map((ad) => ad.id).filter(Boolean);
      const adsById = new Map((adsData || []).map((ad) => [ad.id, ad.campaign_id]));
      const { data: insightsData, error: insightsError } = adIds.length > 0
        ? await supabase
            .from('ad_insights')
            .select('ad_id, date, spend, impressions, clicks, leads')
            .in('ad_id', adIds)
            .gte('date', dateFrom)
            .lte('date', dateTo)
        : { data: [], error: null };

      if (insightsError) {
        throw new Error(`Erro ao buscar dados: ${insightsError.message}`);
      }

      const groupedByCampaign = (insightsData || []).reduce((acc: Record<string, CampaignPerformance>, insight: any) => {
        const campaignId = adsById.get(insight.ad_id);
        if (!campaignId) return acc;

        if (!acc[campaignId]) {
          acc[campaignId] = {
            campaign_id: campaignId,
            date: dateTo,
            leads: 0,
            spend: 0,
            impressions: 0,
            clicks: 0
          };
        }

        acc[campaignId].leads += Number(insight.leads || 0);
        acc[campaignId].spend += Number(insight.spend || 0);
        acc[campaignId].impressions += Number(insight.impressions || 0);
        acc[campaignId].clicks += Number(insight.clicks || 0);
        return acc;
      }, {});

      setData(Object.values(groupedByCampaign));
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error };
} 