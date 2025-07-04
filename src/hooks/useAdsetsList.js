import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAdsetsList = (campaignId = null) => {
  const [adsets, setAdsets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdsets = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('adsets')
        .select('id, name, status, campaign_id')
        .order('name');

      // Filtrar por campanha se especificado
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAdsets(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar adsets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsets();
  }, [campaignId]);

  const refreshAdsets = () => {
    fetchAdsets();
  };

  return {
    adsets,
    loading,
    error,
    refreshAdsets
  };
}; 