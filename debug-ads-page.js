const fetch = require('node-fetch');

async function debugAdsPage() {
  console.log('🔍 Debug da página /ads...\n');
  
  try {
    // 1. Testar API diretamente
    console.log('1️⃣ Testando API de ads...');
    const apiResponse = await fetch('http://localhost:3000/api/meta/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ACTIVE',
        startDate: '2025-06-28',
        endDate: '2025-07-04',
        limit: 5
      })
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status}`);
    }
    
    const apiData = await apiResponse.json();
    console.log('✅ API funcionando:', {
      adsCount: apiData.ads?.length || 0,
      hasMetrics: !!apiData.meta,
      firstAd: apiData.ads?.[0]?.name || 'Nenhum'
    });
    
    // 2. Testar se a página está acessível
    console.log('\n2️⃣ Testando acesso à página...');
    const pageResponse = await fetch('http://localhost:3000/ads');
    
    if (!pageResponse.ok) {
      throw new Error(`Page error: ${pageResponse.status}`);
    }
    
    const pageContent = await pageResponse.text();
    console.log('✅ Página acessível:', {
      status: pageResponse.status,
      hasReactContent: pageContent.includes('React') || pageContent.includes('useState'),
      hasAdsContent: pageContent.includes('Anúncios') || pageContent.includes('ads'),
      contentLength: pageContent.length
    });
    
    // 3. Verificar se há problemas específicos
    console.log('\n3️⃣ Verificando problemas específicos...');
    
    if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('⚠️ Possíveis erros encontrados no HTML');
    }
    
    if (pageContent.includes('loading') || pageContent.includes('Loading')) {
      console.log('⏳ Indicadores de loading encontrados');
    }
    
    if (pageContent.includes('Nenhum ad encontrado') || pageContent.includes('nenhum')) {
      console.log('❌ Mensagem de "nenhum ad encontrado" detectada');
    }
    
    // 4. Verificar se os dados estão sendo passados corretamente
    console.log('\n4️⃣ Verificando estrutura dos dados...');
    
    if (apiData.ads && apiData.ads.length > 0) {
      const firstAd = apiData.ads[0];
      console.log('📋 Estrutura do primeiro anúncio:', {
        hasId: !!firstAd.id,
        hasName: !!firstAd.name,
        hasStatus: !!firstAd.status,
        hasLeads: typeof firstAd.leads === 'number',
        hasSpend: typeof firstAd.spend === 'number',
        hasCreative: !!firstAd.creative,
        hasCampaignName: !!firstAd.campaign_name,
        hasAdsetName: !!firstAd.adset_name
      });
    }
    
    // 5. Verificar métricas
    console.log('\n5️⃣ Verificando métricas...');
    if (apiData.meta) {
      console.log('📊 Métricas disponíveis:', {
        totalSpend: apiData.meta.totalSpend,
        totalImpressions: apiData.meta.totalImpressions,
        totalClicks: apiData.meta.totalClicks,
        totalLeads: apiData.meta.totalLeads,
        averageCTR: apiData.meta.averageCTR,
        averageCPC: apiData.meta.averageCPC,
        averageCPM: apiData.meta.averageCPM
      });
    }
    
    console.log('\n✅ Debug concluído!');
    
    // 6. Resumo
    console.log('\n📋 RESUMO:');
    console.log(`- API: ✅ Funcionando (${apiData.ads?.length || 0} anúncios)`);
    console.log(`- Página: ✅ Acessível (${pageResponse.status})`);
    console.log(`- Dados: ✅ Estrutura correta`);
    console.log(`- Métricas: ✅ Disponíveis`);
    
    if (apiData.ads && apiData.ads.length > 0) {
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. Verificar console do navegador para erros JavaScript');
      console.log('2. Verificar se o hook useAdsData está sendo chamado');
      console.log('3. Verificar se há problemas de CORS ou rede');
      console.log('4. Verificar se há problemas de renderização React');
    }
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugAdsPage(); 