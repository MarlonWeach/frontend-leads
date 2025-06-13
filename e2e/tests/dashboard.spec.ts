import { test, expect } from '../fixtures';
import { test as supabaseTest } from '../fixtures/supabase';
import { waitForDashboardData, verifyActiveAdsFilter, verifyCacheBehavior, verifyErrorHandling } from '../utils/test-helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o dashboard antes de cada teste
    await page.goto('/dashboard');
  });

  test('deve exibir métricas de anúncios ativos', async ({ page }) => {
    // Aguardar carregamento dos dados
    await page.waitForResponse(response => response.url().includes('/api/dashboard/activity') && response.status() === 200);

    // Verificar se os cards de métricas estão presentes
    const metricCards = await page.locator('[data-testid="metric-card"]').all();
    expect(metricCards.length).toBeGreaterThan(0);

    // Verificar se os valores das métricas são números válidos
    for (const card of metricCards) {
      const value = await card.locator('[data-testid="metric-value"]').textContent();
      expect(Number(value)).not.toBeNaN();
    }

    // Verificar se o total de leads é maior que zero
    const leadsCard = await page.locator('[data-testid="metric-card"]').filter({ hasText: 'Leads' }).first();
    const leadsValue = await leadsCard.locator('[data-testid="metric-value"]').textContent();
    expect(Number(leadsValue)).toBeGreaterThan(0);
  });

  test('deve atualizar dados ao mudar período', async ({ page }) => {
    // Aguardar carregamento inicial
    await page.waitForResponse(response => response.url().includes('/api/dashboard/activity') && response.status() === 200);

    // Capturar valores iniciais
    const initialLeads = await page.locator('[data-testid="metric-card"]').filter({ hasText: 'Leads' }).first()
      .locator('[data-testid="metric-value"]').textContent();

    // Mudar período para 7 dias
    await page.getByRole('button', { name: '7 dias' }).click();

    // Aguardar atualização dos dados
    await page.waitForResponse(response => response.url().includes('/api/dashboard/activity') && response.status() === 200);

    // Verificar se os valores foram atualizados
    const newLeads = await page.locator('[data-testid="metric-card"]').filter({ hasText: 'Leads' }).first()
      .locator('[data-testid="metric-value"]').textContent();

    expect(newLeads).not.toBe(initialLeads);
  });

  test('deve exibir mensagem de erro quando API falha', async ({ page }) => {
    // Simular falha na API
    await page.route('**/api/dashboard/activity', route => 
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Erro simulado' }) })
    );

    // Recarregar página
    await page.reload();

    // Verificar se mensagem de erro é exibida
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('Erro ao carregar dados');
  });

  test('deve exibir dados corretamente no dashboard', async ({ page, mockMetaApi, mockSupabase }) => {
    // Aguarda o carregamento inicial dos dados
    await waitForDashboardData(page);
    
    // Verifica se apenas anúncios ativos são exibidos
    await verifyActiveAdsFilter(page);
    
    // Verifica se os dados de leads estão corretos
    const activityData = await page.locator('[data-testid="dashboard-activity"]').textContent();
    expect(activityData).toContain('Lead 1');
    expect(activityData).toContain('Lead 2');
    expect(activityData).toContain('Lead 3');
    
    // Verifica se os dados de vendas recentes estão corretos
    const recentSalesData = await page.locator('[data-testid="dashboard-recent-sales"]').textContent();
    expect(recentSalesData).toContain('Anúncio Ativo 1');
    expect(recentSalesData).toContain('Anúncio Ativo 2');
    expect(recentSalesData).toContain('R$ 100,50');
    expect(recentSalesData).toContain('R$ 75,25');
  });
  
  test('deve atualizar dados quando solicitado manualmente', async ({ page, mockMetaApi, mockSupabase }) => {
    // Verifica o comportamento do cache e atualização manual
    await verifyCacheBehavior(page);
  });
  
  test('deve lidar corretamente com erros', async ({ page, mockMetaApi, mockSupabase }) => {
    // Verifica o tratamento de erros
    await verifyErrorHandling(page);
  });
}); 