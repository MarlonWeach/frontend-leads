const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPerformanceData() {
  console.log('🔍 DEBUG: Análise de Dados de Performance');
  console.log('=====================================\n');

  // 1. Estrutura da tabela adset_insights
  console.log('1. Estrutura da tabela adset_insights:');
  try {
    const { data: sampleData, error: sampleError } = await supabase
      .from('adset_insights')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('   ERRO:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('   Colunas disponíveis:', Object.keys(sampleData[0]));
      console.log('   Exemplo de registro:', JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('   Tabela vazia');
    }
  } catch (error) {
    console.log('   Erro:', error.message);
  }

  // 2. Verificar dados do período 18-24/06 na adset_insights
  console.log('\n2. Dados na adset_insights (18-24/06):');
  try {
    const { data: adsetData, error: adsetError } = await supabase
      .from('adset_insights')
      .select('campaign_name, leads, spend, date')
      .gte('date', '2025-06-18')
      .lte('date', '2025-06-24')
      .order('date', { ascending: true });

    if (adsetError) {
      console.log('   ERRO:', adsetError.message);
    } else {
      console.log(`   Total de registros: ${adsetData.length}`);
      // Agrupar por campanha
      const grouped = {};
      adsetData.forEach(row => {
        if (!grouped[row.campaign_name]) {
          grouped[row.campaign_name] = { leads: 0, spend: 0, dates: [] };
        }
        grouped[row.campaign_name].leads += Number(row.leads || 0);
        grouped[row.campaign_name].spend += Number(row.spend || 0);
        grouped[row.campaign_name].dates.push(row.date);
      });
      Object.entries(grouped).forEach(([campaign, data]) => {
        console.log(`   ${campaign}: ${data.leads} leads, R$ ${data.spend.toFixed(2)}, datas: ${data.dates.join(', ')}`);
      });
    }
  } catch (error) {
    console.log('   Erro:', error.message);
  }

  // 3. Verificar dados do período 18-24/06 na meta_leads (usando created_time)
  console.log('\n3. Dados na meta_leads (18-24/06) usando created_time:');
  try {
    const { data: metaLeadsData, error: metaLeadsError } = await supabase
      .from('meta_leads')
      .select('campaign_name, lead_count, spend, created_time')
      .gte('created_time', '2025-06-18')
      .lte('created_time', '2025-06-24')
      .order('created_time', { ascending: true });

    if (metaLeadsError) {
      console.log('   ERRO:', metaLeadsError.message);
    } else {
      console.log(`   Total de registros: ${metaLeadsData.length}`);
      // Agrupar por campanha
      const grouped = {};
      metaLeadsData.forEach(row => {
        if (!grouped[row.campaign_name]) {
          grouped[row.campaign_name] = { leads: 0, spend: 0, dates: [] };
        }
        grouped[row.campaign_name].leads += Number(row.lead_count || 0);
        grouped[row.campaign_name].spend += Number(row.spend || 0);
        grouped[row.campaign_name].dates.push(row.created_time);
      });
      Object.entries(grouped).forEach(([campaign, data]) => {
        console.log(`   ${campaign}: ${data.leads} leads, R$ ${data.spend.toFixed(2)}, datas: ${data.dates.join(', ')}`);
      });
    }
  } catch (error) {
    console.log('   Erro:', error.message);
  }

  // 4. Testar a API atual
  console.log('\n4. Testando API atual (/api/performance):');
  try {
    const response = await fetch('http://localhost:3000/api/performance?page=1&limit=20&status=ACTIVE&startDate=2025-06-18&endDate=2025-06-24');
    const apiData = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Campanhas retornadas: ${apiData.campaigns?.length || 0}`);
    
    if (apiData.campaigns) {
      apiData.campaigns.forEach(campaign => {
        console.log(`   ${campaign.campaign_name}: ${campaign.leads} leads, R$ ${campaign.spend}`);
      });
    }
  } catch (error) {
    console.log('   Erro ao testar API:', error.message);
  }

  // 5. Verificar se existe tabela campaigns
  console.log('\n5. Verificando tabela campaigns:');
  try {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('campaign_name, status, data_start_date, data_end_date')
      .eq('status', 'ACTIVE')
      .limit(5);

    if (campaignsError) {
      console.log('   ERRO:', campaignsError.message);
    } else {
      console.log(`   Campanhas ativas encontradas: ${campaignsData.length}`);
      campaignsData.forEach(campaign => {
        console.log(`   ${campaign.campaign_name}: ${campaign.status}, ${campaign.data_start_date} a ${campaign.data_end_date}`);
      });
    }
  } catch (error) {
    console.log('   Erro:', error.message);
  }

  // 6. Estrutura da tabela campaigns
  console.log('\n6. Estrutura da tabela campaigns:');
  try {
    const { data: sampleCampaign, error: sampleCampaignError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    if (sampleCampaignError) {
      console.log('   ERRO:', sampleCampaignError.message);
    } else if (sampleCampaign && sampleCampaign.length > 0) {
      console.log('   Colunas disponíveis:', Object.keys(sampleCampaign[0]));
      console.log('   Exemplo de registro:', JSON.stringify(sampleCampaign[0], null, 2));
    } else {
      console.log('   Tabela vazia');
    }
  } catch (error) {
    console.log('   Erro:', error.message);
  }

  console.log('\n✅ Debug concluído!');
}

debugPerformanceData().catch(console.error); 