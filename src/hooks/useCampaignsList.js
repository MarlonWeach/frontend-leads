import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const useCampaignsList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setCampaigns(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar campanhas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const refreshCampaigns = () => {
    fetchCampaigns();
  };

  return {
    campaigns,
    loading,
    error,
    refreshCampaigns
  };
}; 