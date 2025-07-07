require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TRAFFIC_THRESHOLD_DAYS = 60;

async function analyzeOptimization() {
  console.log('🔍 Analisando otimização da sincronização de ad insights...\n');

  try {
    // 1. Total de ads ativos
    console.log('1. Analisando total de ads ativos...');
    const { data: allAds, error: allAdsError } = await supabase
      .from('ads')
      .select('ad_id, name, status')
      .eq('status', 'ACTIVE');

    if (allAdsError) {
      console.log('❌ Erro ao buscar ads:', allAdsError.message);
      return;
    }

    console.log(`📊 Total de ads ativos: ${allAds.length}`);

    // 2. Adsets com tráfego recente
    console.log('\n2. Analisando adsets com tráfego recente...');
    const trafficThresholdDate = new Date();
    trafficThresholdDate.setDate(trafficThresholdDate.getDate() - TRAFFIC_THRESHOLD_DAYS);
    const trafficThresholdStr = trafficThresholdDate.toISOString().split('T')[0];

    const { data: recentAdsetInsights, error: insightsError } = await supabase
      .from('adset_insights')
      .select('adset_id, date, impressions')
      .gte('date', trafficThresholdStr)
      .gt('impressions', 0);

    if (insightsError) {
      console.log('❌ Erro ao buscar insights de adsets:', insightsError.message);
      return;
    }

    const adsetIdsWithTraffic = Array.from(new Set(recentAdsetInsights.map(insight => insight.adset_id)));
    console.log(`📊 Adsets com tráfego nos últimos ${TRAFFIC_THRESHOLD_DAYS} dias: ${adsetIdsWithTraffic.length}`);

    // 3. Ads de adsets com tráfego
    console.log('\n3. Analisando ads de adsets com tráfego...');
    const { data: relevantAds, error: relevantAdsError } = await supabase
      .from('ads')
      .select('ad_id, name, status, adset_id')
      .in('adset_id', adsetIdsWithTraffic)
      .eq('status', 'ACTIVE');

    if (relevantAdsError) {
      console.log('❌ Erro ao buscar ads relevantes:', relevantAdsError.message);
      return;
    }

    console.log(`📊 Ads ativos de adsets com tráfego: ${relevantAds.length}`);

    // 4. Ads que já têm insights
    console.log('\n4. Analisando ads com insights existentes...');
    const relevantAdIds = relevantAds.map(ad => ad.ad_id);
    
    const { data: existingInsights, error: existingError } = await supabase
      .from('ad_insights')
      .select('ad_id')
      .in('ad_id', relevantAdIds);

    if (existingError) {
      console.log('❌ Erro ao verificar insights existentes:', existingError.message);
      return;
    }

    const existingAdIds = new Set(existingInsights.map(insight => insight.ad_id));
    const adsToSync = relevantAds.filter(ad => !existingAdIds.has(ad.ad_id));

    console.log(`📊 Ads relevantes com insights: ${existingAdIds.size}`);
    console.log(`📊 Ads relevantes para sincronizar: ${adsToSync.length}`);

    // 5. Análise por adset
    console.log('\n5. Análise detalhada por adset...');
    const adsetAnalysis = {};
    
    relevantAds.forEach(ad => {
      if (!adsetAnalysis[ad.adset_id]) {
        adsetAnalysis[ad.adset_id] = {
          total: 0,
          withInsights: 0,
          toSync: 0
        };
      }
      adsetAnalysis[ad.adset_id].total++;
      
      if (existingAdIds.has(ad.ad_id)) {
        adsetAnalysis[ad.adset_id].withInsights++;
      } else {
        adsetAnalysis[ad.adset_id].toSync++;
      }
    });

    console.log('📋 Top 10 adsets com mais ads para sincronizar:');
    const sortedAdsets = Object.entries(adsetAnalysis)
      .sort(([,a], [,b]) => b.toSync - a.toSync)
      .slice(0, 10);

    sortedAdsets.forEach(([adsetId, stats], index) => {
      console.log(`  ${index + 1}. Adset ${adsetId}: ${stats.toSync}/${stats.total} ads para sincronizar`);
    });

    // 6. Resumo da otimização
    console.log('\n📊 RESUMO DA OTIMIZAÇÃO:');
    console.log('='.repeat(50));
    console.log(`📈 Total de ads ativos: ${allAds.length}`);
    console.log(`🎯 Ads relevantes (adsets com tráfego): ${relevantAds.length}`);
    console.log(`✅ Ads já com insights: ${existingAdIds.size}`);
    console.log(`🔄 Ads para sincronizar: ${adsToSync.length}`);
    console.log(`📉 Redução de processamento: ${((allAds.length - adsToSync.length) / allAds.length * 100).toFixed(1)}%`);
    
    if (adsToSync.length > 0) {
      console.log(`\n⏱️  Estimativa de tempo (com rate limiting de 2s entre lotes de 5):`);
      const batches = Math.ceil(adsToSync.length / 5);
      const estimatedMinutes = Math.ceil((batches * 2) / 60);
      console.log(`   - Lotes necessários: ${batches}`);
      console.log(`   - Tempo estimado: ~${estimatedMinutes} minutos`);
    }

    // 7. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (adsToSync.length === 0) {
      console.log('✅ Todos os ads relevantes já têm insights!');
    } else if (adsToSync.length < 50) {
      console.log('✅ Sincronização rápida recomendada (< 50 ads)');
    } else if (adsToSync.length < 200) {
      console.log('⚠️  Sincronização moderada (50-200 ads)');
    } else {
      console.log('🚨 Sincronização extensa (> 200 ads) - considere aumentar o filtro de dias');
    }

    console.log('\n✅ Análise concluída!');

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

analyzeOptimization(); 