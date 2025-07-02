// src/services/metaLeadsService.js

import { logger } from '../utils/logger';

class MetaLeadsService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://graph.facebook.com/v23.0';
  }

  async getLeadForms(pageId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/leadgen_forms?access_token=${this.accessToken}&fields=id,name,status,locale,questions,privacy_policy_url,created_time`
      );
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error({
        msg: 'Erro ao buscar formulários de leads',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        pageId,
        baseUrl: this.baseUrl
      });
      throw error;
    }
  }

  async getLeadsFromForm(formId, options = {}) {
    try {
      const { limit = 100, since, until } = options;
      
      let url = `${this.baseUrl}/${formId}/leads?access_token=${this.accessToken}&fields=id,created_time,field_data,ad_id,adset_id,campaign_id,form_id,is_organic`;
      
      if (limit) url += `&limit=${limit}`;
      if (since) url += `&since=${since}`;
      if (until) url += `&until=${until}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      throw error;
    }
  }

  transformLeadData(metaLead) {
    const leadData = {
      lead_id: metaLead.id,
      form_id: metaLead.form_id,
      ad_id: metaLead.ad_id,
      adset_id: metaLead.adset_id,
      campaign_id: metaLead.campaign_id,
      created_time: metaLead.created_time,
      platform: 'facebook',
      form_data: {},
      email: null,
      phone: null,
      full_name: null
    };

    if (metaLead.field_data && Array.isArray(metaLead.field_data)) {
      metaLead.field_data.forEach(field => {
        const key = field.name.toLowerCase();
        const value = field.values?.[0] || '';

        switch (key) {
          case 'email':
            leadData.email = value;
            break;
          case 'phone_number':
          case 'phone':
            leadData.phone = this.formatPhone(value);
            break;
          case 'full_name':
          case 'name':
            leadData.full_name = value;
            break;
          default:
            leadData.form_data[key] = value;
        }
      });
    }

    return leadData;
  }

  formatPhone(phone) {
    if (!phone) return null;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      return `+55${cleanPhone}`;
    } else if (cleanPhone.length === 10) {
      return `+55${cleanPhone}`;
    }
    
    return cleanPhone;
  }
}

export default MetaLeadsService;