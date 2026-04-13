const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Defina NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no .env.local'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const META_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

if (!META_ACCESS_TOKEN) {
  console.error(
    'Defina META_ACCESS_TOKEN ou NEXT_PUBLIC_META_ACCESS_TOKEN no .env.local'
  );
  process.exit(1);
}

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
      .select('id, name, status')
      .eq('status', 'ACTIVE');

    if (adsError) {
      throw new Error(`Erro ao buscar ads: ${adsError.message}`);
    }

    console.log(`📊 Encontrados ${ads.length} ads ativos`);

    let updatedAds = 0;
    let processedAds = 0;

    for (const ad of ads) {
      try {
        console.log(`🔄 Processando ad: ${ad.name} (${ad.id})`);
        
        // Verificar se já tem creative na tabela ad_creatives
        const { data: existingCreative } = await supabase
          .from('ad_creatives')
          .select('id')
          .eq('ad_id', ad.id)
          .single();
        
        if (existingCreative) {
          console.log(`✅ Ad ${ad.name} já tem creative, pulando...`);
          processedAds++;
          continue;
        }
        
        const adData = await fetchAdCreative(ad.id);
        
        if (adData && adData.adcreatives && adData.adcreatives.data && adData.adcreatives.data.length > 0) {
          const creative = adData.adcreatives.data[0]; // Pegar o primeiro criativo
          
          // Extrair dados do criativo
          const creativeData = {
            ad_id: ad.id,
            creative_id: creative.id || null,
            title: creative.title || null,
            body: creative.body || null,
            image_url: creative.image_url || null,
            image_hash: creative.image_hash || null,
            thumbnail_url: creative.thumbnail_url || null,
            video_url: creative.video_url || null,
            slideshow_data: creative.slideshow_spec || null,
            object_story_spec: creative.object_story_spec || null,
            call_to_action_type: creative.call_to_action?.type || null,
            instagram_permalink_url: creative.instagram_permalink_url || null,
            effective_instagram_media_id: creative.effective_instagram_media_id || null,
            raw_creative_data: creative
          };
          
          // Salvar na tabela ad_creatives
          const { error: insertError } = await supabase
            .from('ad_creatives')
            .upsert(creativeData, { onConflict: 'ad_id' });

          if (insertError) {
            console.error(`❌ Erro ao salvar creative para ad ${ad.id}:`, insertError.message);
          } else {
            console.log(`✅ Creative salvo para ad ${ad.name}:`, {
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