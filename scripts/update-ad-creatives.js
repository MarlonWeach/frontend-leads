const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

async function fetchAdCreative(adId) {
  const url = `https://graph.facebook.com/v19.0/${adId}`;
  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    fields: 'id,name,adcreatives{id,object_story_spec,body,link_url,image_url,thumbnail_url,call_to_action_type,title,description,message,link_og_id,link_deep_link_url,instagram_story_id,instagram_actor_id,instagram_permalink_url,facebook_page_id,image_hash,url_tags,link_destination_display_url,link_destination_url,platform_customizations,product_set_id,multi_share_end_card,multi_share_optimized,recommender_settings,story_metadata,effective_instagram_story_id,effective_instagram_media_id,effective_facebook_media_id}'
  });
  
  const fullUrl = `${url}?${params.toString()}`;
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Erro Meta API [${response.status}]:`, JSON.stringify(data, null, 2));
      throw new Error(`Erro Meta API: ${data.error ? data.error.message : response.statusText}`);
    }
    
    return data;
  } catch (err) {
    console.error('Erro ao buscar criativo do ad:', adId, err.message);
    throw err;
  }
}

async function updateAdCreatives() {
  console.log('🚀 Iniciando atualização de criativos de ads...');
  
  try {
    // Buscar todos os ads ativos
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, status, creative')
      .eq('status', 'ACTIVE');

    if (adsError) {
      throw new Error(`Erro ao buscar ads: ${adsError.message}`);
    }

    console.log(`📊 Encontrados ${ads.length} ads ativos`);

    let updatedAds = 0;
    let processedAds = 0;

    for (const ad of ads) {
      try {
        console.log(`🔄 Processando ad: ${ad.name} (${ad.ad_id})`);
        
        // Verificar se já tem creative completo
        if (ad.creative && typeof ad.creative === 'object' && ad.creative.body) {
          console.log(`✅ Ad ${ad.name} já tem creative completo, pulando...`);
          processedAds++;
          continue;
        }
        
        const adData = await fetchAdCreative(ad.ad_id);
        
        if (adData && adData.adcreatives && adData.adcreatives.data && adData.adcreatives.data.length > 0) {
          const creative = adData.adcreatives.data[0]; // Pegar o primeiro criativo
          
          // Atualizar o campo creative na tabela ads
          const { error: updateError } = await supabase
            .from('ads')
            .update({ creative: creative })
            .eq('ad_id', ad.ad_id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar creative para ad ${ad.ad_id}:`, updateError.message);
          } else {
            console.log(`✅ Creative atualizado para ad ${ad.name}:`, {
              body: creative.body?.substring(0, 100) + '...',
              image_url: creative.image_url,
              link_url: creative.link_url
            });
            updatedAds++;
          }
        } else {
          console.log(`⚠️ Nenhum criativo encontrado para ad ${ad.name}`);
        }

        processedAds++;
        
        // Rate limiting - aguardar 1 segundo entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro ao processar ad ${ad.name}:`, error.message);
      }
    }

    console.log(`🎉 Atualização concluída!`);
    console.log(`📈 Ads processados: ${processedAds}/${ads.length}`);
    console.log(`📊 Creatives atualizados: ${updatedAds}`);

  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
    process.exit(1);
  }
}

// Executar atualização
if (require.main === module) {
  updateAdCreatives();
}

module.exports = { updateAdCreatives }; 