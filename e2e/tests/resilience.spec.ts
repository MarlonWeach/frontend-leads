import { test, expect } from '../fixtures';
import {
  simulateTemporaryError,
  verifyDashboardLoading,
  verifyDataConsistency,
  verifyCacheBehavior
} from '../utils/test-helpers';

test.describe('Resiliência e Recuperação', () => {
  test('deve se recuperar após falha temporária da API da Meta', async ({ page, mockMetaApi }) => {
    // Configura o mock para simular erro temporário
    await simulateTemporaryError(mockMetaApi, 3000);
    
    // Navega para o dashboard
    await page.goto('/dashboard');
    
    // Verifica se a mensagem de erro temporário é exibida
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Erro temporário na API');
    
    // Aguarda a recuperação automática
    await page.waitForTimeout(3500);
    
    // Verifica se o dashboard carrega corretamente após a recuperação
    await verifyDashboardLoading(page);
    
    // Verifica se os dados estão consistentes
    await verifyDataConsistency(page, mockMetaApi.ads.data);
  });

  test('deve lidar corretamente com cenário sem anúncios ativos', async ({ page, mockMetaApi }) => {
    // Remove todos os anúncios ativos
    mockMetaApi.ads.data = [];
    
    // Navega para o dashboard
    await page.goto('/dashboard');
    
    // Verifica se a mensagem apropriada é exibida
    await expect(page.locator('[data-testid="empty-state"]'))
      .toContainText('Nenhum anúncio ativo encontrado');
    
    // Verifica se o botão de atualização está visível
    await expect(page.locator('[data-testid="refresh-button"]'))
      .toBeVisible();
  });

  test('deve lidar corretamente com timeout da API da Meta', async ({ page, mockMetaApi }) => {
    // Configura o mock para simular timeout
    mockMetaApi.simulateError = true;
    mockMetaApi.errorType = 'TIMEOUT';
    
    // Navega para o dashboard
    await page.goto('/dashboard');
    
    // Verifica se a mensagem de timeout é exibida
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Timeout na requisição');
    
    // Verifica se o botão de retry está visível
    await expect(page.locator('[data-testid="retry-button"]'))
      .toBeVisible();
    
    // Clica no botão de retry
    await page.click('[data-testid="retry-button"]');
    
    // Restaura o mock para funcionar normalmente
    mockMetaApi.simulateError = false;
    mockMetaApi.errorType = null;
    
    // Verifica se o dashboard carrega corretamente após o retry
    await verifyDashboardLoading(page);
  });

  test('deve manter dados em cache durante falha da API', async ({ page, mockMetaApi }) => {
    // Primeiro carregamento para popular o cache
    await page.goto('/dashboard');
    await verifyDashboardLoading(page);
    
    // Simula falha da API
    mockMetaApi.simulateError = true;
    mockMetaApi.errorType = 'PERMANENT';
    
    // Recarrega a página
    await page.reload();
    
    // Verifica se os dados em cache ainda são exibidos
    await verifyDataConsistency(page, mockMetaApi.ads.data);
    
    // Verifica se a mensagem de erro é exibida
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Erro interno na API');
    
    // Verifica se o cache está sendo usado
    const isUsingCache = await verifyCacheBehavior(
      page,
      mockMetaApi,
      async () => {
        await page.click('[data-testid="refresh-button"]');
        await page.waitForTimeout(1000);
      }
    );
    
    expect(isUsingCache).toBe(true);
  });

  test('deve lidar corretamente com falhas do Supabase', async ({ page, mockMetaApi }) => {
    // Intercepta chamadas ao Supabase para simular erro
    await page.route('**/supabase.co/rest/v1/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: 'Erro interno no banco de dados',
          code: 'PGRST500'
        })
      });
    });
    
    // Navega para o dashboard
    await page.goto('/dashboard');
    
    // Verifica se a mensagem de erro do Supabase é exibida
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Erro ao carregar dados do banco');
    
    // Verifica se o botão de retry está visível
    await expect(page.locator('[data-testid="retry-button"]'))
      .toBeVisible();
    
    // Remove a interceptação para permitir chamadas normais
    await page.unroute('**/supabase.co/rest/v1/**');
    
    // Clica no botão de retry
    await page.click('[data-testid="retry-button"]');
    
    // Verifica se o dashboard carrega corretamente após o retry
    await verifyDashboardLoading(page);
  });
}); 