const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncHistoricalData() {
  const adId = '6530114149488';
  console.log(`🔄 Sincronizando dados históricos do anúncio ${adId}...\n`);
  
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    // 1. Tentar buscar dados com período específico mais amplo
    console.log('1️⃣ Buscando dados com período específico (últimos 30 dias)...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    const historicalResponse = await axios.get(
      `https://graph.facebook.com/v25.0/${adId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values',
          time_range: `{'since':'${startDate}','until':'${endDate}'}`,
          time_increment: 1
        }
      }
    );
    
    console.log('✅ Dados históricos obtidos:');
    console.log(JSON.stringify(historicalResponse.data, null, 2));
    
    const historicalInsights = historicalResponse.data.data;
    console.log(`📊 Insights históricos encontrados: ${historicalInsights.length} registros`);
    
    // 2. Filtrar apenas os últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStart = sevenDaysAgo.toISOString().split('T')[0];
    
    const last7DaysInsights = historicalInsights.filter(insight => 
      insight.date_start >= sevenDaysStart
    );
    
    console.log(`📊 Insights dos últimos 7 dias: ${last7DaysInsights.length} registros`);
    
    // 3. Processar e salvar dados
    console.log('\n2️⃣ Processando e salvando dados...');
    let totalLeads = 0;
    
    for (const insight of last7DaysInsights) {
      console.log(`\n   Processando ${insight.date_start}:`);
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
      
      // Preparar dados para salvar
      const insightData = {
        ad_id: adId,
        date: insight.date_start,
        spend: parseFloat(insight.spend || 0),
        impressions: parseInt(insight.impressions || 0),
        clicks: parseInt(insight.clicks || 0),
        ctr: parseFloat(insight.ctr || 0),
        cpc: parseInt(insight.clicks || 0) > 0 ? parseFloat(insight.spend || 0) / parseInt(insight.clicks || 0) : 0,
        cpm: parseInt(insight.impressions || 0) > 0 ? (parseFloat(insight.spend || 0) / parseInt(insight.impressions || 0)) * 1000 : 0,
        leads: dayLeads
      };
      
      // Salvar no Supabase
      console.log(`   Salvando ${insightData.date} com ${insightData.leads} leads...`);
      
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
    
    console.log(`\n📈 Total de leads processados: ${totalLeads}`);
    
    // 4. Verificar dados finais
    console.log('\n3️⃣ Verificando dados finais no Supabase...');
    const { data: finalData, error: finalError } = await supabase
      .from('ad_insights')
      .select('*')
      .eq('ad_id', adId)
      .gte('date', sevenDaysStart)
      .order('date', { ascending: false });
      
    if (finalError) {
      console.error('❌ Erro ao buscar dados finais:', finalError);
      return;
    }
    
    console.log(`📊 Dados finais no Supabase: ${finalData.length} registros`);
    const finalTotalLeads = finalData.reduce((sum, record) => sum + (record.leads || 0), 0);
    
    finalData.forEach(record => {
      console.log(`   ${record.date}: ${record.leads || 0} leads`);
    });
    
    console.log(`📈 Total de leads no Supabase: ${finalTotalLeads}`);
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log(`Meta API (últimos 7 dias): ${totalLeads} leads`);
    console.log(`Supabase: ${finalTotalLeads} leads`);
    console.log(`Diferença: ${totalLeads - finalTotalLeads} leads`);
    
    if (totalLeads === finalTotalLeads) {
      console.log('✅ SUCESSO: Dados históricos sincronizados corretamente!');
    } else {
      console.log('❌ PROBLEMA: Ainda há discrepância nos dados');
    }
    
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error.response?.data || error.message);
  }
}

syncHistoricalData().catch(console.error); 