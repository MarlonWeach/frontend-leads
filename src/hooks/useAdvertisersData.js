// src/hooks/useAdvertisersData.js - Versão Simplificada para Debug

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useAdvertisersData(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdvertisersData();
  }, [filters]);

  const fetchAdvertisersData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Iniciando busca de anunciantes...');

      // Primeiro, testar conexão básica
      const { data: testData, error: testError } = await supabase
        .from('advertisers')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        console.error('❌ Erro na consulta básica:', testError);
        throw new Error(`Erro na tabela advertisers: ${testError.message}`);
      }

      console.log('✅ Conexão OK. Total de anunciantes:', testData);

      // Buscar anunciantes básicos
      const { data: advertisers, error: advertisersError } = await supabase
        .from('advertisers')
        .select('*')
        .order('created_at', { ascending: false });

      if (advertisersError) {
        console.error('❌ Erro ao buscar anunciantes:', advertisersError);
        throw advertisersError;
      }

      console.log('📊 Anunciantes encontrados:', advertisers?.length || 0);

      if (!advertisers || advertisers.length === 0) {
        console.log('ℹ️ Nenhum anunciante encontrado, retornando dados vazios');
        setData({
          advertisers: [],
          selectedAdvertiser: null,
          overallMetrics: {
            total_campaigns: 0,
            active_campaigns: 0,
            total_leads: 0,
            converted_leads: 0,
            total_spend: 0,
            avg_conversion_rate: 0
          }
        });
        return;
      }

      // Para cada anunciante, calcular métricas básicas
      const advertisersWithMetrics = [];
      
      for (const advertiser of advertisers) {
        console.log(`📈 Calculando métricas para: ${advertiser.name}`);
        
        try {
          // Contar campanhas
          const { count: campaignsCount } = await supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_id', advertiser.id);

          // Contar campanhas ativas
          const { count: activeCampaignsCount } = await supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_id', advertiser.id)
            .eq('status', 'ACTIVE');

          // Contar leads
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_id', advertiser.id);

          // Contar leads convertidos
          const { count: convertedLeadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_id', advertiser.id)
            .eq('status', 'converted');

          // Calcular gasto total (simplificado)
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('spend')
            .eq('advertiser_id', advertiser.id);

          const totalSpend = (campaigns || []).reduce((sum, campaign) => {
            return sum + (parseFloat(campaign.spend || 0));
          }, 0);

          const conversionRate = leadsCount > 0 ? ((convertedLeadsCount || 0) / leadsCount * 100) : 0;

          const metrics = {
            total_campaigns: campaignsCount || 0,
            active_campaigns: activeCampaignsCount || 0,
            total_leads: leadsCount || 0,
            converted_leads: convertedLeadsCount || 0,
            total_spend: totalSpend,
            conversion_rate: conversionRate.toFixed(1)
          };

          console.log(`✅ Métricas para ${advertiser.name}:`, metrics);

          advertisersWithMetrics.push({
            ...advertiser,
            metrics
          });

        } catch (metricError) {
          console.error(`❌ Erro ao calcular métricas para ${advertiser.name}:`, metricError);
          
          // Adicionar com métricas zeradas se der erro
          advertisersWithMetrics.push({
            ...advertiser,
            metrics: {
              total_campaigns: 0,
              active_campaigns: 0,
              total_leads: 0,
              converted_leads: 0,
              total_spend: 0,
              conversion_rate: 0
            }
          });
        }
      }

      // Calcular métricas gerais
      const overallMetrics = advertisersWithMetrics.reduce((acc, advertiser) => {
        const metrics = advertiser.metrics || {};
        return {
          total_campaigns: acc.total_campaigns + (metrics.total_campaigns || 0),
          active_campaigns: acc.active_campaigns + (metrics.active_campaigns || 0),
          total_leads: acc.total_leads + (metrics.total_leads || 0),
          converted_leads: acc.converted_leads + (metrics.converted_leads || 0),
          total_spend: acc.total_spend + (metrics.total_spend || 0)
        };
      }, {
        total_campaigns: 0,
        active_campaigns: 0,
        total_leads: 0,
        converted_leads: 0,
        total_spend: 0
      });

      // Calcular taxa de conversão média
      const avgConversionRate = advertisersWithMetrics.length > 0 ? 
        (advertisersWithMetrics.reduce((sum, adv) => sum + parseFloat(adv.metrics?.conversion_rate || 0), 0) / advertisersWithMetrics.length) : 0;

      overallMetrics.avg_conversion_rate = avgConversionRate.toFixed(1);

      console.log('📊 Métricas gerais:', overallMetrics);

      setData({
        advertisers: advertisersWithMetrics,
        selectedAdvertiser: null,
        overallMetrics
      });

    } catch (err) {
      console.error('💥 Erro geral:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchAdvertisersData };
}

// Hook simplificado para filtro de anunciantes
export function useAdvertiserFilter() {
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvertisersForFilter();
  }, []);

  const fetchAdvertisersForFilter = async () => {
    try {
      console.log('🔍 Buscando anunciantes para filtro...');
      
      const { data, error } = await supabase
        .from('advertisers')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar anunciantes para filtro:', error);
        setAdvertisers([]);
      } else {
        console.log('✅ Anunciantes para filtro:', data?.length || 0);
        setAdvertisers(data || []);
      }

    } catch (error) {
      console.error('💥 Erro geral no filtro:', error);
      setAdvertisers([]);
    } finally {
      setLoading(false);
    }
  };

  return { advertisers, loading, refetch: fetchAdvertisersForFilter };
}

// Hook para ações (simplificado)
export function useAdvertiserActions() {
  const [updating, setUpdating] = useState(false);

  const createAdvertiser = async (advertiserData) => {
    try {
      setUpdating(true);
      console.log('➕ Criando anunciante:', advertiserData);

      const slug = advertiserData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      const { data, error } = await supabase
        .from('advertisers')
        .insert([{
          ...advertiserData,
          slug
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Anunciante criado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao criar anunciante:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    createAdvertiser,
    updating
  };
}