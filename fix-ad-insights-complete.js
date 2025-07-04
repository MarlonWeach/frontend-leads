const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdInsightsComplete() {
  const adId = '6530114149488';
  console.log(`🔧 Corrigindo insights completos do anúncio ${adId}...\n`);
  
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    // 1. Buscar insights dos últimos 7 dias usando o endpoint correto
    console.log('1️⃣ Buscando insights dos últimos 7 dias da Meta API...');
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${adId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values',
          date_preset: 'last_7d',
          time_increment: 1
        }
      }
    );
    
    console.log('✅ Insights obtidos:');
    console.log(JSON.stringify(insightsResponse.data, null, 2));
    
    const insights = insightsResponse.data.data;
    console.log(`📊 Insights encontrados: ${insights.length} registros`);
    
    // 2. Se não temos dados suficientes, tentar buscar com período específico
    if (insights.length < 7) {
      console.log('\n⚠️ Dados insuficientes, buscando com período específico...');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const specificResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${adId}/insights`,
        {
          params: {
            access_token: accessToken,
            fields: 'ad_id,ad_name,date_start,date_stop,impressions,clicks,ctr,spend,actions,action_values',
            time_range: `{'since':'${startDate}','until':'${endDate}'}`,
            time_increment: 1
          }
        }
      );
      
      console.log('✅ Insights com período específico:');
      console.log(JSON.stringify(specificResponse.data, null, 2));
      
      const specificInsights = specificResponse.data.data;
      console.log(`📊 Insights específicos encontrados: ${specificInsights.length} registros`);
      
      // Usar os insights específicos se tiver mais dados
      if (specificInsights.length > insights.length) {
        insights.length = 0; // Limpar array
        insights.push(...specificInsights);
      }
    }
    
    // 3. Processar cada insight
    console.log('\n2️⃣ Processando insights...');
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
      
      // 4. Preparar dados para salvar
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
      
      // 5. Salvar no Supabase
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
    
    // 6. Verificar dados finais no Supabase
    console.log('\n3️⃣ Verificando dados finais no Supabase...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    
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

fixAdInsightsComplete().catch(console.error); 