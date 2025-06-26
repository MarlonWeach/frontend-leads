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

async function syncAdInsights() {
  console.log('🚀 Iniciando sincronização de insights de ads...');
  
  try {
    // Buscar todos os ads ativos
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status')
      .eq('status', 'ACTIVE');

    if (adsError) {
      throw new Error(`Erro ao buscar ads: ${adsError.message}`);
    }

    console.log(`📊 Encontrados ${ads.length} ads ativos`);

    // Calcular datas
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (DAYS_TO_SYNC * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    console.log(`📅 Sincronizando dados de ${startDate} até ${endDate}`);

    let totalInsights = 0;
    let processedAds = 0;

    for (const ad of ads) {
      try {
        console.log(`🔄 Processando ad: ${ad.name} (${ad.ad_id})`);
        
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
              console.error(`Erro ao inserir insight para ad ${ad.ad_id} em ${date}:`, upsertError.message);
            } else {
              totalInsights++;
            }
          }
        }

        processedAds++;
        console.log(`✅ Ad ${ad.name} processado (${insights.length} insights)`);
        
        // Rate limiting - aguardar 1 segundo entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro ao processar ad ${ad.name}:`, error.message);
      }
    }

    console.log(`🎉 Sincronização concluída!`);
    console.log(`📈 Ads processados: ${processedAds}/${ads.length}`);
    console.log(`📊 Insights inseridos/atualizados: ${totalInsights}`);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
if (require.main === module) {
  syncAdInsights();
}

module.exports = { syncAdInsights }; 