require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateCampaignInsights() {
  try {
    console.log('🔄 Iniciando população da tabela campaign_insights...');

    // 1. Limpar dados existentes
    console.log('🗑️ Limpando dados existentes...');
    const { error: deleteError } = await supabase
      .from('campaign_insights')
      .delete()
      .neq('id', 0); // Deletar todos os registros

    if (deleteError) {
      console.error('❌ Erro ao limpar dados:', deleteError);
      return;
    }

    console.log('✅ Dados limpos com sucesso');

    // 2. Buscar dados de adset_insights com campaign_id
    console.log('📊 Buscando dados de adset_insights...');
    const { data: adsetInsights, error: fetchError } = await supabase
      .from('adset_insights')
      .select(`
        adset_id,
        date,
        leads,
        spend,
        impressions,
        clicks,
        adsets!inner(campaign_id)
      `)
      .not('adsets.campaign_id', 'is', null);

    if (fetchError) {
      console.error('❌ Erro ao buscar dados:', fetchError);
      return;
    }

    console.log(`📈 Encontrados ${adsetInsights.length} registros de adset_insights`);

    // 3. Agrupar dados por campaign_id e date
    const campaignData = {};
    
    adsetInsights.forEach(insight => {
      const campaignId = insight.adsets.campaign_id;
      const date = insight.date;
      const key = `${campaignId}_${date}`;
      
      if (!campaignData[key]) {
        campaignData[key] = {
          campaign_id: campaignId,
          date: date,
          leads: 0,
          spend: 0,
          impressions: 0,
          clicks: 0
        };
      }
      
      campaignData[key].leads += parseInt(insight.leads) || 0;
      campaignData[key].spend += parseFloat(insight.spend) || 0;
      campaignData[key].impressions += parseInt(insight.impressions) || 0;
      campaignData[key].clicks += parseInt(insight.clicks) || 0;
    });

    const aggregatedData = Object.values(campaignData);
    console.log(`📊 Dados agregados em ${aggregatedData.length} registros de campanhas`);

    // 4. Inserir dados na tabela campaign_insights
    console.log('💾 Inserindo dados na tabela campaign_insights...');
    
    // Inserir em lotes de 100 para evitar timeout
    const batchSize = 100;
    for (let i = 0; i < aggregatedData.length; i += batchSize) {
      const batch = aggregatedData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('campaign_insights')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, insertError);
        return;
      }

      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido (${batch.length} registros)`);
    }

    console.log('🎉 População da tabela campaign_insights concluída com sucesso!');
    
    // 5. Verificar dados inseridos
    const { count, error: countError } = await supabase
      .from('campaign_insights')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
    } else {
      console.log(`📊 Total de registros na tabela campaign_insights: ${count}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateCampaignInsights();
}

module.exports = { populateCampaignInsights }; 