const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAdSync() {
  const adId = '6530114149488';
  console.log(`🔍 Debug detalhado para o anúncio ${adId}...\n`);
  
  try {
    // 1. Verificar se o anúncio existe na Meta API
    console.log('1️⃣ Verificando se o anúncio existe na Meta API...');
    const accountId = `act_${process.env.META_ACCOUNT_ID}`;
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    const adResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${adId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,effective_status,adset_id,campaign_id'
        }
      }
    );
    
    console.log('✅ Anúncio encontrado na Meta API:');
    console.log(`   ID: ${adResponse.data.id}`);
    console.log(`   Nome: ${adResponse.data.name}`);
    console.log(`   Status: ${adResponse.data.effective_status}`);
    console.log(`   Adset ID: ${adResponse.data.adset_id}`);
    console.log(`   Campaign ID: ${adResponse.data.campaign_id}`);
    
    // 2. Buscar insights do anúncio usando o mesmo endpoint do script de sync
    console.log('\n2️⃣ Buscando insights usando endpoint do script de sync...');
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/?ids=${adId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'insights{ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values}',
          date_preset: 'last_7d',
          time_increment: 1
        }
      }
    );
    
    console.log('✅ Resposta da Meta API:');
    console.log(JSON.stringify(insightsResponse.data, null, 2));
    
    // 3. Verificar se há dados de insights
    const adData = insightsResponse.data[adId];
    if (!adData || !adData.insights || !adData.insights.data) {
      console.log('❌ Nenhum insight encontrado para este anúncio');
      return;
    }
    
    const insights = adData.insights.data;
    console.log(`\n📊 Insights encontrados: ${insights.length} registros`);
    
    // 4. Processar cada insight e calcular leads
    console.log('\n3️⃣ Processando insights...');
    let totalLeads = 0;
    
    insights.forEach((insight, index) => {
      console.log(`\n   Insight ${index + 1}:`);
      console.log(`   Data: ${insight.date_start}`);
      console.log(`   Impressões: ${insight.impressions || 0}`);
      console.log(`   Cliques: ${insight.clicks || 0}`);
      console.log(`   Gasto: ${insight.spend || 0}`);
      
      let dayLeads = 0;
      if (insight.actions) {
        const leadActions = insight.actions.filter(action => 
          action.action_type === 'onsite_conversion.lead_grouped'
        );
        dayLeads = leadActions.reduce((sum, action) => sum + parseInt(action.value), 0);
        console.log(`   Actions: ${JSON.stringify(insight.actions)}`);
        console.log(`   Lead Actions: ${JSON.stringify(leadActions)}`);
      }
      
      console.log(`   Leads: ${dayLeads}`);
      totalLeads += dayLeads;
    });
    
    console.log(`\n📈 Total de leads calculado: ${totalLeads}`);
    
    // 5. Verificar dados atuais no Supabase
    console.log('\n4️⃣ Verificando dados atuais no Supabase...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    
    const { data: currentData, error } = await supabase
      .from('ad_insights')
      .select('*')
      .eq('ad_id', adId)
      .gte('date', startDate)
      .order('date', { ascending: false });
      
    if (error) {
      console.error('❌ Erro ao buscar dados do Supabase:', error);
      return;
    }
    
    console.log(`📊 Dados atuais no Supabase: ${currentData.length} registros`);
    currentData.forEach(record => {
      console.log(`   ${record.date}: ${record.leads || 0} leads`);
    });
    
    // 6. Simular o processo de salvamento
    console.log('\n5️⃣ Simulando processo de salvamento...');
    
    for (const insight of insights) {
      const insightData = {
        ad_id: adId,
        date: insight.date_start,
        spend: parseFloat(insight.spend || 0),
        impressions: parseInt(insight.impressions || 0),
        clicks: parseInt(insight.clicks || 0),
        ctr: parseFloat(insight.ctr || 0),
        cpc: parseFloat(insight.spend || 0) / parseInt(insight.clicks || 1),
        cpm: (parseFloat(insight.spend || 0) / parseInt(insight.impressions || 1)) * 1000,
        leads: 0
      };
      
      // Calcular leads
      if (insight.actions) {
        const leadActions = insight.actions.filter(action => 
          action.action_type === 'onsite_conversion.lead_grouped'
        );
        insightData.leads = leadActions.reduce((sum, action) => sum + parseInt(action.value), 0);
      }
      
      console.log(`   Processando ${insightData.date}: ${insightData.leads} leads`);
      
      // Tentar salvar no Supabase
      const { data: savedData, error: saveError } = await supabase
        .from('ad_insights')
        .upsert(insightData, { 
          onConflict: 'ad_id,date',
          ignoreDuplicates: false 
        })
        .select();
        
      if (saveError) {
        console.error(`   ❌ Erro ao salvar ${insightData.date}:`, saveError);
      } else {
        console.log(`   ✅ Salvo com sucesso: ${insightData.date} - ${insightData.leads} leads`);
      }
    }
    
    // 7. Verificar dados após salvamento
    console.log('\n6️⃣ Verificando dados após salvamento...');
    const { data: finalData, error: finalError } = await supabase
      .from('ad_insights')
      .select('*')
      .eq('ad_id', adId)
      .gte('date', startDate)
      .order('date', { ascending: false });
      
    if (finalError) {
      console.error('❌ Erro ao buscar dados finais:', finalError);
      return;
    }
    
    console.log(`📊 Dados finais no Supabase: ${finalData.length} registros`);
    const finalTotalLeads = finalData.reduce((sum, record) => sum + (record.leads || 0), 0);
    console.log(`📈 Total de leads no Supabase: ${finalTotalLeads}`);
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log(`Meta API: ${totalLeads} leads`);
    console.log(`Supabase: ${finalTotalLeads} leads`);
    console.log(`Diferença: ${totalLeads - finalTotalLeads} leads`);
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.response?.data || error.message);
  }
}

debugAdSync().catch(console.error); 