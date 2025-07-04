const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdDiscrepancy() {
  const adId = '6530114149488';
  console.log(`🔍 Verificando discrepância para o anúncio ${adId}...\n`);
  
  try {
    // 1. Buscar dados da Meta API
    console.log('📊 Buscando dados da Meta API...');
    const accountId = `act_${process.env.META_ACCOUNT_ID}`;
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${accountId}/insights`,
      {
        params: {
          access_token: accessToken,
          ad_id: adId,
          fields: 'ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values',
          date_preset: 'last_7d',
          time_increment: 1
        }
      }
    );
    
    console.log('✅ Dados da Meta API obtidos com sucesso');
    
    // Calcular total de leads da Meta API
    const metaApiData = response.data.data;
    const totalLeadsMeta = metaApiData.reduce((sum, day) => {
      if (day.actions) {
        const leadActions = day.actions.filter(action => 
          action.action_type === 'onsite_conversion.lead_grouped'
        );
        return sum + leadActions.reduce((daySum, action) => daySum + parseInt(action.value), 0);
      }
      return sum;
    }, 0);
    
    console.log(`📈 Total de leads da Meta API (últimos 7 dias): ${totalLeadsMeta}`);
    
    // 2. Buscar dados do Supabase
    console.log('\n📊 Buscando dados do Supabase...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const { data: supabaseData, error } = await supabase
      .from('ad_insights')
      .select('leads, date, spend, impressions, clicks')
      .eq('ad_id', adId)
      .gte('date', startDate)
      .order('date', { ascending: false });
      
    if (error) {
      console.error('❌ Erro ao buscar dados do Supabase:', error);
      return;
    }
    
    console.log('✅ Dados do Supabase obtidos com sucesso');
    
    const totalLeadsSupabase = supabaseData.reduce((sum, insight) => sum + (insight.leads || 0), 0);
    
    console.log(`📊 Total de leads do Supabase (últimos 7 dias): ${totalLeadsSupabase}`);
    
    // 3. Comparar dados
    console.log('\n📊 COMPARAÇÃO:');
    console.log(`Meta API: ${totalLeadsMeta} leads`);
    console.log(`Supabase: ${totalLeadsSupabase} leads`);
    console.log(`Diferença: ${totalLeadsMeta - totalLeadsSupabase} leads`);
    
    if (totalLeadsMeta !== totalLeadsSupabase) {
      console.log('\n🔍 Detalhamento por dia:');
      console.log('Data\t\tMeta API\tSupabase\tDiferença');
      console.log('----\t\t--------\t--------\t---------');
      
      metaApiData.forEach(day => {
        const date = day.date_start;
        const metaLeads = day.actions ? 
          day.actions
            .filter(action => action.action_type === 'onsite_conversion.lead_grouped')
            .reduce((sum, action) => sum + parseInt(action.value), 0) : 0;
        
        const supabaseDay = supabaseData.find(s => s.date === date);
        const supabaseLeads = supabaseDay ? (supabaseDay.leads || 0) : 0;
        
        console.log(`${date}\t${metaLeads}\t\t${supabaseLeads}\t\t${metaLeads - supabaseLeads}`);
      });
    }
    
    // 4. Verificar se o anúncio está ativo
    console.log('\n🔍 Verificando status do anúncio...');
    const adResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${adId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,effective_status'
        }
      }
    );
    
    console.log(`Status do anúncio: ${adResponse.data.effective_status}`);
    console.log(`Nome: ${adResponse.data.name}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

checkAdDiscrepancy().catch(console.error); 