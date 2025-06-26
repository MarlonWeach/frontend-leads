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

// Função para obter o account ID com prefixo
function getAccountId() {
  const accountId = META_ACCOUNT_ID;
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

// Função para fazer requisição à Meta API
async function makeMetaRequest(path, params = {}) {
  const url = `https://graph.facebook.com/v19.0/${path}`;
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

// Função para buscar insights de um adset
async function getAdsetInsights(adsetId, startDate, endDate) {
  console.log(`📊 Buscando insights do adset ${adsetId} de ${startDate} a ${endDate}`);
  
  const params = {
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,unique_clicks,unique_ctr,actions',
    time_range: JSON.stringify({
      since: startDate,
      until: endDate
    }),
    time_increment: '1', // Dados diários
    limit: 1000
  };

  const response = await makeMetaRequest(`${adsetId}/insights`, params);
  return response.data || [];
}

// Função para processar insights e extrair leads
function processInsights(insights, adsetContext) {
  return insights.map(insight => {
    // Logar insight bruto para debug
    console.log('[DEBUG] Insight bruto:', JSON.stringify(insight, null, 2));
    // Extrair leads das actions
    let leads = 0;
    if (insight.actions) {
      // Usar apenas 'onsite_conversion.lead_grouped' para evitar duplicidade
      const leadAction = insight.actions.find(a => a.action_type === 'onsite_conversion.lead_grouped');
      if (leadAction && typeof leadAction.value !== 'undefined') {
        leads = parseInt(leadAction.value) || 0;
      }
    }
    // Logar insight bruto se leads for zero
    if (leads === 0) {
      console.log('[DEBUG] Insight sem leads:', JSON.stringify(insight, null, 2));
    }
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

// Função para buscar adsets ativos
async function getActiveAdsets() {
  console.log('🔍 Buscando adsets ativos no Supabase...');
  
  const { data: adsets, error } = await supabase
    .from('adsets')
    .select('id, name, effective_status')
    .eq('effective_status', 'ACTIVE');

  if (error) {
    console.error('❌ Erro ao buscar adsets:', error);
    throw error;
  }

  console.log(`📋 Encontrados ${adsets.length} adsets ativos`);
  return adsets;
}

// Função principal de sincronização
async function syncAdsetInsights(startDate, endDate) {
  console.log(`🚀 Iniciando sincronização de insights de adsets de ${startDate} a ${endDate}`);
  
  try {
    // Buscar adsets ativos
    const adsets = await getActiveAdsets();
    
    if (adsets.length === 0) {
      console.log('⚠️  Nenhum adset ativo encontrado');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Processar cada adset
    for (const adset of adsets) {
      try {
        console.log(`\n📊 Processando adset: ${adset.name} (${adset.id})`);
        
        // Buscar insights da Meta API
        const insights = await getAdsetInsights(adset.id, startDate, endDate);
        
        if (insights.length === 0) {
          console.log(`⚠️  Nenhum insight encontrado para o adset ${adset.name}`);
          continue;
        }

        // Processar insights
        const processedInsights = processInsights(insights, { adset_id: adset.id, adset_name: adset.name, campaign_id: adset.campaign_id, account_id: adset.account_id, status: adset.effective_status });
        
        // Fazer upsert no Supabase
        const success = await upsertAdsetInsights(adset.id, adset.name, processedInsights);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro ao processar adset ${adset.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Sincronização concluída!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total de adsets processados: ${adsets.length}`);

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    process.exit(1);
  }
}

// Função para obter datas padrão (últimos 7 dias)
function getDefaultDateRange() {
  // Usar timezone de São Paulo (UTC-3)
  const now = new Date();
  const saoPauloOffset = -3 * 60; // UTC-3 em minutos
  const localOffset = now.getTimezoneOffset(); // Offset local em minutos
  const totalOffset = saoPauloOffset + localOffset;
  
  const endDate = new Date(now.getTime() + totalOffset * 60 * 1000);
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
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
    const uniqueAdsets = [...new Set(data.map(r => r.adset_id))];
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
  getAdsetInsights,
  processInsights
};