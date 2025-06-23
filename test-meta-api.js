const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testMetaAPI() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_ACCOUNT_ID;

  console.log('Testando Meta API...');
  console.log('Access Token:', accessToken ? 'Presente' : 'Ausente');
  console.log('Account ID:', accountId ? 'Presente' : 'Ausente');

  if (!accessToken || !accountId) {
    console.error('Variáveis de ambiente não encontradas');
    return;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${accountId}/adsets?fields=id,name,status&limit=5&access_token=${accessToken}`;
    
    console.log('Fazendo requisição para:', url);
    
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Sucesso! Dados recebidos:');
      console.log('Total de adsets:', data.data ? data.data.length : 0);
      if (data.data && data.data.length > 0) {
        console.log('Primeiro adset:', data.data[0]);
      }
    } else {
      console.error('❌ Erro na API:', data);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testMetaAPI(); 