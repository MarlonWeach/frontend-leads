import { Page, expect } from '@playwright/test';
import { MockMetaApi } from '../fixtures/meta-api';

export async function waitForDashboardData(page: Page) {
  // Aguarda o carregamento inicial dos dados
  await page.waitForSelector('[data-testid="dashboard-loading"]', { state: 'hidden' });
  
  // Aguarda a presença dos dados no dashboard
  await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
  await expect(page.locator('[data-testid="dashboard-activity"]')).toBeVisible();
  await expect(page.locator('[data-testid="dashboard-recent-sales"]')).toBeVisible();
}

export async function verifyActiveAdsFilter(page: Page) {
  // Verifica se o badge de anúncios ativos está presente
  await expect(page.locator('[data-testid="active-ads-badge"]')).toBeVisible();
  
  // Verifica se os dados exibidos correspondem apenas a anúncios ativos
  const overviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
  expect(overviewData).toContain('Anúncio Ativo 1');
  expect(overviewData).toContain('Anúncio Ativo 2');
  expect(overviewData).not.toContain('Anúncio Inativo 1');
}

export async function verifyErrorHandling(page: Page) {
  // Simula um erro na API
  await page.route('**/api/dashboard/overview**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    });
  });
  
  // Recarrega a página
  await page.reload();
  
  // Verifica se a mensagem de erro é exibida
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  
  // Verifica se o botão de retry está presente
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  
  // Simula uma recuperação bem-sucedida
  await page.route('**/api/dashboard/overview**', async (route) => {
    await route.continue();
  });
  
  // Clica no botão de retry
  await page.click('[data-testid="retry-button"]');
  
  // Verifica se os dados são carregados corretamente após o retry
  await waitForDashboardData(page);
}

// Funções auxiliares para os testes

/**
 * Simula um erro temporário na API da Meta
 */
export async function simulateTemporaryError(mockApi: MockMetaApi, duration: number = 5000) {
  mockApi.simulateError = true;
  mockApi.errorType = 'TEMPORARY';
  
  // Restaura após o tempo especificado
  setTimeout(() => {
    mockApi.simulateError = false;
    mockApi.errorType = null;
  }, duration);
}

/**
 * Simula um grande volume de anúncios ativos
 */
export async function simulateLargeAdVolume(mockApi: MockMetaApi, count: number = 100) {
  const newAds = Array.from({ length: count }, (_, i) => ({
    id: `ad_${i + 1}`,
    name: `Anúncio Ativo ${i + 1}`,
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    spend: Math.random() * 1000,
    impressions: Math.floor(Math.random() * 10000),
    clicks: Math.floor(Math.random() * 1000),
    leads: Math.floor(Math.random() * 100)
  }));

  mockApi.ads.data = newAds;
}

/**
 * Verifica se o dashboard está carregando corretamente
 */
export async function verifyDashboardLoading(page: Page) {
  // Aguarda o carregamento inicial
  await page.waitForSelector('[data-testid="dashboard-loading"]', { state: 'hidden' });
  
  // Verifica se os elementos principais estão visíveis
  await page.waitForSelector('[data-testid="ads-list"]');
  await page.waitForSelector('[data-testid="metrics-summary"]');
  
  // Verifica se não há mensagens de erro
  const errorMessage = await page.locator('[data-testid="error-message"]').count();
  expect(errorMessage).toBe(0);
}

/**
 * Mede o tempo de carregamento de uma ação
 */
export async function measureLoadTime(page: Page, action: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Simula múltiplos usuários acessando o dashboard simultaneamente
 */
export async function simulateConcurrentUsers(
  page: Page,
  userCount: number,
  action: (page: Page) => Promise<void>
): Promise<number[]> {
  const loadTimes: number[] = [];
  
  // Cria múltiplas páginas para simular usuários concorrentes
  const pages = await Promise.all(
    Array.from({ length: userCount }, () => page.context().newPage())
  );
  
  // Executa a ação em todas as páginas simultaneamente
  await Promise.all(
    pages.map(async (p) => {
      const loadTime = await measureLoadTime(p, () => action(p));
      loadTimes.push(loadTime);
    })
  );
  
  // Fecha as páginas extras
  await Promise.all(pages.slice(1).map(p => p.close()));
  
  return loadTimes;
}

/**
 * Verifica se o cache está funcionando corretamente
 */
export async function verifyCacheBehavior(
  page: Page,
  mockApi: MockMetaApi,
  action: () => Promise<void>
): Promise<boolean> {
  const initialRequestCount = mockApi.ads.requestCount;
  
  // Executa a ação que deve usar o cache
  await action();
  
  // Verifica se o número de requisições não aumentou significativamente
  const finalRequestCount = mockApi.ads.requestCount;
  return finalRequestCount - initialRequestCount <= 2;
}

/**
 * Verifica se os dados exibidos estão consistentes
 */
export async function verifyDataConsistency(page: Page, expectedData: any[]) {
  const displayedAds = await page.locator('[data-testid="ad-item"]').all();
  
  // Verifica se o número de anúncios está correto
  expect(displayedAds.length).toBe(expectedData.length);
  
  // Verifica se os dados de cada anúncio estão corretos
  for (let i = 0; i < expectedData.length; i++) {
    const ad = expectedData[i];
    const displayedAd = displayedAds[i];
    
    // Verifica nome
    await expect(displayedAd.locator('[data-testid="ad-name"]'))
      .toHaveText(ad.name);
    
    // Verifica status
    await expect(displayedAd.locator('[data-testid="ad-status"]'))
      .toHaveText(ad.effective_status);
    
    // Verifica métricas
    await expect(displayedAd.locator('[data-testid="ad-spend"]'))
      .toHaveText(`R$ ${ad.spend.toFixed(2)}`);
    await expect(displayedAd.locator('[data-testid="ad-impressions"]'))
      .toHaveText(ad.impressions.toString());
    await expect(displayedAd.locator('[data-testid="ad-clicks"]'))
      .toHaveText(ad.clicks.toString());
    await expect(displayedAd.locator('[data-testid="ad-leads"]'))
      .toHaveText(ad.leads.toString());
  }
} 