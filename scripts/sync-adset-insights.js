#!/usr/bin/env node

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configurações de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCESS_TOKEN = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
  console.error('❌ Variáveis de ambiente obrigatórias não configuradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DEFAULT_INSIGHTS_DAYS = Math.min(
  90,
  Math.max(1, parseInt(process.env.SYNC_INSIGHTS_DAYS || '30', 10) || 30)
);
const GRAPH_VERSION = 'v25.0';
const PAGE_SLEEP_MS = 400;
const UPSERT_CHUNK_SIZE = 200;

// Função para obter o account ID com prefixo
function getAccountId() {
  const accountId = META_ACCOUNT_ID;
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

// Regra alinhada ao relatório "Leads" da Meta (evita inflar com múltiplas ações de lead)
function aggregateLeadsFromInsight(insight) {
  const actionRows = Array.isArray(insight.actions) ? insight.actions : [];
  const preferredAction = actionRows.find(
    (action) => action?.action_type === 'onsite_conversion.lead_grouped'
  );
  if (preferredAction) {
    return Number(preferredAction.value) || 0;
  }

  const resultRows = Array.isArray(insight.results) ? insight.results : [];
  const preferredResult = resultRows.find(
    (result) => String(result?.indicator || '').toLowerCase() === 'leads'
  );
  if (preferredResult) {
    return Number(preferredResult?.values?.[0]?.value) || 0;
  }

  const fallbackAction = actionRows.find((action) =>
    String(action?.action_type || '').toLowerCase().includes('lead')
  );
  return fallbackAction ? Number(fallbackAction.value) || 0 : 0;
}

// Função para fazer requisição à Meta API
async function makeMetaRequest(path, params = {}) {
  const url = `https://graph.facebook.com/v25.0/${path}`;
  const queryParams = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    ...params
  });

  try {
    const response = await axios.get(`${url}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro na requisição à Meta API:', error.response?.data || error.message);
    throw error;
  }
}

// Busca insights em lote no nível adset para reduzir carga e evitar rate limit
async function getAccountAdsetInsights(startDate, endDate) {
  const accountId = getAccountId();
  const timeRange = encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }));
  const fields = encodeURIComponent(
    'adset_id,adset_name,date_start,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,unique_clicks,unique_ctr,actions,results'
  );
  let url = `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights?fields=${fields}&level=adset&time_increment=1&time_range=${timeRange}&limit=500&access_token=${META_ACCESS_TOKEN}`;
  const allRows = [];

  while (url) {
    const response = await axios.get(url);
    const payload = response?.data || {};
    const rows = Array.isArray(payload.data) ? payload.data : [];
    allRows.push(...rows);
    url = payload?.paging?.next || null;
    if (url) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_SLEEP_MS));
    }
  }

  return allRows;
}

// Função para processar insights e extrair leads
function processInsights(insights, adsetContext) {
  return insights.map(insight => {
    const leads = aggregateLeadsFromInsight(insight);
    return {
      date: insight.date_start,
      spend: parseFloat(insight.spend || 0),
      impressions: parseInt(insight.impressions || 0),
      clicks: parseInt(insight.clicks || 0),
      ctr: parseFloat(insight.ctr || 0),
      cpc: parseFloat(insight.cpc || 0),
      cpm: parseFloat(insight.cpm || 0),
      leads: leads,
      reach: parseInt(insight.reach || 0),
      frequency: parseFloat(insight.frequency || 0),
      unique_clicks: parseInt(insight.unique_clicks || 0),
      unique_ctr: parseFloat(insight.unique_ctr || 0),
      unique_link_clicks: 0, // Campo não disponível na API
      unique_link_clicks_ctr: 0, // Campo não disponível na API
      social_spend: 0, // Campo não disponível na API
      social_impressions: 0, // Campo não disponível na API
      adset_id: adsetContext.adset_id,
      adset_name: adsetContext.adset_name,
      campaign_id: adsetContext.campaign_id || null,
      account_id: adsetContext.account_id || null,
      status: adsetContext.status || null
    };
  });
}

// Função para fazer upsert dos insights no Supabase
async function upsertAdsetInsights(adsetId, adsetName, insights) {
  if (insights.length === 0) {
    console.log(`⚠️  Nenhum insight encontrado para o adset ${adsetName}`);
    return;
  }

  const recordsToUpsert = insights.map(insight => ({
    adset_id: adsetId,
    adset_name: adsetName,
    ...insight
  }));

  try {
    const { error } = await supabase
      .from('adset_insights')
      .upsert(recordsToUpsert, { 
        onConflict: 'adset_id,date',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ Erro ao fazer upsert dos insights do adset ${adsetName}:`, error);
      return false;
    }

    console.log(`✅ ${insights.length} insights sincronizados para o adset ${adsetName}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado no upsert do adset ${adsetName}:`, error);
    return false;
  }
}

// Função para buscar adsets elegíveis para sync histórico
async function getSyncableAdsets() {
  console.log('🔍 Buscando adsets elegíveis no Supabase...');
  
  const { data: adsets, error } = await supabase
    .from('adsets')
    .select('id, name, status, effective_status, campaign_id')
    .not('id', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar adsets:', error);
    throw error;
  }

  const syncableAdsets = (adsets || []).filter(adset => {
    const status = String(adset.status || adset.effective_status || '').toUpperCase();
    return status !== 'DELETED';
  });

  console.log(`📋 Encontrados ${syncableAdsets.length} adsets elegíveis (excluindo DELETED)`);
  return syncableAdsets;
}

// Função principal de sincronização
async function syncAdsetInsights(startDate, endDate) {
  console.log(`🚀 Iniciando sincronização de insights de adsets de ${startDate} a ${endDate}`);
  
  try {
    // Buscar adsets elegíveis para enriquecer contexto e filtrar DELETED
    const adsets = await getSyncableAdsets();
    const adsetContextMap = new Map(
      adsets.map((adset) => [
        String(adset.id),
        {
          adset_id: adset.id,
          adset_name: adset.name,
          campaign_id: adset.campaign_id,
          status: adset.effective_status || adset.status || null,
        },
      ])
    );
    
    if (adsets.length === 0) {
      console.log('⚠️  Nenhum adset elegível encontrado');
      return;
    }

    const apiRows = await getAccountAdsetInsights(startDate, endDate);
    console.log(`📥 Linhas recebidas da Meta API: ${apiRows.length}`);

    const rowsToUpsert = [];
    for (const row of apiRows) {
      const adsetId = String(row.adset_id || '');
      if (!adsetId) continue;
      const context = adsetContextMap.get(adsetId) || {
        adset_id: adsetId,
        adset_name: row.adset_name || adsetId,
        campaign_id: null,
        status: null,
      };
      rowsToUpsert.push(...processInsights([row], context));
    }

    let upserted = 0;
    for (let index = 0; index < rowsToUpsert.length; index += UPSERT_CHUNK_SIZE) {
      const chunk = rowsToUpsert.slice(index, index + UPSERT_CHUNK_SIZE);
      const { error } = await supabase
        .from('adset_insights')
        .upsert(chunk, { onConflict: 'adset_id,date', ignoreDuplicates: false });
      if (error) {
        console.error('❌ Erro no upsert de lote:', error);
        throw error;
      }
      upserted += chunk.length;
    }

    console.log(`\n🎉 Sincronização concluída!`);
    console.log(`📊 Adsets elegíveis mapeados: ${adsets.length}`);
    console.log(`📊 Registros processados: ${rowsToUpsert.length}`);
    console.log(`✅ Upserts aplicados: ${upserted}`);

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    process.exit(1);
  }
}

// Função para obter datas padrão (janela histórica configurável)
function getDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (DEFAULT_INSIGHTS_DAYS - 1));
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Execução do script
async function main() {
  const args = process.argv.slice(2);
  
  let startDate, endDate;
  let checkDataOnly = false;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check-data') {
      checkDataOnly = true;
    } else if (args[i] === '--start-date' && i + 1 < args.length) {
      startDate = args[i + 1];
      i++; // Skip next argument
    } else if (args[i] === '--end-date' && i + 1 < args.length) {
      endDate = args[i + 1];
      i++; // Skip next argument
    }
  }
  
  if (!startDate || !endDate) {
    const defaultRange = getDefaultDateRange();
    startDate = startDate || defaultRange.startDate;
    endDate = endDate || defaultRange.endDate;
    console.log(`📅 Usando período padrão: ${startDate} a ${endDate}`);
  }

  // NÃO ajustar datas para timezone de São Paulo
  // Usar as datas exatamente como recebidas
  console.log(`🔧 Configurações:`);
  console.log(`   Account ID: ${getAccountId()}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Período selecionado: ${startDate} a ${endDate}`);

  if (checkDataOnly) {
    await checkExistingData(startDate, endDate);
  } else {
    await syncAdsetInsights(startDate, endDate);
  }
}

// Função para verificar dados existentes
async function checkExistingData(startDate, endDate) {
  console.log(`🔍 Verificando dados existentes de ${startDate} a ${endDate}`);
  
  const { data, error } = await supabase
    .from('adset_insights')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar dados:', error);
    return;
  }

  console.log(`📊 Total de registros encontrados: ${data.length}`);
  
  if (data.length > 0) {
    const uniqueAdsets = Array.from(new Set(data.map(r => r.adset_id)));
    console.log(`📋 Adsets únicos com dados: ${uniqueAdsets.length}`);
    console.log(`📋 IDs dos adsets: ${uniqueAdsets.join(', ')}`);
    
    // Agrupar por adset
    const adsetData = {};
    data.forEach(record => {
      if (!adsetData[record.adset_id]) {
        adsetData[record.adset_id] = {
          name: record.adset_name,
          records: 0,
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalLeads: 0
        };
      }
      adsetData[record.adset_id].records++;
      adsetData[record.adset_id].totalSpend += record.spend;
      adsetData[record.adset_id].totalImpressions += record.impressions;
      adsetData[record.adset_id].totalClicks += record.clicks;
      adsetData[record.adset_id].totalLeads += record.leads;
    });

    console.log('\n📊 Resumo por adset:');
    Object.entries(adsetData).forEach(([adsetId, info]) => {
      console.log(`   ${info.name} (${adsetId}):`);
      console.log(`     Registros: ${info.records}`);
      console.log(`     Gasto total: R$ ${(info.totalSpend).toFixed(2)}`);
      console.log(`     Impressões: ${info.totalImpressions.toLocaleString()}`);
      console.log(`     Cliques: ${info.totalClicks.toLocaleString()}`);
      console.log(`     Leads: ${info.totalLeads}`);
    });
  } else {
    console.log('⚠️  Nenhum dado encontrado para o período especificado');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncAdsetInsights,
  getAccountAdsetInsights,
  processInsights,
  aggregateLeadsFromInsight
};