<<<<<<< HEAD
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

console.log('DEBUG: SUPABASE_URL lido do ambiente:', process.env.SUPABASE_URL);

const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Removido: Usar a API fetch nativa do Node.js
=======
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
>>>>>>> 947ce58 (Primeiro commit)

const ACCOUNT_ID = process.env.META_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

<<<<<<< HEAD
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FORM_IDS = process.env.META_FORM_ID.split(',').map(id => id.trim());

async function fetchMetaLeads() {
  const allLeads = [];
  // Define a data de início para 37 meses atrás a partir da data atual
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 37);
  startDate.setDate(1); // Define para o primeiro dia do mês para consistência

  let endDate = new Date(); // Data atual
  let currentChunkEnd = new Date(startDate); // Inicia com a data de início do chunk

  while (startDate < endDate) {
    currentChunkEnd = new Date(startDate);
    currentChunkEnd.setDate(startDate.getDate() + 29); // Define o fim do chunk (29 dias para um total de 30 dias)
    if (currentChunkEnd > endDate) {
      currentChunkEnd = endDate; // Não ultrapassar a data final
    }

    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = currentChunkEnd.toISOString().split('T')[0];

    console.log(`Buscando dados do Meta para o período: ${formattedStartDate} a ${formattedEndDate}...`);
    
    const url = `https://graph.facebook.com/v22.0/act_${ACCOUNT_ID}/insights?fields=ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,cpc,cpm,ctr,results,actions,action_values&level=ad&time_increment=1&time_range={'since':'${formattedStartDate}','until':'${formattedEndDate}'}&access_token=${ACCESS_TOKEN}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) {
        console.error(`Erro ao buscar dados do Meta para ${formattedStartDate} a ${formattedEndDate}:`, data.error);
        // Continua para o próximo chunk mesmo se houver erro em um
      } else if (data.data) {
        for (const ad of data.data) {
          const leadResult = ad.results?.find(r => r.indicator === 'actions:onsite_conversion.lead_grouped');
          const leadCount = parseInt(leadResult?.values?.[0]?.value || 0);

          // Adiciona somente se houver leads ou outras métricas (não apenas um registro vazio)
          if (leadCount > 0 || parseFloat(ad.spend || 0) > 0 || parseInt(ad.impressions || 0) > 0 || parseInt(ad.clicks || 0) > 0) {
            allLeads.push({
              created_time: ad.date_start,
              ad_id: ad.ad_id,
              ad_name: ad.ad_name,
              campaign_id: ad.campaign_id,
              adset_id: ad.adset_id,
              campaign_name: ad.campaign_name,
              adset_name: ad.adset_name,
              spend: parseFloat(ad.spend || 0),
              impressions: parseInt(ad.impressions || 0),
              clicks: parseInt(ad.clicks || 0),
              cpc: parseFloat(ad.cpc || 0),
              cpm: parseFloat(ad.cpm || 0),
              ctr: parseFloat(ad.ctr || 0),
              lead_count: leadCount,
              raw_data: ad
            });
          }
        }
      } else {
        console.log(`Nenhum dado encontrado para o período: ${formattedStartDate} a ${formattedEndDate}`);
      }
    } catch (fetchError) {
      console.error(`Erro de rede ou fetch para ${formattedStartDate} a ${formattedEndDate}:`, fetchError);
    }
    
    startDate.setDate(currentChunkEnd.getDate() + 1); // Avança para o próximo chunk
  }

  return allLeads;
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
=======
console.log('Meta Account ID:', ACCOUNT_ID);
console.log('Meta Access Token (parcial): ', ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 5)}...${ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 5)}` : 'N/A');

// Função para obter a data de 60 dias atrás
function getStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 60);
  return date.toISOString().split('T')[0];
}

// Função para obter a data atual
function getEndDate() {
  return new Date().toISOString().split('T')[0];
}

async function fetchMetaLeads() {
  const startDate = getStartDate();
  const endDate = getEndDate();
  
  console.log(`Buscando dados do Meta para o período: ${startDate} até ${endDate}`);

  const url = `https://graph.facebook.com/v23.0/act_${ACCOUNT_ID}/insights?fields=ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,cpc,cpm,ctr,results,actions,action_values&level=ad&time_increment=1&time_range={\"since\":\"${startDate}\",\"until\":\"${endDate}\"}&access_token=${ACCESS_TOKEN}&filtering=[{\'field\':\'ad.effective_status\',\'operator\':\'IN\',\'value\':[1,9,17]}]`;
  
  console.log('URL da Meta API:', url);
  console.log('Buscando dados do Meta...');
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('Resposta completa da Meta API:', JSON.stringify(data, null, 2));

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
    // Procura por leads nos resultados
    const leadResult = ad.results?.find(r => r.indicator === 'actions:onsite_conversion.lead_grouped');
    if (!leadResult?.values?.[0]?.value) continue;

    const leadCount = parseInt(leadResult.values[0].value);
    if (leadCount <= 0) continue;

    // Procura por leads nas ações
    const leadAction = ad.actions?.find(a => a.action_type === 'lead');
    if (!leadAction) continue;

    // Cria apenas um registro com o total de leads
    leads.push({
      created_at: ad.date_start,
      ad_id: ad.ad_id,
      ad_name: ad.ad_name,
      campaign_id: ad.campaign_id,
      adset_id: ad.adset_id,
      campaign_name: ad.campaign_name,
      adset_name: ad.adset_name,
      spend: parseFloat(ad.spend),
      impressions: parseInt(ad.impressions),
      clicks: parseInt(ad.clicks),
      cpc: parseFloat(ad.cpc),
      cpm: parseFloat(ad.cpm),
      ctr: parseFloat(ad.ctr),
      leads_count: leadCount,
      status: 'ACTIVE',
      raw_data: ad
    });
  }

  return leads;
}

async function processLeads(leads, accessToken) {
  console.log(`\nProcessando ${leads.length} leads...`);
  
  // Agrupar leads por campanha e data
  const groupedLeads = leads.reduce((acc, lead) => {
    const key = `${lead.campaign_name}_${lead.created_at.split('T')[0]}`;
    if (!acc[key]) {
      acc[key] = {
        campaign_name: lead.campaign_name,
        created_at: lead.created_at,
        leads_count: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ad_name: lead.ad_name,
        adset_name: lead.adset_name,
        status: 'ACTIVE'
      };
    }
    
    // Acumular métricas
    acc[key].leads_count += (lead.leads_count || 0);
    acc[key].spend += parseFloat(lead.spend || 0);
    acc[key].impressions += parseInt(lead.impressions || 0);
    acc[key].clicks += parseInt(lead.clicks || 0);
    
    return acc;
  }, {});

  // Converter para array e ordenar por data
  const processedLeads = Object.values(groupedLeads)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Verificar duplicações antes de inserir
  for (const lead of processedLeads) {
    const { data: existing } = await supabase
      .from('ads')
      .select('id')
      .eq('campaign_name', lead.campaign_name)
      .eq('created_at', lead.created_at)
      .single();

    if (existing) {
      console.log(`⚠️ Lead já existe para campanha ${lead.campaign_name} em ${lead.created_at}`);
      continue;
    }

    // Inserir lead no Supabase
    const { error } = await supabase
      .from('ads')
      .insert([{
        campaign_name: lead.campaign_name,
        created_at: lead.created_at,
        leads_count: lead.leads_count,
        spend: lead.spend,
        impressions: lead.impressions,
        clicks: lead.clicks,
        ad_name: lead.ad_name,
        adset_name: lead.adset_name,
        status: lead.status
      }]);

    if (error) {
      console.error(`❌ Erro ao inserir lead para campanha ${lead.campaign_name}:`, error);
    } else {
      console.log(`✅ Lead inserido para campanha ${lead.campaign_name} (${lead.leads_count} leads)`);
    }
  }

  return processedLeads.length;
}

(async () => {
  try {
    console.log('Iniciando importação de leads do Meta...');
    const leads = await fetchMetaLeads();
    console.log(`Encontrados ${leads.length} leads para importar`);
    
    await processLeads(leads, ACCESS_TOKEN);
    
    console.log('Importação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a importação:', error);
    process.exit(1);
>>>>>>> 947ce58 (Primeiro commit)
  }
})();