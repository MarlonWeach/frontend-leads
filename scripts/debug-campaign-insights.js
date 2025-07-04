require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCampaignInsights() {
  try {
    console.log('🔍 Debugando tabela campaign_insights...');

    // 1. Verificar se a tabela existe e tem dados
    const { data: allData, error: allError } = await supabase
      .from('campaign_insights')
      .select('*')
      .limit(10);

    if (allError) {
      console.error('❌ Erro ao buscar dados:', allError);
      return;
    }

    console.log(`📊 Total de registros encontrados: ${allData.length}`);
    
    if (allData.length > 0) {
      console.log('📅 Primeiros registros:');
      allData.forEach((record, index) => {
        console.log(`${index + 1}. campaign_id: ${record.campaign_id}, date: ${record.date}, leads: ${record.leads}, spend: ${record.spend}`);
      });
    }

    // 2. Verificar dados para datas específicas
    console.log('\n🔍 Verificando dados para 2025-07-02...');
    const { data: specificData, error: specificError } = await supabase
      .from('campaign_insights')
      .select('*')
      .eq('date', '2025-07-02');

    if (specificError) {
      console.error('❌ Erro ao buscar dados específicos:', specificError);
      return;
    }

    console.log(`📊 Registros para 2025-07-02: ${specificData.length}`);
    if (specificData.length > 0) {
      specificData.forEach((record, index) => {
        console.log(`${index + 1}. campaign_id: ${record.campaign_id}, leads: ${record.leads}, spend: ${record.spend}`);
      });
    }

    // 3. Verificar dados para range de datas
    console.log('\n🔍 Verificando dados para range 2025-07-01 a 2025-07-03...');
    const { data: rangeData, error: rangeError } = await supabase
      .from('campaign_insights')
      .select('*')
      .gte('date', '2025-07-01')
      .lte('date', '2025-07-03');

    if (rangeError) {
      console.error('❌ Erro ao buscar range de datas:', rangeError);
      return;
    }

    console.log(`📊 Registros para range: ${rangeData.length}`);
    if (rangeData.length > 0) {
      rangeData.forEach((record, index) => {
        console.log(`${index + 1}. date: ${record.date}, campaign_id: ${record.campaign_id}, leads: ${record.leads}, spend: ${record.spend}`);
      });
    }

    // 4. Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('campaign_insights')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao buscar amostra:', sampleError);
      return;
    }

    if (sampleData.length > 0) {
      console.log('📋 Estrutura da tabela:');
      console.log(Object.keys(sampleData[0]));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugCampaignInsights(); 