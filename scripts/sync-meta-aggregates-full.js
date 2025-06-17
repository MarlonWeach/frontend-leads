const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const accountId = process.env.META_ACCOUNT_ID.startsWith('act_') ? process.env.META_ACCOUNT_ID : `act_${process.env.META_ACCOUNT_ID}`;
const accessToken = process.env.META_ACCESS_TOKEN;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Configuração de período (últimos 7 dias por padrão)
const dateTo = new Date();
const dateFrom = new Date();
dateFrom.setDate(dateTo.getDate() - 7);

const formatDate = d => d.toISOString().split('T')[0];

async function fetchMetaAggregates(level) {
  const fields = [
    'campaign_name',
    'adset_name', 
    'ad_name',
    'campaign_id',
    'adset_id',
    'ad_id',
    'impressions',
    'clicks',
    'spend',
    'cpm',
    'ctr',
    'actions',
    'date_start',
    'date_stop'
  ];
  
  const url = `https://graph.facebook.com/v19.0/${accountId}/insights?level=${level}&fields=${fields.join(',')}&time_range={\"since\":\"${formatDate(dateFrom)}\",\"until\":\"${formatDate(dateTo)}\"}&filtering=[{\"field\":\"ad.effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\"]}]&access_token=${accessToken}`;
  
  console.log(`🔍 Buscando dados de ${level} da Meta API...`);
  const res = await fetch(url);
  const json = await res.json();
  
  if (!json.data) {
    console.error('❌ Erro ao buscar dados da Meta API:', json);
    return [];
  }
  
  console.log(`✅ ${json.data.length} registros encontrados para ${level}`);
  return json.data;
}

async function clearExistingData() {
  console.log('🧹 Limpando dados existentes do período...');
  const { error } = await supabase
    .from('meta_leads')
    .delete()
    .gte('created_time', formatDate(dateFrom))
    .lte('created_time', formatDate(dateTo));
    
  if (error) {
    console.error('❌ Erro ao limpar dados:', error);
    return false;
  }
  
  console.log('✅ Dados existentes removidos');
  return true;
}

async function insertAggregates(level, data) {
  console.log(`📥 Inserindo dados de ${level} no Supabase...`);
  
  const records = data.map(row => {
    const leads = parseInt((row.actions || []).find(a => a.action_type === 'lead')?.value || 0);
    const clicks = parseInt(row.clicks) || 0;
    const impressions = parseInt(row.impressions) || 0;
    const spend = parseFloat(row.spend) || 0;
    const ctr = parseFloat(row.ctr) || 0;
    const cpm = parseFloat(row.cpm) || 0;
    
    return {
      campaign_name: row.campaign_name,
      adset_name: row.adset_name || null,
      ad_name: row.ad_name || null,
      campaign_id: row.campaign_id,
      adset_id: row.adset_id || null,
      ad_id: row.ad_id || null,
      lead_count: leads,
      spend: spend,
      impressions: impressions,
      clicks: clicks,
      ctr: ctr,
      cpm: cpm,
      created_time: row.date_start
    };
  });
  
  const { error } = await supabase
    .from('meta_leads')
    .insert(records);
    
  if (error) {
    console.error('❌ Erro ao inserir dados:', error);
    return false;
  }
  
  console.log(`✅ ${records.length} registros inseridos para ${level}`);
  return true;
}

async function validateSync() {
  console.log('🔍 Validando sincronização...');
  
  // Buscar totais do Supabase
  const { data: supabaseData, error: supabaseError } = await supabase
    .from('meta_leads')
    .select('lead_count, spend, impressions, clicks')
    .gte('created_time', formatDate(dateFrom))
    .lte('created_time', formatDate(dateTo));
    
  if (supabaseError) {
    console.error('❌ Erro ao buscar dados do Supabase:', supabaseError);
    return false;
  }
  
  const supabaseTotals = supabaseData.reduce((acc, row) => {
    acc.leads += row.lead_count || 0;
    acc.spend += parseFloat(row.spend) || 0;
    acc.impressions += parseInt(row.impressions) || 0;
    acc.clicks += parseInt(row.clicks) || 0;
    return acc;
  }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });
  
  // Buscar totais da Meta API
  const metaData = await fetchMetaAggregates('campaign');
  const metaTotals = metaData.reduce((acc, row) => {
    const leads = parseInt((row.actions || []).find(a => a.action_type === 'lead')?.value || 0);
    acc.leads += leads;
    acc.spend += parseFloat(row.spend) || 0;
    acc.impressions += parseInt(row.impressions) || 0;
    acc.clicks += parseInt(row.clicks) || 0;
    return acc;
  }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });
  
  console.log('\n📊 Comparação de Totais:');
  console.log('Supabase:', supabaseTotals);
  console.log('Meta API:', metaTotals);
  
  const isEqual = 
    Math.abs(supabaseTotals.leads - metaTotals.leads) < 1 &&
    Math.abs(supabaseTotals.spend - metaTotals.spend) < 0.01 &&
    Math.abs(supabaseTotals.impressions - metaTotals.impressions) < 1 &&
    Math.abs(supabaseTotals.clicks - metaTotals.clicks) < 1;
    
  if (isEqual) {
    console.log('✅ Sincronização validada com sucesso!');
  } else {
    console.log('❌ Divergências encontradas na validação');
  }
  
  return isEqual;
}

async function main() {
  console.log('🚀 Iniciando sincronização FULL de dados agregados');
  console.log(`📅 Período: ${formatDate(dateFrom)} a ${formatDate(dateTo)}`);
  console.log(`🏢 Account ID: ${accountId}`);
  console.log('');
  
  try {
    // 1. Limpar dados existentes
    const cleared = await clearExistingData();
    if (!cleared) {
      console.log('❌ Falha ao limpar dados existentes');
      return;
    }
    
    // 2. Buscar e inserir dados por nível
    const levels = ['campaign']; // Apenas campaign para evitar duplicação
    for (const level of levels) {
      const data = await fetchMetaAggregates(level);
      if (data.length > 0) {
        const inserted = await insertAggregates(level, data);
        if (!inserted) {
          console.log(`❌ Falha ao inserir dados de ${level}`);
          return;
        }
      }
    }
    
    // 3. Validar sincronização
    await validateSync();
    
    console.log('\n🎉 Sincronização FULL concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
  }
}

main(); 