import { test, expect } from '../fixtures';
import {
  simulateLargeAdVolume,
  verifyDashboardLoading,
  measureLoadTime,
  simulateConcurrentUsers,
  verifyCacheBehavior,
  verifyDataConsistency
} from '../utils/test-helpers';

test.describe('Performance e Carga', () => {
  test('deve carregar o dashboard em menos de 2 segundos', async ({ page, mockMetaApi }) => {
    // Navega para o dashboard e mede o tempo
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto('/dashboard');
      await verifyDashboardLoading(page);
    });
    
    // Verifica se o tempo de carregamento está dentro do limite
    expect(loadTime).toBeLessThan(2000);
  });

  test('deve manter performance com grande volume de anúncios', async ({ page, mockMetaApi }) => {
    // Simula 100 anúncios ativos
    await simulateLargeAdVolume(mockMetaApi, 100);
    
    // Navega para o dashboard e mede o tempo
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto('/dashboard');
      await verifyDashboardLoading(page);
    });
    
    // Verifica se o tempo de carregamento está dentro do limite
    expect(loadTime).toBeLessThan(3000);
    
    // Verifica se a paginação está visível
    await expect(page.locator('[data-testid="pagination"]'))
      .toBeVisible();
    
    // Verifica se a lista de anúncios tem altura fixa para virtualização
    const listHeight = await page.locator('[data-testid="ads-list"]')
      .evaluate(el => el.clientHeight);
    expect(listHeight).toBeLessThan(800);
  });

  test('deve lidar com múltiplas atualizações simultâneas', async ({ page, mockMetaApi }) => {
    // Navega para o dashboard
    await page.goto('/dashboard');
    await verifyDashboardLoading(page);
    
    // Simula 5 cliques no botão de atualização
    const totalTime = await measureLoadTime(page, async () => {
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="refresh-button"]');
        await page.waitForTimeout(500); // Aguarda um pouco entre as atualizações
      }
    });
    
    // Verifica se o tempo total está dentro do limite
    expect(totalTime).toBeLessThan(10000);
    
    // Verifica se os dados permanecem consistentes
    await verifyDataConsistency(page, mockMetaApi.ads.data);
  });

  test('deve otimizar requisições usando cache', async ({ page, mockMetaApi }) => {
    // Primeiro carregamento
    await page.goto('/dashboard');
    await verifyDashboardLoading(page);
    
    // Verifica se o cache está sendo usado após 5 recarregamentos
    const isUsingCache = await verifyCacheBehavior(
      page,
      mockMetaApi,
      async () => {
        for (let i = 0; i < 5; i++) {
          await page.reload();
          await verifyDashboardLoading(page);
        }
      }
    );
    
    expect(isUsingCache).toBe(true);
  });

  test('deve lidar com concorrência de usuários', async ({ page, mockMetaApi }) => {
    // Simula 3 usuários acessando o dashboard simultaneamente
    const loadTimes = await simulateConcurrentUsers(
      page,
      3,
      async (p) => {
        await p.goto('/dashboard');
        await verifyDashboardLoading(p);
      }
    );
    
    // Verifica se o tempo de carregamento para cada usuário está dentro do limite
    loadTimes.forEach(time => {
      expect(time).toBeLessThan(5000);
    });
    
    // Verifica se todas as páginas carregaram corretamente
    const pages = await page.context().pages();
    for (const p of pages) {
      if (p !== page) {
        await expect(p.locator('[data-testid="dashboard-loading"]'))
          .not.toBeVisible();
        await expect(p.locator('[data-testid="error-message"]'))
          .not.toBeVisible();
      }
    }
  });
}); 