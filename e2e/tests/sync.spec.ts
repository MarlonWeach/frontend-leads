import { test, expect } from '../fixtures';
import { waitForDashboardData, verifyActiveAdsFilter } from '../utils/test-helpers';

test.describe('Sincronização de Anúncios', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de configurações antes de cada teste
    await page.goto('/settings');
  });

  test('deve sincronizar anúncios ativos e atualizar métricas', async ({ page, mockMetaApi, mockSupabase }) => {
    // Aguardar carregamento inicial
    await page.waitForSelector('[data-testid="sync-status"]');
    
    // Capturar timestamp da última sincronização
    const lastSyncBefore = await page.textContent('[data-testid="last-sync-time"]');
    
    // Iniciar sincronização manual
    await page.click('[data-testid="sync-button"]');
    
    // Aguardar conclusão da sincronização
    await page.waitForSelector('[data-testid="sync-status"]:has-text("Concluído")');
    
    // Verificar se o timestamp foi atualizado
    const lastSyncAfter = await page.textContent('[data-testid="last-sync-time"]');
    expect(lastSyncAfter).not.toBe(lastSyncBefore);
    
    // Navegar para o dashboard
    await page.goto('/dashboard');
    
    // Verificar se as métricas estão sendo exibidas
    await page.waitForSelector('[data-testid="metric-card-leads"]');
    await page.waitForSelector('[data-testid="metric-card-campaigns"]');
    
    // Validar métricas de anúncios ativos
    const activeCampaigns = await page.textContent('[data-testid="metric-campaigns-active"]');
    expect(Number(activeCampaigns)).toBeGreaterThan(0);
    
    // Validar métricas de leads
    const totalLeads = await page.textContent('[data-testid="metric-leads-total"]');
    expect(Number(totalLeads.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);
    
    // Validar métricas de performance
    const spend = await page.textContent('[data-testid="metric-performance-spend"]');
    expect(spend).toMatch(/R\$\s*\d+[.,]\d{2}/);
  });

  test('deve lidar com erros durante a sincronização', async ({ page }) => {
    // Simular erro na API
    await page.route('/api/sync', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Erro ao sincronizar anúncios' })
      });
    });
    
    // Iniciar sincronização
    await page.click('[data-testid="sync-button"]');
    
    // Verificar mensagem de erro
    await page.waitForSelector('[data-testid="sync-error"]');
    const errorMessage = await page.textContent('[data-testid="sync-error"]');
    expect(errorMessage).toContain('Erro ao sincronizar anúncios');
    
    // Verificar botão de retry
    const retryButton = await page.waitForSelector('[data-testid="sync-retry-button"]');
    expect(await retryButton.isVisible()).toBeTruthy();
  });

  test('deve atualizar métricas ao mudar período', async ({ page, mockMetaApi, mockSupabase }) => {
    // Navegar para o dashboard
    await page.goto('/dashboard');
    
    // Aguardar carregamento inicial
    await page.waitForSelector('[data-testid="metric-card-leads"]');
    
    // Capturar métricas iniciais
    const initialLeads = await page.textContent('[data-testid="metric-leads-total"]');
    
    // Mudar período para 7 dias
    await page.click('[data-testid="filter-7d"]');
    
    // Aguardar atualização das métricas
    await page.waitForTimeout(1000); // Aguardar requisição
    
    // Verificar se as métricas foram atualizadas
    const updatedLeads = await page.textContent('[data-testid="metric-leads-total"]');
    expect(updatedLeads).not.toBe(initialLeads);
    
    // Verificar se o filtro está ativo
    const activeFilter = await page.getAttribute('[data-testid="filter-7d"]', 'class');
    expect(activeFilter).toContain('bg-blue-500');
  });
});

test.describe('Sincronização de Anúncios Ativos', () => {
  test('deve sincronizar anúncios ativos corretamente', async ({ page, mockMetaApi }) => {
    // Acessa a página do dashboard
    await page.goto('/dashboard');
    
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Verifica se apenas anúncios ativos são exibidos
    await verifyActiveAdsFilter(page);
    
    // Verifica se os dados de performance estão corretos
    const overviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
    expect(overviewData).toContain('R$ 175,75'); // Soma dos spends (100.50 + 75.25)
    expect(overviewData).toContain('1.750'); // Soma das impressões (1000 + 750)
    expect(overviewData).toContain('85'); // Soma dos clicks (50 + 35)
    expect(overviewData).toContain('8'); // Soma dos leads (5 + 3)
  });
  
  test('deve atualizar dados quando um anúncio muda de status', async ({ page, mockMetaApi }) => {
    // Acessa a página do dashboard
    await page.goto('/dashboard');
    
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Simula mudança de status de um anúncio
    mockMetaApi.ads.data[0].status = 'PAUSED';
    mockMetaApi.ads.data[0].effective_status = 'PAUSED';
    
    // Força uma atualização manual
    await page.click('[data-testid="refresh-button"]');
    
    // Aguarda a atualização completar
    await waitForDashboardData(page);
    
    // Verifica se o anúncio pausado não é mais exibido
    const overviewData = await page.locator('[data-testid="dashboard-overview"]').textContent();
    expect(overviewData).not.toContain('Anúncio Ativo 1');
    expect(overviewData).toContain('Anúncio Ativo 2');
    
    // Verifica se as métricas foram atualizadas
    expect(overviewData).toContain('R$ 75,25'); // Apenas o spend do anúncio ainda ativo
    expect(overviewData).toContain('750'); // Apenas as impressões do anúncio ainda ativo
    expect(overviewData).toContain('35'); // Apenas os clicks do anúncio ainda ativo
    expect(overviewData).toContain('3'); // Apenas os leads do anúncio ainda ativo
  });
}); 