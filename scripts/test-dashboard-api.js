require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDashboardAPI() {
  try {
    console.log('🧪 Testando API do dashboard...');

    const dateFrom = '2025-07-02';
    const dateTo = '2025-07-02';

    console.log('📅 Filtros:', { dateFrom, dateTo });

    // 1. Testar query direta no Supabase
    console.log('\n🔍 Testando query direta no Supabase...');
    const { data: directData, error: directError } = await supabase
      .from('campaign_insights')
      .select('campaign_id, date, leads, spend, impressions, clicks')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (directError) {
      console.error('❌ Erro na query direta:', directError);
      return;
    }

    console.log(`✅ Query direta retornou ${directData.length} registros`);
    if (directData.length > 0) {
      console.log('📊 Primeiros registros:');
      directData.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. campaign_id: ${record.campaign_id}, leads: ${record.leads}, spend: ${record.spend}`);
      });
    }

    // 2. Simular a lógica da API
    console.log('\n🔍 Simulando lógica da API...');
    
    // Buscar campanhas
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, status');

    if (campaignsError) {
      console.error('❌ Erro ao buscar campanhas:', campaignsError);
      return;
    }

    const activeCampaignIds = campaigns.filter(c => c.status === 'ACTIVE').map(c => c.id);
    const campaignIdToNameMap = new Map(campaigns.map(c => [c.id, c.name]));

    console.log(`📊 Campanhas ativas: ${activeCampaignIds.length}`);

    // Agregar métricas
    const metricsAggregation = (directData || []).reduce((acc, entry) => {
      acc.totalLeads += (parseInt(entry.leads) || 0);
      acc.totalSpend += (parseFloat(entry.spend) || 0);
      acc.totalImpressions += (parseInt(entry.impressions) || 0);
      acc.totalClicks += (parseInt(entry.clicks) || 0);
      return acc;
    }, { totalLeads: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });

    console.log('📊 Métricas agregadas:', metricsAggregation);

    // 3. Verificar se há dados para campanhas ativas
    console.log('\n🔍 Verificando dados para campanhas ativas...');
    const activeCampaignData = directData.filter(entry => activeCampaignIds.includes(entry.campaign_id));
    console.log(`📊 Registros para campanhas ativas: ${activeCampaignData.length}`);

    if (activeCampaignData.length > 0) {
      console.log('📊 Dados de campanhas ativas:');
      activeCampaignData.forEach((record, index) => {
        const campaignName = campaignIdToNameMap.get(record.campaign_id) || 'Desconhecido';
        console.log(`${index + 1}. ${campaignName} (${record.campaign_id}): leads=${record.leads}, spend=${record.spend}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDashboardAPI(); 