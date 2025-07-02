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

// Configurações de otimização - Mais conservadoras para evitar rate limiting
const RATE_LIMIT_DELAY = 5000; // 5 segundos entre requisições (aumentado)
const CONCURRENT_REQUESTS = 1; // Apenas 1 requisição por vez
const BATCH_SIZE = 10; // Reduzido para menos ads por requisição
const TRAFFIC_DAYS = 60; // Buscar tráfego dos últimos 60 dias
const MAX_PAGES = 20; // Limitar a 20 páginas para evitar rate limit

// Função para obter o account ID com prefixo
function getAccountId() {
  return META_ACCOUNT_ID.startsWith('act_') ? META_ACCOUNT_ID : `act_${META_ACCOUNT_ID}`;
}

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
        const delay = Math.pow(2, i) * 5000; // Backoff exponencial mais agressivo
        console.log(`⚠️ Rate limit atingido, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para erro 400 (rate limit da Meta API)
      if (response.status === 400) {
        const errorText = await response.text();
        if (errorText.includes('too many calls')) {
          const delay = Math.pow(2, i) * 10000; // Delay muito maior para rate limit da Meta
          console.log(`⚠️ Rate limit da Meta API atingido, aguardando ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
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
      
      const delay = Math.pow(2, i) * 5000;
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função otimizada para buscar ads da Meta API com paginação limitada
async function getAdsFromMeta() {
  const accountId = getAccountId();
  const allAds = [];
  let after = null;
  let pageCount = 0;
  
  console.log('🔍 Buscando ads da Meta API com paginação limitada...');
  console.log(`📊 Limite: ${MAX_PAGES} páginas para evitar rate limit`);
  
  try {
    do {
      pageCount++;
      
      // Parar se atingiu o limite de páginas
      if (pageCount > MAX_PAGES) {
        console.log(`⚠️ Limite de ${MAX_PAGES} páginas atingido. Parando para evitar rate limit.`);
        break;
      }
      
      let url = `https://graph.facebook.com/v23.0/${accountId}/ads?fields=id,name,status,adset_id,campaign_id,creative&limit=100&access_token=${META_ACCESS_TOKEN}`;
      
      if (after) {
        url += `&after=${after}`;
      }
      
      console.log(`📄 Buscando página ${pageCount}/${MAX_PAGES}...`);
      const data = await makeRateLimitedRequest(url);
      
      if (data.error) {
        console.error('❌ Erro na API Meta:', data.error);
        throw new Error(`Erro Meta API: ${data.error.message}`);
      }
      
      if (data.data && data.data.length > 0) {
        allAds.push(...data.data);
        console.log(`✅ Página ${pageCount}: ${data.data.length} ads encontrados`);
      }
      
      after = data.paging?.cursors?.after;
      
      // Rate limiting entre páginas (mais agressivo)
      if (after) {
        console.log(`⏳ Aguardando ${RATE_LIMIT_DELAY}ms antes da próxima página...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
      
    } while (after);
    
    console.log(`🎯 Total de ads encontrados: ${allAds.length}`);
    return allAds;
    
  } catch (error) {
    console.error('❌ Erro ao buscar ads:', error.message);
    throw error;
  }
}

// Função para buscar insights de múltiplos ads em lote (mais conservadora)
async function getAdsInsightsBatch(adIds) {
  if (adIds.length === 0) return [];
  
  const accountId = getAccountId();
  const insights = [];
  
  // Dividir em lotes menores
  for (let i = 0; i < adIds.length; i += BATCH_SIZE) {
    const batch = adIds.slice(i, i + BATCH_SIZE);
    const idsParam = batch.join(',');
    
    const url = `https://graph.facebook.com/v23.0/?ids=${idsParam}&fields=insights{impressions,clicks,spend,actions}&date_preset=last_90d&access_token=${META_ACCESS_TOKEN}`;
    
    try {
      console.log(`📊 Buscando insights para lote ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} ads)...`);
      const data = await makeRateLimitedRequest(url);
      
      if (data.error) {
        console.error('❌ Erro ao buscar insights:', data.error);
        continue;
      }
      
      // Processar cada ad do lote
      for (const adId of batch) {
        const adData = data[adId];
        if (adData && adData.insights && adData.insights.data && adData.insights.data.length > 0) {
          const insight = adData.insights.data[0];
          insights.push({
            ad_id: adId,
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            spend: parseFloat(insight.spend) || 0,
            has_traffic: true
          });
        }
      }
      
      // Rate limiting entre lotes (mais agressivo)
      if (i + BATCH_SIZE < adIds.length) {
        console.log(`⏳ Aguardando ${RATE_LIMIT_DELAY}ms antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
      
    } catch (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
      continue;
    }
  }
  
  return insights;
}

// Função para salvar ads no Supabase
async function saveAdsToSupabase(ads) {
  if (ads.length === 0) {
    console.log('ℹ️ Nenhum ad para salvar');
    return;
  }
  
  console.log(`💾 Salvando ${ads.length} ads no Supabase...`);
  
  try {
    const { data, error } = await supabase
      .from('ads')
      .upsert(ads, { onConflict: 'ad_id' });
    
    if (error) {
      console.error('❌ Erro ao salvar ads:', error);
      throw error;
    }
    
    console.log(`✅ ${ads.length} ads salvos/atualizados com sucesso`);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao salvar ads:', error.message);
    throw error;
  }
}

// Função principal
async function syncAds() {
  const startTime = Date.now();
  console.log('🚀 Iniciando sincronização otimizada de ads...');
  console.log(`⏰ Período de tráfego: últimos ${TRAFFIC_DAYS} dias`);
  console.log(`⚙️ Configurações: ${CONCURRENT_REQUESTS} req simultâneas, ${RATE_LIMIT_DELAY}ms delay`);
  console.log(`📊 Limite: ${MAX_PAGES} páginas, ${BATCH_SIZE} ads por lote`);
  
  try {
    // 1. Buscar todos os ads (limitado)
    const allAds = await getAdsFromMeta();
    
    // 2. Filtrar ads ativos
    const activeAds = allAds.filter(ad => {
      return ad.status === 'ACTIVE';
    });
    
    console.log(`📊 Ads ativos: ${activeAds.length}/${allAds.length}`);
    
    // 3. Buscar insights em lote para ads com tráfego (limitado aos primeiros 100)
    const adIds = activeAds.slice(0, 100).map(ad => ad.id); // Limitar a 100 ads para evitar rate limit
    const insights = await getAdsInsightsBatch(adIds);
    
    console.log(`📈 Ads com tráfego recente: ${insights.length}/${adIds.length}`);
    
    // 4. Preparar dados para salvar (usando apenas colunas que existem na tabela)
    const adsToSave = activeAds.map(ad => {
      const insight = insights.find(i => i.ad_id === ad.id);
      const impressions = insight?.impressions || 0;
      const clicks = insight?.clicks || 0;
      const spend = insight?.spend || 0;
      
      // Calcular métricas derivadas
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      
      return {
        ad_id: ad.id,
        name: ad.name,
        status: ad.status,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        creative: ad.creative ? JSON.stringify(ad.creative) : null,
        impressions: impressions,
        clicks: clicks,
        spend: spend,
        ctr: ctr,
        cpc: cpc,
        cpm: cpm,
        leads_count: 0 // Será atualizado pelo script de leads
      };
    });
    
    // 5. Salvar no Supabase
    await saveAdsToSupabase(adsToSave);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`⏱️ Tempo total: ${duration.toFixed(2)} segundos`);
    console.log(`📊 Resumo:`);
    console.log(`   - Total de ads: ${allAds.length}`);
    console.log(`   - Ads ativos: ${activeAds.length}`);
    console.log(`   - Com tráfego recente: ${insights.length}`);
    console.log(`   - Salvos no banco: ${adsToSave.length}`);
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
syncAds(); 