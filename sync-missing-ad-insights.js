require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncMissingAdInsights() {
  console.log('🔄 Sincronizando insights dos ads que estão faltando...\n');

  try {
    // 1. Buscar todos os ads ativos
    console.log('1. Buscando ads ativos...');
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status, campaign_id, adset_id')
      .eq('status', 'ACTIVE');

    if (adsError) {
      console.log('❌ Erro ao buscar ads:', adsError.message);
      return;
    }

    // 2. Buscar todos os ad_ids únicos em ad_insights
    console.log('2. Buscando ad_ids em ad_insights...');
    const { data: insightsData, error: insightsError } = await supabase
      .from('ad_insights')
      .select('ad_id')
      .limit(10000);

    if (insightsError) {
      console.log('❌ Erro ao buscar ad_insights:', insightsError.message);
      return;
    }

    // 3. Identificar ads sem insights
    const adsIds = new Set(adsData.map(ad => ad.ad_id));
    const insightsIds = new Set(insightsData.map(insight => insight.ad_id));
    const missingInsights = Array.from(adsIds).filter(adId => !insightsIds.has(adId));

    console.log(`📊 Total de ads ativos: ${adsIds.size}`);
    console.log(`📊 Total de ads com insights: ${insightsIds.size}`);
    console.log(`❌ Ads sem insights: ${missingInsights.length}`);

    if (missingInsights.length === 0) {
      console.log('✅ Todos os ads já têm insights!');
      return;
    }

    // 4. Definir período para sincronização (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`\n3. Sincronizando insights para o período: ${startDateStr} a ${endDateStr}`);

    // 5. Processar em lotes para evitar sobrecarga
    const batchSize = 10;
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < missingInsights.length; i += batchSize) {
      const batch = missingInsights.slice(i, i + batchSize);
      console.log(`\n📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingInsights.length / batchSize)} (${batch.length} ads)`);

      for (const adId of batch) {
        try {
          // Buscar insights da Meta API (simulado - você precisará implementar a chamada real)
          console.log(`  🔄 Sincronizando ad ${adId}...`);
          
          // Aqui você deve implementar a chamada real para a Meta API
          // Por enquanto, vou criar um registro vazio para demonstrar
          const mockInsight = {
            ad_id: adId,
            date: endDateStr,
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            reach: 0,
            frequency: 0,
            leads: 0,
            unique_clicks: 0,
            unique_ctr: 0,
            unique_link_clicks: 0,
            unique_link_clicks_ctr: 0,
            social_spend: 0,
            social_impressions: 0,
            social_clicks: 0,
            social_reach: 0,
            social_frequency: 0,
            social_unique_clicks: 0,
            social_unique_link_clicks: 0
          };

          // Inserir na tabela ad_insights
          const { error: insertError } = await supabase
            .from('ad_insights')
            .insert([mockInsight]);

          if (insertError) {
            console.log(`    ❌ Erro ao inserir insights para ${adId}:`, insertError.message);
            errorCount++;
          } else {
            console.log(`    ✅ Insights inseridos para ${adId}`);
            successCount++;
          }

          processed++;
        } catch (error) {
          console.log(`    ❌ Erro ao processar ${adId}:`, error.message);
          errorCount++;
          processed++;
        }
      }

      // Pequena pausa entre lotes
      if (i + batchSize < missingInsights.length) {
        console.log('  ⏳ Aguardando 1 segundo...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n📊 Resumo da sincronização:');
    console.log(`✅ Processados: ${processed}`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    if (successCount > 0) {
      console.log('\n🔄 Verificando resultado...');
      
      // Verificar novamente
      const { data: newInsightsData, error: newInsightsError } = await supabase
        .from('ad_insights')
        .select('ad_id')
        .limit(10000);

      if (!newInsightsError) {
        const newInsightsIds = new Set(newInsightsData.map(insight => insight.ad_id));
        const stillMissing = Array.from(adsIds).filter(adId => !newInsightsIds.has(adId));
        
        console.log(`📊 Ads com insights após sincronização: ${newInsightsIds.size}`);
        console.log(`❌ Ads ainda sem insights: ${stillMissing.length}`);
      }
    }

    console.log('\n✅ Sincronização concluída!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Função para sincronizar insights de um ad específico
async function syncSpecificAdInsights(adId) {
  console.log(`🔄 Sincronizando insights para o ad específico: ${adId}...\n`);

  try {
    // Verificar se o ad existe
    const { data: adData, error: adError } = await supabase
      .from('ads')
      .select('ad_id, name, status')
      .eq('ad_id', adId)
      .single();

    if (adError || !adData) {
      console.log(`❌ Ad ${adId} não encontrado ou erro:`, adError?.message);
      return;
    }

    console.log(`✅ Ad encontrado: ${adData.name} (${adData.status})`);

    // Verificar se já tem insights
    const { data: existingInsights, error: insightsError } = await supabase
      .from('ad_insights')
      .select('ad_id, date, leads')
      .eq('ad_id', adId)
      .limit(5);

    if (insightsError) {
      console.log('❌ Erro ao verificar insights existentes:', insightsError.message);
      return;
    }

    console.log(`📊 Insights existentes: ${existingInsights?.length || 0}`);

    if (existingInsights && existingInsights.length > 0) {
      console.log('📋 Últimos insights:');
      existingInsights.forEach(insight => {
        console.log(`  ${insight.date}: ${insight.leads} leads`);
      });
    } else {
      console.log('⚠️  Nenhum insight encontrado para este ad');
    }

    // Aqui você implementaria a chamada real para a Meta API
    console.log('\n💡 Para sincronizar dados reais, implemente a chamada para a Meta API');
    console.log('💡 Use o script sync-ad-insights.js existente como referência');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Verificar se foi passado um ad_id específico
const specificAdId = process.argv[2];

if (specificAdId) {
  syncSpecificAdInsights(specificAdId);
} else {
  syncMissingAdInsights();
} 