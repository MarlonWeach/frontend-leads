require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configurações de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCESS_TOKEN = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
  throw new Error('Variáveis de ambiente obrigatórias não configuradas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurações de otimização - Reduzidas para evitar rate limiting
const CONCURRENT_REQUESTS = 1; // Apenas 1 requisição por vez
const BATCH_SIZE = 100; // Tamanho do lote para Supabase
const INSIGHTS_BATCH = 25; // Reduzido para menos adsets por chamada
const RATE_LIMIT_DELAY = 2000; // Delay de 2 segundos entre requisições
const TRAFFIC_DAYS = 60; // Período de tráfego para verificar
const META_API_VERSION = 'v25.0';

// Certifique-se de que o accountId sempre tenha o prefixo 'act_'
const getAccountId = () => {
  if (META_ACCOUNT_ID && !META_ACCOUNT_ID.startsWith('act_')) {
    return `act_${META_ACCOUNT_ID}`;
  }
  return META_ACCOUNT_ID;
};

// Função para fazer requisições com rate limiting
async function makeRateLimitedRequest(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔗 Fazendo requisição: ${url.substring(0, 100)}...`);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      if (response.status === 429) { // Rate limit
        const delay = Math.pow(2, i) * 1000; // Backoff exponencial
        console.log(`⚠️ Rate limit atingido, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para erro 400, vamos ver o que está sendo retornado
      if (response.status === 400) {
        const errorText = await response.text();
        console.error(`❌ Erro 400 na requisição:`);
        console.error(`URL: ${url.substring(0, 200)}...`);
        console.error(`Resposta: ${errorText}`);
        throw new Error(`Erro 400: ${errorText}`);
      }
      
      // Para outros erros
      const errorText = await response.text();
      console.error(`❌ Erro ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
      
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1} falhou:`, error.message);
      
      if (i === retries - 1) {
        throw error; // Última tentativa falhou
      }
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função para processar requisições em paralelo com limite de concorrência
async function processConcurrently(items, processFunction, concurrency = CONCURRENT_REQUESTS) {
  const results = [];
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkPromises = chunk.map(async (item, index) => {
      try {
        const result = await processFunction(item);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        return result;
      } catch (error) {
        console.warn(`⚠️ Erro ao processar item ${index}:`, error.message);
        return null;
      }
    });
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults.filter(r => r !== null));
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }
  return results;
}

// Buscar todos os adsets paginados
async function getAdsetsFromMeta() {
  const accountId = getAccountId();
  const allAdsets = [];
  let after = null;
  let pageCount = 0;
  try {
    do {
      pageCount++;
      let url = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/adsets?fields=id,name,status,effective_status,campaign_id,created_time,start_time,end_time,updated_time,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting&limit=100&access_token=${META_ACCESS_TOKEN}`;
      if (after) {
        url += `&after=${after}`;
      }
      const data = await makeRateLimitedRequest(url);
      if (data.error) {
        throw new Error(`Erro da Meta API: ${data.error.message}`);
      }
      if (data.data && Array.isArray(data.data)) {
        allAdsets.push(...data.data);
      }
      if (data.paging && data.paging.cursors && data.paging.cursors.after) {
        after = data.paging.cursors.after;
      } else {
        after = null;
      }
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * 2)); // Delay maior entre páginas
    } while (after);
    return allAdsets;
  } catch (error) {
    console.error('❌ Erro ao buscar adsets da Meta API:', error);
    throw error;
  }
}

// Buscar insights em lote para vários adsets
async function getAdsetsTrafficBatch(adsetIds) {
  if (adsetIds.length === 0) return {};
  const idsParam = adsetIds.join(',');
  // Usar last_90d que é um valor válido aceito pela API da Meta
  const url = `https://graph.facebook.com/${META_API_VERSION}/?ids=${idsParam}&fields=insights{impressions,clicks,spend}&date_preset=last_90d&access_token=${META_ACCESS_TOKEN}`;
  const data = await makeRateLimitedRequest(url);
  // Retorna um objeto: { adset_id1: { insights: [...] }, adset_id2: { insights: [...] }, ... }
  return data;
}

// Função para aplicar filtros e buscar insights em lote
async function applyOptimizedFilters(adsets) {
  // Filtro 1: Apenas adsets ativos ou recentemente ativos (últimos 90 dias)
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const activeAdsets = adsets.filter(adset =>
    adset.status === 'ACTIVE' ||
    adset.effective_status === 'ACTIVE' ||
    (adset.created_time && new Date(adset.created_time) > cutoffDate) ||
    (adset.updated_time && new Date(adset.updated_time) > cutoffDate)
  );
  
  // Filtro 2: Verificar se as campanhas existem no banco
  const campaignIds = Array.from(new Set(activeAdsets.map(adset => adset.campaign_id)));
  const { data: existingCampaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .in('id', campaignIds);
  
  if (campaignError) {
    console.error('❌ Erro ao verificar campanhas existentes:', campaignError);
    throw new Error('Falha ao verificar campanhas existentes');
  }
  
  const existingCampaignIds = new Set(existingCampaigns.map(c => c.id));
  const adsetsWithValidCampaigns = activeAdsets.filter(adset => 
    existingCampaignIds.has(adset.campaign_id)
  );
  
  console.log(`📊 ${activeAdsets.length} adsets ativos, ${adsetsWithValidCampaigns.length} com campanhas válidas`);
  
  // Filtro 3: Buscar insights em lote
  const adsetIdList = adsetsWithValidCampaigns.map(a => a.id);
  const adsetBatches = [];
  for (let i = 0; i < adsetIdList.length; i += INSIGHTS_BATCH) {
    adsetBatches.push(adsetIdList.slice(i, i + INSIGHTS_BATCH));
  }
  let adsetsWithTraffic = [];
  for (let i = 0; i < adsetBatches.length; i++) {
    const batchIds = adsetBatches[i];
    const insightsData = await getAdsetsTrafficBatch(batchIds);
    for (const adsetId of batchIds) {
      const adset = adsetsWithValidCampaigns.find(a => a.id === adsetId);
      const insights = insightsData[adsetId]?.insights?.data || [];
      const totalImpressions = insights.reduce((sum, day) => sum + (parseInt(day.impressions) || 0), 0);
      const totalClicks = insights.reduce((sum, day) => sum + (parseInt(day.clicks) || 0), 0);
      const totalSpend = insights.reduce((sum, day) => sum + (parseFloat(day.spend) || 0), 0);
      if (totalImpressions > 0) {
        adsetsWithTraffic.push({
          ...adset,
          totalImpressions,
          totalClicks,
          totalSpend
        });
      }
    }
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  }
  return adsetsWithTraffic;
}

// Função otimizada para fazer o upsert dos dados dos adsets no Supabase
async function upsertAdsets(adsetsData) {
  const recordsToUpsert = adsetsData.map(adset => ({
    id: adset.id,
    name: adset.name,
    status: adset.status,
    effective_status: adset.effective_status,
    campaign_id: adset.campaign_id,
    created_time: adset.created_time,
    start_time: adset.start_time,
    end_time: adset.end_time,
    daily_budget: adset.daily_budget,
    lifetime_budget: adset.lifetime_budget,
    optimization_goal: adset.optimization_goal,
    billing_event: adset.billing_event,
    targeting: adset.targeting,
    last_synced: new Date().toISOString(),
    impressions: adset.totalImpressions,
    clicks: adset.totalClicks,
    spend: adset.totalSpend
  }));
  try {
    const batches = [];
    for (let i = 0; i < recordsToUpsert.length; i += BATCH_SIZE) {
      batches.push(recordsToUpsert.slice(i, i + BATCH_SIZE));
    }
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const { error } = await supabase
        .from('adsets')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
      if (error) {
        console.error(`❌ Erro ao fazer upsert do lote ${i + 1}:`, error);
        return { success: false, error };
      }
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Erro inesperado na operação de upsert dos adsets:', error);
    return { success: false, error };
  }
}

// Função principal de sincronização
async function syncAdsets() {
  const startTime = new Date();
  try {
    const adsets = await getAdsetsFromMeta();
    const adsetsWithTraffic = await applyOptimizedFilters(adsets);
    const upsertResult = await upsertAdsets(adsetsWithTraffic);
    if (!upsertResult.success) {
      throw new Error('Falha no upsert dos adsets para o Supabase.');
    }
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationSeconds = Math.round(durationMs / 1000);
    return {
      status: {
        success: true,
        totalAds: adsetsWithTraffic.length,
        activeAds: adsetsWithTraffic.filter(a => a.status === 'ACTIVE').length,
        details: {
          durationMs: durationMs,
          durationSeconds: durationSeconds,
        },
      },
      data: adsetsWithTraffic,
    };
  } catch (error) {
    console.error('❌ Erro durante a sincronização de adsets:', error);
    const endTime = new Date();
    return {
      status: {
        success: false,
        totalAds: 0,
        activeAds: 0,
        error: error.message,
        details: {
          durationMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };
  }
}

async function main() {
  console.log('🔄 Iniciando sincronização otimizada de adsets (API v25.0, insights em lote)...');
  console.log(`⚙️  Configurações: ${CONCURRENT_REQUESTS} requisições simultâneas, lotes de ${BATCH_SIZE}, ${TRAFFIC_DAYS} dias de tráfego, ${INSIGHTS_BATCH} adsets por chamada de insights`);
  try {
    const result = await syncAdsets();
    if (result.status.success) {
      console.log('✅ Sincronização concluída com sucesso!');
      console.log(`📊 ${result.status.totalAds} adsets sincronizados`);
      console.log(`🟢 ${result.status.activeAds} adsets ativos`);
      console.log(`⏱️  Duração: ${result.status.details.durationSeconds}s (${result.status.details.durationMs}ms)`);
    } else {
      console.error('❌ Erro na sincronização:', result.status.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

main(); 