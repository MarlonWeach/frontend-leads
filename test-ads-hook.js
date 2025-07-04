const fetch = require('node-fetch');

async function testAdsHook() {
  console.log('🧪 Testando hook useAdsData...\n');
  
  try {
    // Simular os filtros que a página /ads usa
    const filters = {
      status: 'ACTIVE',
      startDate: '2025-06-28',
      endDate: '2025-07-04',
      limit: 1000
    };
    
    console.log('📋 Filtros sendo usados:', filters);
    
    // Fazer a requisição que o hook faria
    const response = await fetch('http://localhost:3000/api/meta/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Resposta da API:');
    console.log(`  - Total de anúncios: ${data.ads?.length || 0}`);
    console.log(`  - Tem métricas: ${!!data.meta}`);
    console.log(`  - Tem dados de ads: ${!!data.ads}`);
    
    if (data.ads && data.ads.length > 0) {
      console.log('\n📊 Primeiro anúncio:');
      const firstAd = data.ads[0];
      console.log(`  - ID: ${firstAd.id}`);
      console.log(`  - Nome: ${firstAd.name}`);
      console.log(`  - Status: ${firstAd.status}`);
      console.log(`  - Leads: ${firstAd.leads}`);
      console.log(`  - Spend: ${firstAd.spend}`);
      console.log(`  - Impressões: ${firstAd.impressions}`);
      console.log(`  - Cliques: ${firstAd.clicks}`);
      console.log(`  - CTR: ${firstAd.ctr}`);
      console.log(`  - CPC: ${firstAd.cpc}`);
      console.log(`  - CPM: ${firstAd.cpm}`);
      console.log(`  - Campanha: ${firstAd.campaign_name}`);
      console.log(`  - AdSet: ${firstAd.adset_name}`);
      console.log(`  - Tem criativo: ${!!firstAd.creative}`);
    }
    
    if (data.meta) {
      console.log('\n📈 Métricas agregadas:');
      console.log(`  - Total Spend: ${data.meta.totalSpend}`);
      console.log(`  - Total Impressões: ${data.meta.totalImpressions}`);
      console.log(`  - Total Cliques: ${data.meta.totalClicks}`);
      console.log(`  - Total Leads: ${data.meta.totalLeads}`);
      console.log(`  - CTR Médio: ${data.meta.averageCTR}`);
      console.log(`  - CPC Médio: ${data.meta.averageCPC}`);
      console.log(`  - CPM Médio: ${data.meta.averageCPM}`);
    }
    
    // Verificar se há algum problema específico
    console.log('\n🔍 Verificando problemas...');
    
    if (data.ads && data.ads.length > 0) {
      const hasInvalidData = data.ads.some(ad => {
        return !ad.id || !ad.name || typeof ad.leads !== 'number' || typeof ad.spend !== 'number';
      });
      
      if (hasInvalidData) {
        console.log('⚠️ Alguns anúncios têm dados inválidos');
      } else {
        console.log('✅ Todos os anúncios têm dados válidos');
      }
    }
    
    // Verificar se há dados suficientes para exibir
    if (data.ads && data.ads.length > 0) {
      console.log('\n✅ Dados suficientes para exibir na página');
      console.log('🎯 O problema pode estar no frontend (React/JavaScript)');
    } else {
      console.log('\n❌ Nenhum anúncio encontrado para os filtros especificados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar hook:', error);
  }
}

testAdsHook(); 