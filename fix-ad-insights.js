const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdInsights() {
  const adId = '6530114149488';
  console.log(`🔧 Corrigindo insights do anúncio ${adId}...\n`);
  
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    // 1. Buscar insights diários usando o endpoint correto
    console.log('1️⃣ Buscando insights diários da Meta API...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v25.0/${adId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values',
          date_preset: 'last_7d',
          time_increment: 1
        }
      }
    );
    
    console.log('✅ Insights diários obtidos:');
    console.log(JSON.stringify(insightsResponse.data, null, 2));
    
    const insights = insightsResponse.data.data;
    console.log(`📊 Insights encontrados: ${insights.length} registros diários`);
    
    // 2. Processar cada insight diário
    console.log('\n2️⃣ Processando insights diários...');
    let totalLeads = 0;
    
    for (const insight of insights) {
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
      
      // 3. Preparar dados para salvar
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
      
      // 4. Salvar no Supabase
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
    
    // 5. Verificar dados finais no Supabase
    console.log('\n3️⃣ Verificando dados finais no Supabase...');
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
    
    finalData.forEach(record => {
      console.log(`   ${record.date}: ${record.leads || 0} leads`);
    });
    
    console.log(`📈 Total de leads no Supabase: ${finalTotalLeads}`);
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log(`Meta API: ${totalLeads} leads`);
    console.log(`Supabase: ${finalTotalLeads} leads`);
    console.log(`Diferença: ${totalLeads - finalTotalLeads} leads`);
    
    if (totalLeads === finalTotalLeads) {
      console.log('✅ SUCESSO: Dados sincronizados corretamente!');
    } else {
      console.log('❌ PROBLEMA: Ainda há discrepância nos dados');
    }
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error.response?.data || error.message);
  }
}

fixAdInsights().catch(console.error); 