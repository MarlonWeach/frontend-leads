require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateAdCreatives() {
  console.log('🚀 Iniciando população da tabela ad_creatives...');
  
  try {
    // Buscar todos os ads com dados de criativo
    const { data: adsData, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, name, creative')
      .eq('status', 'ACTIVE')
      .not('creative', 'is', null);

    if (adsError) {
      console.error('❌ Erro ao buscar ads:', adsError);
      return;
    }

    console.log(`📊 Encontrados ${adsData.length} ads com dados de criativo`);

    let processedCount = 0;
    let errorCount = 0;

    for (const ad of adsData) {
      try {
        // Fazer parse do creative se for string
        let creative = {};
        if (ad.creative) {
          if (typeof ad.creative === 'string') {
            try {
              creative = JSON.parse(ad.creative);
            } catch (e) {
              console.log(`⚠️  Erro ao fazer parse do creative do ad ${ad.ad_id}:`, e.message);
              continue;
            }
          } else {
            creative = ad.creative;
          }
        }

        // Extrair dados do criativo
        const creativeData = {
          ad_id: ad.ad_id,
          creative_id: creative.id || null,
          title: creative.title || null,
          body: creative.body || null,
          image_url: creative.image_url || null,
          image_hash: creative.image_hash || null,
          thumbnail_url: creative.thumbnail_url || null,
          video_url: creative.video?.source || null,
          slideshow_data: creative.slideshow || null,
          object_story_spec: creative.object_story_spec || null,
          call_to_action_type: creative.call_to_action_type || null,
          instagram_permalink_url: creative.instagram_permalink_url || null,
          effective_instagram_media_id: creative.effective_instagram_media_id || null,
          raw_creative_data: creative
        };

        // Inserir ou atualizar na tabela ad_creatives
        const { error: insertError } = await supabase
          .from('ad_creatives')
          .upsert(creativeData, { 
            onConflict: 'ad_id',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir criativo do ad ${ad.ad_id}:`, insertError);
          errorCount++;
        } else {
          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`✅ Processados ${processedCount} criativos...`);
          }
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ad ${ad.ad_id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`✅ Criativos processados com sucesso: ${processedCount}`);
    console.log(`❌ Erros: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateAdCreatives();
}

module.exports = { populateAdCreatives }; 