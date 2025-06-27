#!/usr/bin/env node

/**
 * Script para verificar relacionamentos entre tabelas
 * Este script analisa a consistência dos IDs entre as tabelas
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTableRelationships() {
  console.log('🔍 Verificando relacionamentos entre tabelas...\n');

  try {
    // 1. Verificar adset_insights
    console.log('📊 1. Verificando adset_insights...');
    
    const { data: adsetInsights, error: insightsError } = await supabase
      .from('adset_insights')
      .select('id, adset_id, campaign_id, date')
      .gte('date', '2025-06-20')
      .limit(10);

    if (insightsError) {
      console.error('❌ Erro ao buscar adset_insights:', insightsError);
      return;
    }

    console.log('   Exemplos de adset_insights:');
    (adsetInsights || []).forEach(insight => {
      console.log(`     ${insight.date} - adset_id: ${insight.adset_id}, campaign_id: ${insight.campaign_id || 'NULL'}`);
    });

    // 2. Verificar ads
    console.log('\n📊 2. Verificando ads...');
    
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('ad_id, adset_id, campaign_id, name')
      .limit(10);

    if (adsError) {
      console.error('❌ Erro ao buscar ads:', adsError);
      return;
    }

    console.log('   Exemplos de ads:');
    (ads || []).forEach(ad => {
      console.log(`     ${ad.name} - adset_id: ${ad.adset_id}, campaign_id: ${ad.campaign_id || 'NULL'}`);
    });

    // 3. Verificar adsets
    console.log('\n📊 3. Verificando adsets...');
    
    const { data: adsets, error: adsetsError } = await supabase
      .from('adsets')
      .select('id, name, campaign_id')
      .limit(10);

    if (adsetsError) {
      console.error('❌ Erro ao buscar adsets:', adsetsError);
      return;
    }

    console.log('   Exemplos de adsets:');
    (adsets || []).forEach(adset => {
      console.log(`     ${adset.name} - id: ${adset.id}, campaign_id: ${adset.campaign_id || 'NULL'}`);
    });

    // 4. Verificar campaigns
    console.log('\n📊 4. Verificando campaigns...');
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, status')
      .limit(10);

    if (campaignsError) {
      console.error('❌ Erro ao buscar campaigns:', campaignsError);
      return;
    }

    console.log('   Exemplos de campaigns:');
    (campaigns || []).forEach(campaign => {
      console.log(`     ${campaign.name} - id: ${campaign.id}, status: ${campaign.status}`);
    });

    // 5. Estatísticas de relacionamentos
    console.log('\n📊 5. Estatísticas de relacionamentos...');
    
    // Contar registros sem campaign_id
    const { count: insightsWithoutCampaign } = await supabase
      .from('adset_insights')
      .select('*', { count: 'exact', head: true })
      .is('campaign_id', null);

    const { count: adsWithoutCampaign } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .is('campaign_id', null);

    console.log(`   adset_insights sem campaign_id: ${insightsWithoutCampaign || 0}`);
    console.log(`   ads sem campaign_id: ${adsWithoutCampaign || 0}`);

    // 6. Verificar dados de performance
    console.log('\n📊 6. Testando API de performance...');
    
    const response = await fetch('http://localhost:3000/api/performance?page=1&limit=5&status=ALL');
    if (response.ok) {
      const data = await response.json();
      console.log(`   API retornou ${data.campaigns.length} campanhas`);
      console.log(`   Total de leads: ${data.metrics.totalLeads}`);
      console.log(`   Total de gastos: R$ ${data.metrics.totalSpend.toFixed(2)}`);
    } else {
      console.log('   ❌ Erro ao testar API de performance');
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o script
verifyTableRelationships(); 