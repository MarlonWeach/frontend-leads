// src/services/leadsService.js

import { supabase } from '../lib/supabaseClient';
import MetaLeadsService from './metaLeadsService';

class LeadsService {
  constructor() {
    this.metaService = new MetaLeadsService();
  }

  async getLeads(filters = {}) {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          lead_interactions(
            id,
            interaction_type,
            title,
            created_at
          )
        `)
        .order('created_time', { ascending: false });

      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.date_from) {
        query = query.gte('created_time', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_time', filters.date_to);
      }

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        );
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      throw error;
    }
  }

  async updateLeadStatus(leadId, status, notes = null) {
    try {
      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'contacted' && !notes) {
        updateData.contacted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      if (notes) {
        await this.addLeadInteraction(leadId, {
          interaction_type: 'note',
          title: `Status alterado para ${status}`,
          description: notes
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  async addLeadInteraction(leadId, interaction) {
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
  }

  async getLeadMetrics(filters = {}) {
    try {
      let query = supabase.from('leads').select('*');

      if (filters.date_from) {
        query = query.gte('created_time', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_time', filters.date_to);
      }
      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      const metrics = {
        total_leads: leads.length,
        new_leads: leads.filter(l => l.status === 'new').length,
        contacted_leads: leads.filter(l => l.status === 'contacted').length,
        qualified_leads: leads.filter(l => l.status === 'qualified').length,
        converted_leads: leads.filter(l => l.status === 'converted').length,
        conversion_rate: leads.length > 0 ? 
          (leads.filter(l => l.status === 'converted').length / leads.length * 100).toFixed(2) : 0
      };

      return metrics;
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      throw error;
    }
  }
}

export default LeadsService;