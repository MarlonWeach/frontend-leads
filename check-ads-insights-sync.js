require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAdsInsightsSync() {
  console.log('🔍 Verificando sincronização entre ads e ad_insights...\n');

  try {
    // 1. Buscar todos os ads ativos
    console.log('1. Buscando ads ativos...');
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status')
      .eq('status', 'ACTIVE');

    if (adsError) {
      console.log('❌ Erro ao buscar ads:', adsError.message);
      return;
    }

    console.log(`✅ Encontrados ${adsData.length} ads ativos`);

    // 2. Buscar todos os ad_ids únicos em ad_insights
    console.log('\n2. Buscando ad_ids em ad_insights...');
    const { data: insightsData, error: insightsError } = await supabase
      .from('ad_insights')
      .select('ad_id')
      .limit(10000); // Aumentar limite se necessário

    if (insightsError) {
      console.log('❌ Erro ao buscar ad_insights:', insightsError.message);
      return;
    }

    // Criar sets para comparação
    const adsIds = new Set(adsData.map(ad => ad.ad_id));
    const insightsIds = new Set(insightsData.map(insight => insight.ad_id));

    console.log(`✅ Encontrados ${insightsIds.size} ads únicos em ad_insights`);

    // 3. Identificar ads sem insights
    const missingInsights = Array.from(adsIds).filter(adId => !insightsIds.has(adId));
    const extraInsights = Array.from(insightsIds).filter(adId => !adsIds.has(adId));

    console.log('\n3. Análise de sincronização:');
    console.log(`📊 Total de ads ativos: ${adsIds.size}`);
    console.log(`📊 Total de ads com insights: ${insightsIds.size}`);
    console.log(`❌ Ads sem insights: ${missingInsights.length}`);
    console.log(`⚠️  Insights de ads inativos: ${extraInsights.length}`);

    if (missingInsights.length > 0) {
      console.log('\n📋 Ads sem insights (primeiros 10):');
      missingInsights.slice(0, 10).forEach((adId, index) => {
        const ad = adsData.find(a => a.ad_id === adId);
        console.log(`  ${index + 1}. ${adId} - "${ad?.name || 'Sem nome'}"`);
      });
    }

    if (extraInsights.length > 0) {
      console.log('\n📋 Insights de ads inativos (primeiros 5):');
      extraInsights.slice(0, 5).forEach((adId, index) => {
        console.log(`  ${index + 1}. ${adId}`);
      });
    }

    // 4. Verificar dados recentes
    console.log('\n4. Verificando dados recentes...');
    const recentDate = '2025-06-20'; // Ontem
    const { data: recentInsights, error: recentError } = await supabase
      .from('ad_insights')
      .select('ad_id, date, leads')
      .eq('date', recentDate);

    if (recentError) {
      console.log('❌ Erro ao buscar insights recentes:', recentError.message);
    } else {
      const recentAdIds = new Set(recentInsights.map(insight => insight.ad_id));
      const missingRecent = Array.from(adsIds).filter(adId => !recentAdIds.has(adId));
      
      console.log(`📅 Ads ativos sem dados de ${recentDate}: ${missingRecent.length}`);
      if (missingRecent.length > 0) {
        console.log('📋 Primeiros 5 ads sem dados recentes:');
        missingRecent.slice(0, 5).forEach((adId, index) => {
          const ad = adsData.find(a => a.ad_id === adId);
          console.log(`  ${index + 1}. ${adId} - "${ad?.name || 'Sem nome'}"`);
        });
      }
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkAdsInsightsSync(); 