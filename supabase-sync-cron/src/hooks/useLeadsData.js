// src/hooks/useLeadsData.js

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useLeadsData(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeadsData();
  }, [filters]);

  const fetchLeadsData = async () => {
    try {
      setLoading(true);
      
      // Buscar leads com joins
      let query = supabase
        .from('leads')
        .select(`
          *,
          lead_interactions (
            id,
            interaction_type,
            title,
            description,
            created_at,
            completed_at
          )
        `)
        .order('created_time', { ascending: false });

      // Aplicar filtros
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.campaign_id && filters.campaign_id !== 'all') {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        );
      }

      // Filtros de data
      if (filters.date_range) {
        const dateLimit = getDateLimit(filters.date_range);
        query = query.gte('created_time', dateLimit.toISOString());
      }

      if (filters.date_from) {
        query = query.gte('created_time', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_time', filters.date_to);
      }

      const { data: leads, error } = await query;

      if (error) throw error;

      // Calcular métricas
      const metrics = calculateMetrics(leads || []);

      // Buscar nomes das campanhas (se disponível)
      const leadsWithCampaignNames = await enrichWithCampaignNames(leads || []);

      setData({
        leads: leadsWithCampaignNames,
        metrics,
        total: leads?.length || 0
      });

    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (leads) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total_leads: leads.length,
      new_leads: leads.filter(l => l.status === 'new').length,
      contacted_leads: leads.filter(l => l.status === 'contacted').length,
      qualified_leads: leads.filter(l => l.status === 'qualified').length,
      converted_leads: leads.filter(l => l.status === 'converted').length,
      unqualified_leads: leads.filter(l => l.status === 'unqualified').length,
      conversion_rate: leads.length > 0 ? 
        ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0,
      today: leads.filter(l => 
        new Date(l.created_time).toDateString() === today.toDateString()
      ).length,
      this_week: leads.filter(l => 
        new Date(l.created_time) >= weekAgo
      ).length
    };
  };

  const enrichWithCampaignNames = async (leads) => {
    try {
      // Buscar campanhas únicas
      const campaignIds = [...new Set(leads.map(l => l.campaign_id).filter(Boolean))];
      
      if (campaignIds.length === 0) {
        return leads.map(lead => ({
          ...lead,
          campaign_name: lead.campaign_id || 'Campanha Desconhecida'
        }));
      }

      // Tentar buscar campanhas da tabela campaigns
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('id', campaignIds);

      if (error) {
        console.log('Tabela campaigns não encontrada, usando IDs como nomes');
        return leads.map(lead => ({
          ...lead,
          campaign_name: lead.campaign_id || 'Campanha Desconhecida'
        }));
      }

      // Criar mapa de campanhas
      const campaignMap = {};
      campaigns?.forEach(campaign => {
        campaignMap[campaign.id] = campaign.name;
      });

      // Enriquecer leads com nomes das campanhas
      return leads.map(lead => ({
        ...lead,
        campaign_name: campaignMap[lead.campaign_id] || lead.campaign_id || 'Campanha Desconhecida'
      }));

    } catch (error) {
      console.error('Erro ao buscar nomes das campanhas:', error);
      return leads.map(lead => ({
        ...lead,
        campaign_name: lead.campaign_id || 'Campanha Desconhecida'
      }));
    }
  };

  return { data, loading, error, refetch: fetchLeadsData };
}

// Hook para ações dos leads
export function useLeadActions() {
  const [updating, setUpdating] = useState(false);

  const updateLeadStatus = async (leadId, newStatus, notes = null) => {
    try {
      setUpdating(true);

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'contacted') {
        updateData.contacted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      // Adicionar interação se houver notas
      if (notes) {
        await addInteraction(leadId, {
          interaction_type: 'note',
          title: `Status alterado para ${newStatus}`,
          description: notes
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const addInteraction = async (leadId, interaction) => {
    try {
      const { data, error } = await supabase
        .from('lead_interactions')
        .insert([{
          lead_id: leadId,
          ...interaction
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar interação:', error);
      throw error;
    }
  };

  const updateQualityScore = async (leadId, score) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          quality_score: score,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar pontuação:', error);
      throw error;
    }
  };

  const deleteLead = async (leadId) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      throw error;
    }
  };

  return {
    updateLeadStatus,
    addInteraction,
    updateQualityScore,
    deleteLead,
    updating
  };
}

// Hook para métricas avançadas
export function useLeadMetrics(filters = {}) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, [filters]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Buscar dados básicos
      let query = supabase.from('leads').select('*');

      if (filters.campaign_id && filters.campaign_id !== 'all') {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      if (filters.date_range) {
        const dateLimit = getDateLimit(filters.date_range);
        query = query.gte('created_time', dateLimit.toISOString());
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      // Calcular métricas avançadas
      const advancedMetrics = {
        // Métricas básicas
        ...calculateBasicMetrics(leads || []),
        
        // Métricas por campanha
        by_campaign: groupByCampaign(leads || []),
        
        // Métricas por período
        by_period: groupByPeriod(leads || []),
        
        // Tempo médio de conversão
        avg_conversion_time: calculateAvgConversionTime(leads || []),
        
        // Taxa de qualificação
        qualification_rate: calculateQualificationRate(leads || [])
      };

      setMetrics(advancedMetrics);

    } catch (err) {
      setError(err.message);
      console.error('Erro ao calcular métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refetch: fetchMetrics };
}

// Funções auxiliares
function getDateLimit(dateRange) {
  const now = new Date();
  switch (dateRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function calculateBasicMetrics(leads) {
  return {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    unqualified: leads.filter(l => l.status === 'unqualified').length
  };
}

function groupByCampaign(leads) {
  const grouped = {};
  
  leads.forEach(lead => {
    const campaignId = lead.campaign_id || 'unknown';
    if (!grouped[campaignId]) {
      grouped[campaignId] = {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        unqualified: 0
      };
    }
    
    grouped[campaignId].total++;
    grouped[campaignId][lead.status] = (grouped[campaignId][lead.status] || 0) + 1;
  });

  return grouped;
}

function groupByPeriod(leads) {
  const periods = {};
  
  leads.forEach(lead => {
    const date = new Date(lead.created_time).toISOString().split('T')[0];
    if (!periods[date]) {
      periods[date] = { total: 0, converted: 0 };
    }
    periods[date].total++;
    if (lead.status === 'converted') {
      periods[date].converted++;
    }
  });

  return periods;
}

function calculateAvgConversionTime(leads) {
  const convertedLeads = leads.filter(l => l.status === 'converted' && l.contacted_at);
  
  if (convertedLeads.length === 0) return 0;

  const totalTime = convertedLeads.reduce((sum, lead) => {
    const createdTime = new Date(lead.created_time).getTime();
    const contactedTime = new Date(lead.contacted_at).getTime();
    return sum + (contactedTime - createdTime);
  }, 0);

  // Retornar em horas
  return Math.round(totalTime / (convertedLeads.length * 1000 * 60 * 60));
}

function calculateQualificationRate(leads) {
  if (leads.length === 0) return 0;
  
  const qualifiedOrConverted = leads.filter(l => 
    l.status === 'qualified' || l.status === 'converted'
  ).length;
  
  return ((qualifiedOrConverted / leads.length) * 100).toFixed(1);
}

// Hook para exportação
export function useLeadExport() {
  const exportToCSV = async (leads, filename = null) => {
    try {
      const csvData = leads.map(lead => ({
        'ID': lead.lead_id || lead.id,
        'Nome': lead.full_name || '',
        'Email': lead.email || '',
        'Telefone': lead.phone || '',
        'Status': lead.status || '',
        'Campanha': lead.campaign_name || lead.campaign_id || '',
        'Data Criação': new Date(lead.created_time).toLocaleDateString('pt-BR'),
        'Data Contato': lead.contacted_at ? new Date(lead.contacted_at).toLocaleDateString('pt-BR') : '',
        'Cidade': lead.form_data?.cidade || '',
        'Interesse': lead.form_data?.interest || '',
        'Pontuação': lead.quality_score || '',
        'Interações': lead.lead_interactions?.length || 0
      }));

      const csvContent = [
        Object.keys(csvData[0]),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`))
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `leads_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw error;
    }
  };

  const exportToExcel = async (leads, filename = null) => {
    // Implementação futura para Excel
    console.log('Export para Excel em desenvolvimento');
  };

  return { exportToCSV, exportToExcel };
}