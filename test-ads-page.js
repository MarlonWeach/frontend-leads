const puppeteer = require('puppeteer');

async function testAdsPage() {
  console.log('🧪 Testando página /ads...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Interceptar requisições para ver o que está acontecendo
    page.on('request', request => {
      if (request.url().includes('/api/meta/ads')) {
        console.log('📡 Requisição para API de ads:', request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/meta/ads')) {
        console.log('📡 Resposta da API de ads:', response.status());
      }
    });
    
    // Interceptar erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erro no console:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️ Aviso no console:', msg.text());
      }
    });
    
    console.log('🌐 Navegando para http://localhost:3000/ads...');
    await page.goto('http://localhost:3000/ads', { waitUntil: 'networkidle0' });
    
    console.log('⏳ Aguardando carregamento da página...');
    await page.waitForTimeout(5000);
    
    // Verificar se há dados sendo exibidos
    const adsCount = await page.evaluate(() => {
      const adsElements = document.querySelectorAll('[data-testid="ad-item"], .ad-item, tr[data-ad-id]');
      return adsElements.length;
    });
    
    console.log(`📊 Anúncios encontrados na página: ${adsCount}`);
    
    // Verificar se há mensagens de erro
    const errorMessages = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
      return Array.from(errorElements).map(el => el.textContent);
    });
    
    if (errorMessages.length > 0) {
      console.log('❌ Mensagens de erro encontradas:', errorMessages);
    }
    
    // Verificar se há indicadores de loading
    const loadingElements = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
      return loadingElements.length;
    });
    
    console.log(`⏳ Elementos de loading: ${loadingElements}`);
    
    // Verificar o conteúdo da página
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasAdsTable: !!document.querySelector('table, [role="table"]'),
        hasFilters: !!document.querySelector('.filters, [data-testid="filters"]'),
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('📄 Informações da página:');
    console.log('  - Título:', pageContent.title);
    console.log('  - Tem tabela de anúncios:', pageContent.hasAdsTable);
    console.log('  - Tem filtros:', pageContent.hasFilters);
    console.log('  - Texto da página (primeiros 500 chars):', pageContent.bodyText.substring(0, 200) + '...');
    
    // Aguardar um pouco mais para ver se algo carrega
    console.log('⏳ Aguardando mais 10 segundos para ver se dados carregam...');
    await page.waitForTimeout(10000);
    
    // Verificar novamente
    const finalAdsCount = await page.evaluate(() => {
      const adsElements = document.querySelectorAll('[data-testid="ad-item"], .ad-item, tr[data-ad-id]');
      return adsElements.length;
    });
    
    console.log(`📊 Anúncios após 10 segundos: ${finalAdsCount}`);
    
    if (finalAdsCount === 0) {
      console.log('❌ Nenhum anúncio encontrado na página!');
      
      // Verificar se há algum erro específico
      const networkErrors = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .filter(entry => entry.transferSize === 0 || entry.duration > 10000)
          .map(entry => ({
            url: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize
          }));
      });
      
      if (networkErrors.length > 0) {
        console.log('🌐 Problemas de rede detectados:', networkErrors);
      }
    } else {
      console.log('✅ Página /ads funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testAdsPage(); 