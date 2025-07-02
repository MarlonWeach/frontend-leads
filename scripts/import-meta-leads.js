const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

console.log('DEBUG: SUPABASE_URL lido do ambiente:', process.env.SUPABASE_URL);

const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Removido: Usar a API fetch nativa do Node.js

const ACCOUNT_ID = process.env.META_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// META_FORM_ID não é necessário para este script - removido

async function fetchMetaLeads() {
  const allLeads = [];
  
  // Buscar dados dos últimos 30 dias (evita timeout da API)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];

  console.log(`🔄 Buscando dados do Meta para os últimos 30 dias: ${formattedStartDate} a ${formattedEndDate}...`);
  
  const url = `https://graph.facebook.com/v22.0/act_${ACCOUNT_ID}/insights?fields=ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,cpc,cpm,ctr,results,actions,action_values&level=ad&time_increment=1&time_range={"since":"${formattedStartDate}","until":"${formattedEndDate}"}&access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error(`❌ Erro ao buscar dados do Meta:`, data.error);
      return allLeads;
    } else if (data.data) {
      console.log(`📊 Processando ${data.data.length} registros de anúncios...`);
      
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
      
      console.log(`✅ ${allLeads.length} registros válidos encontrados`);
    } else {
      console.log(`⚠️  Nenhum dado encontrado para o período`);
    }
  } catch (fetchError) {
    console.error(`❌ Erro de rede ou fetch:`, fetchError);
  }

  return allLeads;
}

async function saveLeadToSupabase(lead) {
  try {
    // Evita duplicidade pelo created_time + ad_id
    const { data: existing } = await supabase
      .from('meta_leads')
      .select('id')
      .eq('created_time', lead.created_time)
      .eq('ad_id', lead.ad_id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('meta_leads').insert([lead]);
      if (error) {
        console.error('Erro ao inserir lead:', error);
      } else {
        console.log('Lead importado:', lead.created_time, lead.ad_id);
      }
    } else {
      console.log('Lead já existe:', lead.created_time, lead.ad_id);
    }
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
  }
}

async function main() {
  try {
    console.log('🔄 Iniciando importação de leads do Meta...');
    console.log(`📊 Account ID: ${ACCOUNT_ID}`);
    console.log(`🔑 Access Token: ${ACCESS_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO'}`);
    
    if (!ACCOUNT_ID || !ACCESS_TOKEN) {
      throw new Error('META_ACCOUNT_ID e META_ACCESS_TOKEN são obrigatórios');
    }
    
    const leads = await fetchMetaLeads();
    console.log(`📈 Total de leads encontrados: ${leads.length}`);
    
    for (const lead of leads) {
      await saveLeadToSupabase(lead);
    }
    
    console.log('✅ Importação de leads concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na importação de leads:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}