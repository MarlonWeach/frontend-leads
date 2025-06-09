const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FORM_IDS = process.env.META_FORM_ID.split(',').map(id => id.trim());
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

async function fetchMetaLeads(formId) {
  const url = `https://graph.facebook.com/v18.0/${formId}/leads?access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.data) {
    console.error('Erro ao buscar leads do Meta:', data);
    return [];
  }
  return data.data.map(lead => {
    // Extrai campos comuns do lead
    const leadObj = {
      created_time: lead.created_time,
      ad_id: lead.ad_id,
      adset_id: lead.adset_id,
      campaign_id: lead.campaign_id,
      form_id: lead.form_id,
      raw_data: lead
    };
    // Extrai dados do formulário (full_name, email, phone, etc)
    if (Array.isArray(lead.field_data)) {
      lead.field_data.forEach(field => {
        const key = field.name.toLowerCase();
        const value = field.values?.[0] || '';
        if (['full_name', 'name'].includes(key)) leadObj.full_name = value;
        if (['email'].includes(key)) leadObj.email = value;
        if (['phone', 'phone_number'].includes(key)) leadObj.phone = value;
      });
    }
    return leadObj;
  });
}

async function saveLeadToSupabase(lead) {
  // Evita duplicidade pelo created_time + form_id + ad_id
  const { data: existing } = await supabase
    .from('meta_leads')
    .select('id')
    .eq('created_time', lead.created_time)
    .eq('form_id', lead.form_id)
    .eq('ad_id', lead.ad_id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('meta_leads').insert([lead]);
    console.log('Lead importado:', lead.created_time, lead.email || '');
  } else {
    console.log('Lead já existe:', lead.created_time, lead.email || '');
  }
}

(async () => {
  for (const formId of FORM_IDS) {
    const leads = await fetchMetaLeads(formId);
    for (const lead of leads) {
      await saveLeadToSupabase(lead);
    }
  }
})();