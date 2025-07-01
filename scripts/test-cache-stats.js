require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testando Cache Stats API (Vercel)...');
console.log('🚀 Iniciando testes...\n');

async function testLocalAPI() {
  try {
    console.log('🌐 Testando API local...');
    
    // Testar GET
    console.log('📡 Testando GET /api/cache-stats...');
    const getResponse = await fetch('http://localhost:3000/api/cache-stats');
    const getData = await getResponse.json();
    console.log('GET Response:', JSON.stringify(getData, null, 2));
    
    // Testar POST - stats
    console.log('\n📡 Testando POST /api/cache-stats (stats)...');
    const postStatsResponse = await fetch('http://localhost:3000/api/cache-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stats',
        data: { cacheType: 'general' }
      })
    });
    const postStatsData = await postStatsResponse.json();
    console.log('POST Stats Response:', JSON.stringify(postStatsData, null, 2));
    
    // Testar POST - update
    console.log('\n📡 Testando POST /api/cache-stats (update)...');
    const postUpdateResponse = await fetch('http://localhost:3000/api/cache-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update',
        data: { 
          cacheType: 'test',
          hits: 100,
          misses: 10,
          sizeBytes: 500000
        }
      })
    });
    const postUpdateData = await postUpdateResponse.json();
    console.log('POST Update Response:', JSON.stringify(postUpdateData, null, 2));
    
    // Testar POST - invalidate
    console.log('\n📡 Testando POST /api/cache-stats (invalidate)...');
    const postInvalidateResponse = await fetch('http://localhost:3000/api/cache-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'invalidate'
      })
    });
    const postInvalidateData = await postInvalidateResponse.json();
    console.log('POST Invalidate Response:', JSON.stringify(postInvalidateData, null, 2));
    
    // Verificar se todos os testes passaram
    const allTestsPassed = 
      getData.success && 
      postStatsData.success && 
      postUpdateData.success && 
      postInvalidateData.success;
    
    if (allTestsPassed) {
      console.log('\n✅ Todos os testes passaram!');
      console.log('🎯 API está pronta para deploy no Vercel');
    } else {
      console.log('\n❌ Alguns testes falharam');
    }
    
  } catch (err) {
    console.error('❌ Erro ao testar API local:', err.message);
    console.log('💡 Certifique-se de que o servidor está rodando (npm run dev)');
  }
}

async function testVercelAPI() {
  try {
    console.log('\n🌐 Testando API no Vercel (simulação)...');
    
    // Simular teste no Vercel (substitua pela URL real após deploy)
    const vercelUrl = 'https://frontend-leads-pi.vercel.app/api/cache-stats';
    
    console.log(`📡 Testando GET ${vercelUrl}...`);
    
    // Nota: Este teste só funcionará após o deploy no Vercel
    console.log('⚠️  Este teste requer deploy no Vercel primeiro');
    console.log('🔗 URL do Vercel:', vercelUrl);
    
  } catch (err) {
    console.error('❌ Erro ao testar API no Vercel:', err.message);
  }
}

async function main() {
  console.log('🚀 Iniciando testes de Cache Stats (Vercel)...\n');
  
  await testLocalAPI();
  await testVercelAPI();
  
  console.log('\n✅ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Deploy no Vercel: vercel --prod');
  console.log('2. Testar API no Vercel: curl https://frontend-leads-pi.vercel.app/api/cache-stats');
  console.log('3. Configurar GitHub Actions secrets');
  console.log('4. Executar workflow: cache-stats.yml');
}

main().catch(console.error); 