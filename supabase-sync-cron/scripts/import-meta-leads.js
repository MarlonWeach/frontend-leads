require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ACCOUNT_ID = process.env.META_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Função para obter a data de 30 dias atrás
function getStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

// Função para obter a data atual
function getEndDate() {
  return new Date().toISOString().split('T')[0];
}

async function fetchMetaLeads() {
  const startDate = getStartDate();
  const endDate = getEndDate();
  
  const url = `https://graph.facebook.com/v22.0/act_${ACCOUNT_ID}/insights?fields=ad_id,ad_name,adset_id,campaign_id,spend,impressions,clicks,cpc,cpm,ctr,results,actions,action_values&level=ad&time_increment=1&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${ACCESS_TOKEN}`;
  
  console.log('Buscando dados do Meta...');
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.error) {
    console.error('Erro ao buscar dados do Meta:', data.error);
    return [];
  }

  if (!data.data) {
    console.error('Resposta inválida do Meta:', data);
    return [];
  }

  const leads = [];
  
  // Processa cada anúncio
  for (const ad of data.data) {
    console.log('DEBUG AD:', ad); // <-- Log para depuração do objeto ad
    // Procura por leads nos resultados
    const leadResult = ad.results?.find(r => r.indicator === 'actions:onsite_conversion.lead_grouped');
    const leadCount = leadResult?.values?.[0]?.value ? parseInt(leadResult.values[0].value) : 0;

    // Cria apenas um registro com o total de leads
    leads.push({
      created_time: ad.date_start,
      ad_id: ad.ad_id,
      ad_name: ad.ad_name,
      adset_id: ad.adset_id,
      campaign_id: ad.campaign_id,
      spend: parseFloat(ad.spend),
      impressions: parseInt(ad.impressions),
      clicks: parseInt(ad.clicks),
      cpc: parseFloat(ad.cpc),
      cpm: parseFloat(ad.cpm),
      ctr: parseFloat(ad.ctr),
      lead_count: leadCount,
      raw_data: ad
    });
  }

  return leads;
}

async function upsertAdToSupabase(lead) {
  // Upsert do anúncio na tabela ads
  const { error } = await supabase.from('ads').upsert([{
    ad_id: lead.ad_id,
    ad_name: lead.ad_name,
    adset_id: lead.adset_id,
    campaign_id: lead.campaign_id,
    status: 'ACTIVE', // ou o status real se disponível
    spend: lead.spend,
    impressions: lead.impressions,
    clicks: lead.clicks,
    cpc: lead.cpc,
    cpm: lead.cpm,
    ctr: lead.ctr,
    leads_count: lead.lead_count,
    created_at: lead.created_time
  }]);
  if (error) {
    console.error('Erro ao upsert anúncio:', error);
  }
}

async function saveLeadToSupabase(lead) {
  // Evita duplicidade usando uma combinação única de campos
  const { data: existing, error: selectError } = await supabase
    .from('meta_leads')
    .select('id')
    .eq('created_time', lead.created_time)
    .eq('ad_id', lead.ad_id)
    .maybeSingle();

  if (selectError) {
    console.error('Erro ao verificar lead existente:', selectError);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from('meta_leads').insert([lead]);
    if (insertError) {
      console.error('Erro ao importar lead:', insertError);
    } else {
      console.log('Lead importado com sucesso:', lead.created_time, lead.ad_name);
    }
  } else {
    console.log('Lead já existe (ID:', existing.id, '):', lead.created_time, lead.ad_name);
  }
}

(async () => {
  try {
    console.log('Iniciando importação de leads do Meta...');
    const leads = await fetchMetaLeads();
    console.log(`Encontrados ${leads.length} leads para importar`);
    
    for (const lead of leads) {
      await upsertAdToSupabase(lead); // <-- Garante que o anúncio é salvo/atualizado
      await saveLeadToSupabase(lead);
    }
    
    console.log('Importação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a importação:', error);
    process.exit(1);
  }
})();