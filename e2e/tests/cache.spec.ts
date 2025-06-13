import { test, expect } from '../fixtures';
import { test as supabaseTest } from '../fixtures/supabase';
import { waitForDashboardData, verifyCacheBehavior } from '../utils/test-helpers';

test.describe('Cache de Dados', () => {
  test('deve usar cache para requisições subsequentes', async ({ page, mockMetaApi, mockSupabase }) => {
    // Acessa a página do dashboard pela primeira vez
    await page.goto('/dashboard');
    
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Verifica o timestamp da última atualização
    const lastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    const firstUpdateTime = new Date(lastUpdated).getTime();
    
    // Recarrega a página
    await page.reload();
    
    // Aguarda o carregamento dos dados
    await waitForDashboardData(page);
    
    // Verifica se o timestamp não mudou (dados vieram do cache)
    const newLastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    const secondUpdateTime = new Date(newLastUpdated).getTime();
    expect(secondUpdateTime).toBe(firstUpdateTime);
    
    // Força uma atualização manual
    await page.click('[data-testid="refresh-button"]');
    
    // Aguarda a atualização completar
    await waitForDashboardData(page);
    
    // Verifica se o timestamp foi atualizado
    const finalLastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    const finalUpdateTime = new Date(finalLastUpdated).getTime();
    expect(finalUpdateTime).toBeGreaterThan(firstUpdateTime);
  });
  
  test('deve invalidar cache após TTL expirar', async ({ page, mockMetaApi, mockSupabase }) => {
    // Acessa a página do dashboard
    await page.goto('/dashboard');
    
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Verifica o timestamp da última atualização
    const lastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    const firstUpdateTime = new Date(lastUpdated).getTime();
    
    // Simula passagem do tempo (TTL do cache)
    await page.evaluate(() => {
      // Força expiração do cache alterando o timestamp
      const cacheTimestamp = localStorage.getItem('dashboard-cache-timestamp');
      if (cacheTimestamp) {
        const expiredTime = new Date(cacheTimestamp).getTime() - 3600000; // 1 hora atrás
        localStorage.setItem('dashboard-cache-timestamp', new Date(expiredTime).toISOString());
      }
    });
    
    // Recarrega a página
    await page.reload();
    
    // Aguarda o carregamento dos dados
    await waitForDashboardData(page);
    
    // Verifica se o timestamp foi atualizado (cache foi invalidado)
    const newLastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    const secondUpdateTime = new Date(newLastUpdated).getTime();
    expect(secondUpdateTime).toBeGreaterThan(firstUpdateTime);
  });
  
  test('deve manter consistência dos dados em cache', async ({ page, mockMetaApi, mockSupabase }) => {
    // Acessa a página do dashboard
    await page.goto('/dashboard');
    
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Armazena os dados iniciais
    const initialOverviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
    
    // Simula mudança nos dados da API
    mockMetaApi.ads.data[0].status = 'PAUSED';
    mockMetaApi.ads.data[0].effective_status = 'PAUSED';
    
    // Recarrega a página
    await page.reload();
    
    // Aguarda o carregamento dos dados
    await waitForDashboardData(page);
    
    // Verifica se os dados em cache são os mesmos (não foram atualizados automaticamente)
    const cachedOverviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
    expect(cachedOverviewData).toBe(initialOverviewData);
    
    // Força uma atualização manual
    await page.click('[data-testid="refresh-button"]');
    
    // Aguarda a atualização completar
    await waitForDashboardData(page);
    
    // Verifica se os dados foram atualizados após invalidação manual do cache
    const updatedOverviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
    expect(updatedOverviewData).not.toBe(initialOverviewData);
    expect(updatedOverviewData).not.toContain('Anúncio Ativo 1');
  });
}); 