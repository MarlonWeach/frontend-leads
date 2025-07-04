const fetch = require('node-fetch');

async function testAdsAPI() {
  console.log('🧪 Testando API de ads...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/meta/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'ACTIVE',
        startDate: '2025-06-28',
        endDate: '2025-07-04',
        limit: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API funcionando!');
    console.log(`📊 Total de anúncios: ${data.ads?.length || 0}`);
    console.log(`📊 Métricas:`, {
      totalSpend: data.meta?.totalSpend,
      totalImpressions: data.meta?.totalImpressions,
      totalClicks: data.meta?.totalClicks,
      totalLeads: data.meta?.totalLeads,
      averageCTR: data.meta?.averageCTR,
      averageCPC: data.meta?.averageCPC,
      averageCPM: data.meta?.averageCPM
    });
    
    if (data.ads && data.ads.length > 0) {
      console.log('\n📋 Primeiro anúncio:');
      console.log('  - ID:', data.ads[0].id);
      console.log('  - Nome:', data.ads[0].name);
      console.log('  - Status:', data.ads[0].status);
      console.log('  - Leads:', data.ads[0].leads);
      console.log('  - Spend:', data.ads[0].spend);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testAdsAPI(); 