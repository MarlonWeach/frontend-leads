#!/usr/bin/env node

/**
 * Script para atualizar relacionamentos entre TODAS as tabelas
 * Este script garante que todos os IDs estejam consistentes entre as tabelas
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    logStep('📊 3. Atualizando adset_id em meta_leads...');
    await updateMetaLeadsAdsetId();

    logStep('📊 4. Atualizando campaign_id em meta_leads...');
    await updateMetaLeadsCampaignId();

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
    
    const adsetIds = [...new Set(adsetInsights.map(insight => insight.adset_id))];
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
    
    const adsetIds = [...new Set(ads.map(ad => ad.adset_id))];
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

async function updateMetaLeadsAdsetId() {
  const { data: metaLeads, error: leadsError, count } = await supabase
    .from('meta_leads')
    .select('id, ad_id, adset_id', { count: 'exact' })
    .is('adset_id', null)
    .limit(100);

  if (leadsError) {
    console.error('❌ Erro ao buscar meta_leads:', leadsError);
    return;
  }

  console.log(`   Total sem adset_id: ${count}`);
  if (metaLeads && metaLeads.length > 0) {
    console.log(`   Processando ${metaLeads.length} registros...`);
    
    const adIds = [...new Set(metaLeads.map(lead => lead.ad_id))];
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, adset_id')
      .in('ad_id', adIds);

    if (adsError) {
      console.error('❌ Erro ao buscar ads:', adsError);
      return;
    }

    const adToAdsetMap = new Map();
    (ads || []).forEach(ad => {
      adToAdsetMap.set(ad.ad_id, ad.adset_id);
    });

    let updatedCount = 0;
    for (const lead of metaLeads) {
      const adsetId = adToAdsetMap.get(lead.ad_id);
      if (adsetId) {
        const { error: updateError } = await supabase
          .from('meta_leads')
          .update({ adset_id: adsetId })
          .eq('id', lead.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar meta_lead ${lead.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    console.log(`   ✅ Atualizados ${updatedCount} registros em meta_leads (adset_id)`);
  } else {
    console.log('   ✅ Todos os registros em meta_leads já têm adset_id');
  }
}

async function updateMetaLeadsCampaignId() {
  const { data: metaLeads, error: leadsError, count } = await supabase
    .from('meta_leads')
    .select('id, ad_id, adset_id, campaign_id', { count: 'exact' })
    .is('campaign_id', null)
    .limit(100);

  if (leadsError) {
    console.error('❌ Erro ao buscar meta_leads:', leadsError);
    return;
  }

  console.log(`   Total sem campaign_id: ${count}`);
  if (metaLeads && metaLeads.length > 0) {
    console.log(`   Processando ${metaLeads.length} registros...`);
    
    // Primeiro tentar buscar via ad_id
    const adIds = [...new Set(metaLeads.map(lead => lead.ad_id))];
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, campaign_id')
      .in('ad_id', adIds);

    if (adsError) {
      console.error('❌ Erro ao buscar ads:', adsError);
      return;
    }

    const adToCampaignMap = new Map();
    (ads || []).forEach(ad => {
      adToCampaignMap.set(ad.ad_id, ad.campaign_id);
    });

    // Para os que não têm campaign_id via ad, buscar via adset_id
    const adsetIds = [...new Set(metaLeads.map(lead => lead.adset_id).filter(id => id))];
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
    for (const lead of metaLeads) {
      let campaignId = adToCampaignMap.get(lead.ad_id);
      
      if (!campaignId && lead.adset_id) {
        campaignId = adsetToCampaignMap.get(lead.adset_id);
      }

      if (campaignId) {
        const { error: updateError } = await supabase
          .from('meta_leads')
          .update({ campaign_id: campaignId })
          .eq('id', lead.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar meta_lead ${lead.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    console.log(`   ✅ Atualizados ${updatedCount} registros em meta_leads (campaign_id)`);
  } else {
    console.log('   ✅ Todos os registros em meta_leads já têm campaign_id');
  }
}

// Executar o script
updateTableRelationships(); 