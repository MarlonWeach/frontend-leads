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

      // Buscar dados da tabela campaign_insights com filtro de data
      const { data: insightsData, error: insightsError } = await supabase
        .from('campaign_insights')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', dateTo);

      if (insightsError) {
        throw new Error(`Erro ao buscar dados: ${insightsError.message}`);
      }

      setData(insightsData || []);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error };
} 