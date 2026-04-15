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
const DAYS_TO_SYNC = 7; // Sincronizar últimos 7 dias
const SPECIFIC_AD_IDS = ['6530118350088']; // Ads específicos para sincronizar

async function fetchAdInsights(adId, startDate, endDate) {
  const url = `https://graph.facebook.com/v25.0/${adId}/insights`;
  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,reach,frequency',
    time_increment: '1',
    time_range: JSON.stringify({ since: startDate, until: endDate })
  });
  const fullUrl = `${url}?${params.toString()}`;
  
  console.log(`  🔗 URL: ${url}`);
  console.log(`  📅 Período: ${startDate} até ${endDate}`);
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`    ❌ Erro Meta API [${response.status}]:`, JSON.stringify(data, null, 2));
      throw new Error(`Erro Meta API: ${data.error ? data.error.message : response.statusText}`);
    }
    
    console.log(`    ✅ Dados recebidos: ${data.data?.length || 0} registros`);
    return data.data || [];
  } catch (err) {
    console.error('    ❌ Erro ao buscar insights do ad:', adId, err.message);
    throw err;
  }
}

async function syncRecentAdInsights() {
  console.log('🚀 Iniciando sincronização de dados recentes de ads...');
  console.log(`📊 Configurações:`);
  console.log(`   - Período: últimos ${DAYS_TO_SYNC} dias`);
  console.log(`   - Ads específicos: ${SPECIFIC_AD_IDS.join(', ')}`);
  
  try {
    // 1. Buscar ads específicos
    console.log('\n1. Buscando ads específicos...');
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status, adset_id, campaign_id')
      .in('ad_id', SPECIFIC_AD_IDS)
      .eq('status', 'ACTIVE');
    
    if (adsError) {
      throw new Error(`Erro ao buscar ads: ${adsError.message}`);
    }
    
    console.log(`✅ Encontrados ${ads.length} ads ativos`);
    ads.forEach(ad => {
      console.log(`   - ${ad.ad_id}: ${ad.name}`);
    });
    
    if (ads.length === 0) {
      console.log('❌ Nenhum ad ativo encontrado');
      return;
    }
    
    // 2. Calcular datas para sincronização
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (DAYS_TO_SYNC * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    console.log(`\n2. Sincronizando dados de ${startDate} até ${endDate}`);
    
    // 3. Processar cada ad
    let totalInsights = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const ad of ads) {
      try {
        console.log(`\n🔄 Processando: ${ad.name} (${ad.ad_id})`);
        
        const insights = await fetchAdInsights(ad.ad_id, startDate, endDate);
        
        if (insights.length > 0) {
          console.log(`  📊 Processando ${insights.length} insights diários...`);
          
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
            
            console.log(`    📅 ${date}: ${leads} leads, ${insight.impressions} impressões, R$ ${insight.spend}`);
            
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
              console.error(`      ❌ Erro ao inserir insight para ${ad.ad_id} em ${date}:`, upsertError.message);
              errorCount++;
            } else {
              totalInsights++;
              console.log(`      ✅ Insight inserido/atualizado`);
            }
          }
          
          console.log(`  ✅ ${ad.name} processado (${insights.length} insights)`);
          successCount++;
        } else {
          console.log(`  ⚠️  ${ad.name} sem insights no período`);
        }
        
      } catch (error) {
        console.error(`  ❌ Erro ao processar ${ad.name}:`, error.message);
        errorCount++;
      }
      
      // Rate limiting - aguardar 1 segundo entre ads
      if (ads.indexOf(ad) < ads.length - 1) {
        console.log('  ⏳ Aguardando 1 segundo...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n🎉 Sincronização de dados recentes concluída!`);
    console.log(`📈 Resumo:`);
    console.log(`   - Ads processados: ${ads.length}`);
    console.log(`   - Sucessos: ${successCount}`);
    console.log(`   - Erros: ${errorCount}`);
    console.log(`   - Insights inseridos/atualizados: ${totalInsights}`);
    
    // 4. Verificação final
    console.log('\n🔍 Verificação final...');
    for (const adId of SPECIFIC_AD_IDS) {
      const { data: recentInsights, error: checkError } = await supabase
        .from('ad_insights')
        .select('date, leads, impressions, spend')
        .eq('ad_id', adId)
        .gte('date', startDate)
        .order('date', { ascending: false });
      
      if (checkError) {
        console.error(`❌ Erro ao verificar ${adId}:`, checkError.message);
      } else {
        console.log(`📊 ${adId} - Insights recentes: ${recentInsights?.length || 0}`);
        if (recentInsights && recentInsights.length > 0) {
          recentInsights.slice(0, 3).forEach(insight => {
            console.log(`  - ${insight.date}: ${insight.leads} leads, ${insight.impressions} impressões`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
if (require.main === module) {
  syncRecentAdInsights();
}

module.exports = { syncRecentAdInsights }; 