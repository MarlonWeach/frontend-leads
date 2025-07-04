const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.META_ACCOUNT_ID;
const DAYS_TO_SYNC = 30; // Sincronizar últimos 30 dias
const TRAFFIC_THRESHOLD_DAYS = 60; // Filtrar adsets com tráfego nos últimos 60 dias

async function fetchAdInsights(adId, startDate, endDate) {
  const url = `https://graph.facebook.com/v19.0/${adId}/insights`;
  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,reach,frequency',
    time_increment: '1',
    time_range: JSON.stringify({ since: startDate, until: endDate })
  });
  const fullUrl = `${url}?${params.toString()}`;
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    if (!response.ok) {
      console.error(`Erro Meta API [${response.status}]:`, JSON.stringify(data, null, 2));
      throw new Error(`Erro Meta API: ${data.error ? data.error.message : response.statusText}`);
    }
    return data.data || [];
  } catch (err) {
    console.error('Erro ao buscar insights do ad:', adId, err.message);
    throw err;
  }
}

async function getAdsetsWithRecentTraffic() {
  console.log('🔍 Identificando adsets com tráfego recente...');
  
  // Calcular data limite para tráfego recente
  const trafficThresholdDate = new Date();
  trafficThresholdDate.setDate(trafficThresholdDate.getDate() - TRAFFIC_THRESHOLD_DAYS);
  const trafficThresholdStr = trafficThresholdDate.toISOString().split('T')[0];
  
  console.log(`📅 Buscando adsets com tráfego desde ${trafficThresholdStr}`);
  
  // Buscar adsets que têm insights recentes
  const { data: recentAdsetInsights, error: insightsError } = await supabase
    .from('adset_insights')
    .select('adset_id')
    .gte('date', trafficThresholdStr)
    .gt('impressions', 0); // Apenas adsets com impressões > 0
  
  if (insightsError) {
    throw new Error(`Erro ao buscar insights de adsets: ${insightsError.message}`);
  }
  
  // Extrair adset_ids únicos
  const adsetIdsWithTraffic = [...new Set(recentAdsetInsights.map(insight => insight.adset_id))];
  
  console.log(`✅ Encontrados ${adsetIdsWithTraffic.length} adsets com tráfego recente`);
  
  return adsetIdsWithTraffic;
}

async function getAdsFromActiveAdsets(adsetIdsWithTraffic) {
  console.log('🔍 Buscando ads dos adsets com tráfego recente...');
  
  if (adsetIdsWithTraffic.length === 0) {
    console.log('⚠️  Nenhum adset com tráfego encontrado');
    return [];
  }
  
  // Buscar ads que pertencem aos adsets com tráfego
  const { data: ads, error: adsError } = await supabase
    .from('ads')
    .select('ad_id, name, status, adset_id, campaign_id')
    .in('adset_id', adsetIdsWithTraffic)
    .eq('status', 'ACTIVE');
  
  if (adsError) {
    throw new Error(`Erro ao buscar ads: ${adsError.message}`);
  }
  
  console.log(`✅ Encontrados ${ads.length} ads ativos de adsets com tráfego recente`);
  
  return ads;
}

async function checkExistingInsights(adIds) {
  console.log('🔍 Verificando insights existentes...');
  
  if (adIds.length === 0) return new Set();
  
  // Buscar ad_ids que já têm insights
  const { data: existingInsights, error: insightsError } = await supabase
    .from('ad_insights')
    .select('ad_id')
    .in('ad_id', adIds);
  
  if (insightsError) {
    console.error('Erro ao verificar insights existentes:', insightsError.message);
    return new Set();
  }
  
  const existingAdIds = new Set(existingInsights.map(insight => insight.ad_id));
  console.log(`✅ ${existingAdIds.size} ads já têm insights`);
  
  return existingAdIds;
}

async function syncAdInsightsOptimized() {
  console.log('🚀 Iniciando sincronização otimizada de insights de ads...');
  console.log(`📊 Filtros aplicados:`);
  console.log(`   - Adsets com tráfego nos últimos ${TRAFFIC_THRESHOLD_DAYS} dias`);
  console.log(`   - Apenas ads ativos`);
  console.log(`   - Sincronização dos últimos ${DAYS_TO_SYNC} dias`);
  
  try {
    // 1. Identificar adsets com tráfego recente
    const adsetIdsWithTraffic = await getAdsetsWithRecentTraffic();
    
    if (adsetIdsWithTraffic.length === 0) {
      console.log('❌ Nenhum adset com tráfego encontrado. Verifique se há dados de adset_insights.');
      return;
    }
    
    // 2. Buscar ads desses adsets
    const ads = await getAdsFromActiveAdsets(adsetIdsWithTraffic);
    
    if (ads.length === 0) {
      console.log('❌ Nenhum ad ativo encontrado nos adsets com tráfego.');
      return;
    }
    
    // 3. Verificar insights existentes
    const adIds = ads.map(ad => ad.ad_id);
    const existingAdIds = await checkExistingInsights(adIds);
    
    // 4. Filtrar ads que precisam de sincronização
    const adsToSync = ads.filter(ad => !existingAdIds.has(ad.ad_id));
    
    console.log(`📊 Resumo da sincronização:`);
    console.log(`   - Total de ads nos adsets com tráfego: ${ads.length}`);
    console.log(`   - Ads já com insights: ${existingAdIds.size}`);
    console.log(`   - Ads para sincronizar: ${adsToSync.length}`);
    
    if (adsToSync.length === 0) {
      console.log('✅ Todos os ads relevantes já têm insights!');
      return;
    }
    
    // 5. Calcular datas para sincronização
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (DAYS_TO_SYNC * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    console.log(`📅 Sincronizando dados de ${startDate} até ${endDate}`);
    
    // 6. Processar ads em lotes
    const batchSize = 5; // Reduzir batch size para evitar rate limiting
    let totalInsights = 0;
    let processedAds = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < adsToSync.length; i += batchSize) {
      const batch = adsToSync.slice(i, i + batchSize);
      console.log(`\n📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(adsToSync.length / batchSize)} (${batch.length} ads)`);
      
      for (const ad of batch) {
        try {
          console.log(`  🔄 Processando: ${ad.name} (${ad.ad_id})`);
          
          const insights = await fetchAdInsights(ad.ad_id, startDate, endDate);
          
          if (insights.length > 0) {
            // Processar insights diários
            for (const insight of insights) {
              const date = insight.date_start;
              
              // Extrair leads das actions
              let leads = 0;
              if (insight.actions) {
                const leadAction = insight.actions.find(action => 
                  action.action_type === 'onsite_conversion.lead_grouped'
                );
                if (leadAction) {
                  leads = parseInt(leadAction.value) || 0;
                }
              }
              
              // Preparar dados para inserção
              const insightData = {
                ad_id: ad.ad_id,
                date: date,
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
                unique_link_clicks: parseInt(insight.unique_link_clicks || 0),
                unique_link_clicks_ctr: parseFloat(insight.unique_link_clicks_ctr || 0),
                social_spend: parseFloat(insight.social_spend || 0),
                social_impressions: parseInt(insight.social_impressions || 0),
                social_clicks: parseInt(insight.social_clicks || 0),
                social_reach: parseInt(insight.social_reach || 0),
                social_frequency: parseFloat(insight.social_frequency || 0),
                social_unique_clicks: parseInt(insight.social_unique_clicks || 0),
                social_unique_link_clicks: parseInt(insight.social_unique_link_clicks || 0)
              };
              
              // Inserir ou atualizar insight
              const { error: upsertError } = await supabase
                .from('ad_insights')
                .upsert(insightData, { 
                  onConflict: 'ad_id,date',
                  ignoreDuplicates: false 
                });
              
              if (upsertError) {
                console.error(`    ❌ Erro ao inserir insight para ${ad.ad_id} em ${date}:`, upsertError.message);
                errorCount++;
              } else {
                totalInsights++;
              }
            }
            
            console.log(`    ✅ ${ad.name} processado (${insights.length} insights)`);
            successCount++;
          } else {
            console.log(`    ⚠️  ${ad.name} sem insights no período`);
          }
          
          processedAds++;
          
        } catch (error) {
          console.error(`    ❌ Erro ao processar ${ad.name}:`, error.message);
          errorCount++;
          processedAds++;
        }
      }
      
      // Rate limiting - aguardar 2 segundos entre lotes
      if (i + batchSize < adsToSync.length) {
        console.log('  ⏳ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 Sincronização otimizada concluída!`);
    console.log(`📈 Resumo:`);
    console.log(`   - Ads processados: ${processedAds}/${adsToSync.length}`);
    console.log(`   - Sucessos: ${successCount}`);
    console.log(`   - Erros: ${errorCount}`);
    console.log(`   - Insights inseridos/atualizados: ${totalInsights}`);
    
    // 7. Verificação final
    console.log('\n🔍 Verificação final...');
    const finalAdIds = adsToSync.map(ad => ad.ad_id);
    const finalExistingAdIds = await checkExistingInsights(finalAdIds);
    const stillMissing = finalAdIds.filter(adId => !finalExistingAdIds.has(adId));
    
    console.log(`📊 Ads com insights após sincronização: ${finalExistingAdIds.size}`);
    console.log(`❌ Ads ainda sem insights: ${stillMissing.length}`);
    
    if (stillMissing.length > 0) {
      console.log('📋 Ads que ainda precisam de sincronização:');
      stillMissing.slice(0, 5).forEach(adId => {
        const ad = adsToSync.find(a => a.ad_id === adId);
        console.log(`  - ${adId} (${ad?.name || 'Sem nome'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização otimizada:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
if (require.main === module) {
  syncAdInsightsOptimized();
}

module.exports = { syncAdInsightsOptimized }; 