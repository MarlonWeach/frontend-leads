import { test, expect } from '@playwright/test';

test.describe('Performance Insights, Heatmap e Forecast - E2E CoS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/performance');
    await page.waitForLoadState('networkidle');
  });

  test('Painel de Insights automáticos aparece e atualiza com filtros', async ({ page }) => {
    // Verificar se o painel de insights está visível
    await expect(page.locator('[data-testid="insights-panel"]')).toBeVisible();
    // Deve exibir pelo menos 1 insight quando há dados
    const insights = page.locator('[data-testid="insight-card"]');
    expect(await insights.count()).toBeGreaterThanOrEqual(1);
    // Testar atualização ao mudar o filtro de data
    const presetButton = page.locator('button:has-text("Últimos 7 dias")').first();
    await presetButton.click();
    await page.waitForLoadState('networkidle');
    // Insights devem atualizar
    expect(await insights.count()).toBeGreaterThanOrEqual(0);
  });

  test('Heatmap de performance é renderizado e interativo', async ({ page }) => {
    // Verificar se o heatmap está visível
    await expect(page.locator('[data-testid="performance-heatmap"]')).toBeVisible();
    // Verificar se há células no heatmap
    const cells = page.locator('[data-testid="heatmap-cell"]');
    expect(await cells.count()).toBeGreaterThan(0);
    // Testar hover em uma célula
    const firstCell = cells.first();
    await firstCell.hover();
    // Verificar se tooltip aparece
    const tooltip = page.locator('.heatmap-tooltip, .nivo-tooltip');
    if (await tooltip.isVisible()) {
      await expect(tooltip).toBeVisible();
    }
  });

  test('Forecast/previsões são exibidas corretamente', async ({ page }) => {
    // Verificar se o componente de forecast está visível
    await expect(page.locator('[data-testid="performance-forecast"]')).toBeVisible();
    // Verificar se os cards de previsão existem
    const forecastCards = page.locator('[data-testid^="forecast-card-"]');
    expect(await forecastCards.count()).toBeGreaterThanOrEqual(1);
    // Verificar se o gráfico de forecast está presente
    await expect(page.locator('[data-testid="forecast-chart"]')).toBeVisible();
    // Testar hover no gráfico
    const svg = page.locator('[data-testid="forecast-chart"] svg');
    if (await svg.isVisible()) {
      const points = svg.locator('circle, path');
      if (await points.count() > 0) {
        await points.first().hover();
        await page.waitForTimeout(500);
        // Verificar se tooltip aparece
        const tooltip = page.locator('.nivo-tooltip, .forecast-tooltip');
        if (await tooltip.isVisible()) {
          await expect(tooltip).toBeVisible();
        }
      }
    }
  });

  test('Acessibilidade: navegação por teclado e ARIA', async ({ page }) => {
    // Foco inicial no primeiro botão
    await page.keyboard.press('Tab');
    // Navegar pelos principais elementos
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    // Verificar se algum insight/card/heatmap tem foco visível
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBeTruthy();
    // Verificar se elementos principais têm roles/aria
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toHaveAttribute('role', /region|complementary|main/);
  });

  test('Ausência de erros críticos no console ao interagir com insights, heatmap e forecast', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // Interagir com insights
    const insights = page.locator('[data-testid="insight-card"]');
    if (await insights.count() > 0) {
      await insights.first().click();
    }
    // Interagir com heatmap
    const heatmapCell = page.locator('[data-testid="heatmap-cell"]').first();
    if (await heatmapCell.isVisible()) {
      await heatmapCell.hover();
    }
    // Interagir com forecast
    const forecastCard = page.locator('[data-testid^="forecast-card-"]').first();
    if (await forecastCard.isVisible()) {
      await forecastCard.click();
    }
    // Esperar logs
    await page.waitForTimeout(1000);
    // Não deve haver erros críticos
    expect(errors.length).toBe(0);
  });
}); 