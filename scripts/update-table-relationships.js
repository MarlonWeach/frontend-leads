#!/usr/bin/env node

/**
 * Script para atualizar relacionamentos entre TODAS as tabelas
 * Este script garante que todos os IDs estejam consistentes entre as tabelas
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

function logStep(title) {
  console.log('\n==============================');
  console.log(title);
  console.log('==============================');
}

async function updateTableRelationships() {
  console.log('🔧 Iniciando atualização completa de relacionamentos entre tabelas...\n');
  const start = Date.now();
  try {
    logStep('📊 1. Atualizando campaign_id em adset_insights...');
    await updateAdsetInsightsCampaignId();

    logStep('📊 2. Atualizando campaign_id em ads...');
    await updateAdsCampaignId();

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n🎉 Atualização completa de relacionamentos concluída em ${elapsed}s!`);
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

async function updateAdsetInsightsCampaignId() {
  const { data: adsetInsights, error: insightsError, count } = await supabase
    .from('adset_insights')
    .select('id, adset_id, campaign_id', { count: 'exact' })
    .is('campaign_id', null)
    .limit(100);

  if (insightsError) {
    console.error('❌ Erro ao buscar adset_insights:', insightsError);
    return;
  }

  console.log(`   Total sem campaign_id: ${count}`);
  if (adsetInsights && adsetInsights.length > 0) {
    console.log(`   Processando ${adsetInsights.length} registros...`);
    
    const adsetIds = Array.from(new Set(adsetInsights.map(insight => insight.adset_id)));
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      console.error('❌ Erro ao buscar adsets:', adsetsError);
      return;
    }

    const adsetToCampaignMap = new Map();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

    let updatedCount = 0;
    for (const insight of adsetInsights) {
      const campaignId = adsetToCampaignMap.get(insight.adset_id);
      if (campaignId) {
        const { error: updateError } = await supabase
          .from('adset_insights')
          .update({ campaign_id: campaignId })
          .eq('id', insight.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar insight ${insight.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    console.log(`   ✅ Atualizados ${updatedCount} registros em adset_insights`);
  } else {
    console.log('   ✅ Todos os registros em adset_insights já têm campaign_id');
  }
}

async function updateAdsCampaignId() {
  const { data: ads, error: adsError, count } = await supabase
    .from('ads')
    .select('ad_id, adset_id, campaign_id', { count: 'exact' })
    .is('campaign_id', null)
    .limit(100);

  if (adsError) {
    console.error('❌ Erro ao buscar ads:', adsError);
    return;
  }

  console.log(`   Total sem campaign_id: ${count}`);
  if (ads && ads.length > 0) {
    console.log(`   Processando ${ads.length} registros...`);
    
    const adsetIds = Array.from(new Set(ads.map(ad => ad.adset_id)));
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, campaign_id')
      .in('id', adsetIds);

    if (adsetsError) {
      console.error('❌ Erro ao buscar adsets:', adsetsError);
      return;
    }

    const adsetToCampaignMap = new Map();
    (adsets || []).forEach(adset => {
      adsetToCampaignMap.set(adset.id, adset.campaign_id);
    });

    let updatedCount = 0;
    for (const ad of ads) {
      const campaignId = adsetToCampaignMap.get(ad.adset_id);
      if (campaignId) {
        const { error: updateError } = await supabase
          .from('ads')
          .update({ campaign_id: campaignId })
          .eq('ad_id', ad.ad_id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ad ${ad.ad_id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    console.log(`   ✅ Atualizados ${updatedCount} registros em ads`);
  } else {
    console.log('   ✅ Todos os registros em ads já têm campaign_id');
  }
}

// Executar o script
updateTableRelationships(); 