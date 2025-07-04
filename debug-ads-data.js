require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAdsData() {
  console.log('🔍 Debugando dados da página /ads...\n');

  // 1. Verificar se a tabela ad_insights existe e tem dados
  console.log('1. Verificando tabela ad_insights...');
  const { data: insightsData, error: insightsError } = await supabase
    .from('ad_insights')
    .select('*')
    .limit(10);

  if (insightsError) {
    console.log('❌ Erro ao acessar ad_insights:', insightsError.message);
  } else {
    console.log(`✅ Tabela ad_insights encontrada com ${insightsData?.length || 0} registros`);
    if (insightsData && insightsData.length > 0) {
      console.log('📊 Exemplo de dados:', JSON.stringify(insightsData[0], null, 2));
    }
  }

  // 2. Verificar dados de ontem (2024-06-20)
  console.log('\n2. Verificando dados de ontem (2024-06-20)...');
  const { data: yesterdayData, error: yesterdayError } = await supabase
    .from('ad_insights')
    .select('*')
    .eq('date', '2024-06-20');

  if (yesterdayError) {
    console.log('❌ Erro ao buscar dados de ontem:', yesterdayError.message);
  } else {
    console.log(`📅 Dados de ontem: ${yesterdayData?.length || 0} registros`);
    if (yesterdayData && yesterdayData.length > 0) {
      const totalLeads = yesterdayData.reduce((sum, record) => sum + (parseInt(record.leads) || 0), 0);
      console.log(`📊 Total de leads de ontem: ${totalLeads}`);
      console.log('📋 Exemplo de registro:', JSON.stringify(yesterdayData[0], null, 2));
    }
  }

  // 3. Verificar dados dos últimos 7 dias
  console.log('\n3. Verificando dados dos últimos 7 dias...');
  const { data: weekData, error: weekError } = await supabase
    .from('ad_insights')
    .select('*')
    .gte('date', '2024-06-14')
    .lte('date', '2024-06-20');

  if (weekError) {
    console.log('❌ Erro ao buscar dados da semana:', weekError.message);
  } else {
    console.log(`📅 Dados da semana: ${weekData?.length || 0} registros`);
    if (weekData && weekData.length > 0) {
      const totalLeads = weekData.reduce((sum, record) => sum + (parseInt(record.leads) || 0), 0);
      console.log(`📊 Total de leads da semana: ${totalLeads}`);
      
      // Agrupar por data
      const byDate = weekData.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(record);
        return acc;
      }, {});
      
      console.log('📋 Leads por dia:');
      Object.keys(byDate).sort().forEach(date => {
        const dayLeads = byDate[date].reduce((sum, record) => sum + (parseInt(record.leads) || 0), 0);
        console.log(`  ${date}: ${dayLeads} leads`);
      });
    }
  }

  // 4. Verificar dados da tabela ads
  console.log('\n4. Verificando tabela ads...');
  const { data: adsData, error: adsError } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'ACTIVE')
    .limit(5);

  if (adsError) {
    console.log('❌ Erro ao acessar ads:', adsError.message);
  } else {
    console.log(`✅ Tabela ads encontrada com ${adsData?.length || 0} anúncios ativos`);
    if (adsData && adsData.length > 0) {
      console.log('📊 Exemplo de dados:', JSON.stringify(adsData[0], null, 2));
    }
  }

  // 5. Verificar dados da tabela meta_leads para ontem
  console.log('\n5. Verificando meta_leads de ontem...');
  const { data: leadsData, error: leadsError } = await supabase
    .from('meta_leads')
    .select('*')
    .gte('created_time', '2024-06-20T00:00:00')
    .lt('created_time', '2024-06-21T00:00:00');

  if (leadsError) {
    console.log('❌ Erro ao buscar meta_leads:', leadsError.message);
  } else {
    console.log(`📅 Meta_leads de ontem: ${leadsData?.length || 0} registros`);
    if (leadsData && leadsData.length > 0) {
      console.log('📊 Exemplo de registro:', JSON.stringify(leadsData[0], null, 2));
    }
  }

  console.log('\n🔍 Debug concluído!');
}

debugAdsData().catch(console.error); 