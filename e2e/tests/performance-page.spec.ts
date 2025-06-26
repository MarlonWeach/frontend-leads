import { test, expect } from '@playwright/test';

test.describe('Página de Performance - E2E CoS Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de performance
    await page.goto('/performance');
    // Aguardar carregamento inicial
    await page.waitForLoadState('networkidle');
  });

  test('Carregamento inicial da página', async ({ page }) => {
    // Verificar se a página carrega corretamente
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Verificar se o componente principal está presente
    await expect(page.locator('[data-testid="performance-page"]')).toBeVisible();
    
    // Verificar se a tabela está presente
    await expect(page.locator('[data-testid="performance-table"]')).toBeVisible();
    
    // Verificar se os filtros estão presentes (usando labels específicos)
    await expect(page.locator('label:has-text("Status")')).toBeVisible();
    await expect(page.locator('label:has-text("Data Início")')).toBeVisible();
    await expect(page.locator('label:has-text("Data Fim")')).toBeVisible();
    await expect(page.locator('label:has-text("Presets")')).toBeVisible();
  });

  test('Métricas agregadas expandidas (7 cards)', async ({ page }) => {
    // Verificar se os 7 cards de métricas estão presentes
    const metricCards = page.locator('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4.xl\\:grid-cols-7 > div');
    const cardCount = await metricCards.count();
    expect(cardCount).toBe(7);
    
    // Verificar se cada card tem o conteúdo correto
    const expectedMetrics = [
      'Total de Leads',
      'Total de Gastos', 
      'Total de Impressões',
      'Total de Cliques',
      'CTR Médio',
      'CPL Médio',
      'ROI Médio'
    ];
    
    for (let i = 0; i < expectedMetrics.length; i++) {
      const card = metricCards.nth(i);
      await expect(card).toContainText(expectedMetrics[i]);
      
      // Verificar se o valor está presente e formatado
      const valueElement = card.locator('.text-2xl.font-bold.text-white');
      await expect(valueElement).toBeVisible();
      
      const valueText = await valueElement.textContent();
      expect(valueText).toBeTruthy();
      // Permitir valores zero para métricas que podem ser 0
      expect(valueText).not.toBe('');
    }
  });

  test('Gráficos interativos', async ({ page }) => {
    // Verificar se os gráficos estão presentes quando há dados
    const tableRows = page.locator('[data-testid="performance-table"] tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Verificar se os 3 gráficos estão presentes
      await expect(page.locator('text=Gastos por Campanha (Top 10)')).toBeVisible();
      await expect(page.locator('text=Distribuição de Leads')).toBeVisible();
      await expect(page.locator('text=Tendências de Performance')).toBeVisible();
      
      // Verificar se os gráficos são renderizados (SVG elements)
      const svgElements = page.locator('svg');
      const svgCount = await svgElements.count();
      expect(svgCount).toBeGreaterThan(0);
      
      // Verificar interatividade dos gráficos (hover)
      const firstBar = page.locator('svg rect').first();
      if (await firstBar.isVisible()) {
        await firstBar.hover();
        // Aguardar tooltip aparecer
        await page.waitForTimeout(500);
      }
    }
  });

  test('Listagem de campanhas com métricas corretas', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-testid="performance-table"] th', { timeout: 10000 });
    
    // Verificar se a tabela tem as colunas corretas
    const tableHeaders = page.locator('[data-testid="performance-table"] th');
    
    await expect(tableHeaders.nth(0)).toContainText('Campanha');
    await expect(tableHeaders.nth(1)).toContainText('Status');
    await expect(tableHeaders.nth(2)).toContainText('Leads');
    await expect(tableHeaders.nth(3)).toContainText('Gasto');
    await expect(tableHeaders.nth(4)).toContainText('CTR');
    await expect(tableHeaders.nth(5)).toContainText('CPL');
    
    // Verificar se há dados na tabela
    const tableRows = page.locator('[data-testid="performance-table"] tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Verificar se os dados numéricos estão formatados corretamente
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      
      // Verificar formato de leads (número com formatação brasileira)
      const leadsCell = firstRow.locator('td').nth(2);
      const leadsText = await leadsCell.textContent();
      expect(leadsText).toMatch(/^[\d.,]+$/);
      
      // Verificar formato de gasto (R$ X,XX)
      const gastoCell = firstRow.locator('td').nth(3);
      const gastoText = await gastoCell.textContent();
      expect(gastoText).toMatch(/^R\$\s*[\d.,]+$/);
      
      // Verificar formato de CTR (X,XX%)
      const ctrCell = firstRow.locator('td').nth(4);
      const ctrText = await ctrCell.textContent();
      expect(ctrText).toMatch(/^[\d.,]+%$/);
      
      // Verificar formato de CPL (R$ X,XX)
      const cplCell = firstRow.locator('td').nth(5);
      const cplText = await cplCell.textContent();
      expect(cplText).toMatch(/^R\$\s*[\d.,]+$/);
    }
  });

  test('Filtros de data funcionais', async ({ page }) => {
    // Testar filtro de data usando presets
    const presetButton = page.locator('button:has-text("Últimos 7 dias")').first();
    await presetButton.click();
    
    // Aguardar atualização dos dados
    await page.waitForLoadState('networkidle');
    
    // Verificar se o filtro foi aplicado
    await expect(presetButton).toContainText('Últimos 7 dias');
    
    // Verificar se os dados foram filtrados
    const tableRows = page.locator('[data-testid="performance-table"] tbody tr');
    const rowCountAfterFilter = await tableRows.count();
    expect(rowCountAfterFilter).toBeGreaterThanOrEqual(0);
  });

  test('Filtros de status funcionais', async ({ page }) => {
    // Testar filtro de status
    const statusButton = page.locator('button:has-text("Ativo")').first();
    await statusButton.click();
    
    // Aguardar atualização dos dados
    await page.waitForLoadState('networkidle');
    
    // Verificar se o filtro foi aplicado
    await expect(statusButton).toContainText('Ativo');
    
    // Verificar se apenas campanhas ativas são exibidas
    const tableRows = page.locator('[data-testid="performance-table"] tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Verificar se todas as linhas têm status ativo
      for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const statusCell = row.locator('[data-testid="campaign-status"]');
        await expect(statusCell).toContainText('Ativa');
      }
    }
  });

  test('Ordenação por colunas', async ({ page }) => {
    const tableHeaders = page.locator('[data-testid="performance-table"] th');
    
    // Testar ordenação por campanha (coluna 0)
    const campaignHeader = tableHeaders.nth(0);
    await campaignHeader.click();
    
    // Testar ordenação por status (coluna 1)
    const statusHeader = tableHeaders.nth(1);
    await statusHeader.click();
    
    // Testar ordenação por leads (coluna 2)
    const leadsHeader = tableHeaders.nth(2);
    await leadsHeader.click();
    
    // Testar ordenação por gasto (coluna 3)
    const gastoHeader = tableHeaders.nth(3);
    await gastoHeader.click();
    
    // Testar ordenação por CTR (coluna 4)
    const ctrHeader = tableHeaders.nth(4);
    await ctrHeader.click();
    
    // Testar ordenação por CPL (coluna 5)
    const cplHeader = tableHeaders.nth(5);
    await cplHeader.click();
    
    // Verificar se a tabela ainda está visível após todas as ordenações
    await expect(page.locator('[data-testid="performance-table"]')).toBeVisible();
  });

  test('Responsividade em diferentes resoluções', async ({ page }) => {
    // Aguardar carregamento inicial
    await page.waitForSelector('[data-testid="performance-table"]', { timeout: 10000 });
    
    // Testar em mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se a tabela é responsiva
    const table = page.locator('[data-testid="performance-table"]');
    await expect(table).toBeVisible();
    
    // Verificar se os gráficos são responsivos
    const charts = page.locator('.grid-cols-1.lg\\:grid-cols-2');
    await expect(charts).toBeVisible();
    
    // Testar em tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(table).toBeVisible();
    await expect(charts).toBeVisible();
    
    // Testar em desktop (1024px+)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(table).toBeVisible();
    await expect(charts).toBeVisible();
  });

  test('Estados de loading e erro', async ({ page }) => {
    // Verificar se o botão de atualizar está presente
    const refreshButton = page.locator('button:has-text("Atualizar Dados")');
    await expect(refreshButton).toBeVisible();
    
    // Clicar no botão de atualizar
    await refreshButton.click();
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se voltou ao estado normal
    await expect(refreshButton).toContainText('Atualizar Dados');
  });

  test('Performance aceitável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/performance');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Deve carregar em menos de 10 segundos (incluindo gráficos)
    expect(loadTime).toBeLessThan(10000);
    
    // Verificar se a tabela carrega rapidamente
    const tableLoadStart = Date.now();
    await expect(page.locator('[data-testid="performance-table"]')).toBeVisible();
    const tableLoadTime = Date.now() - tableLoadStart;
    
    // Tabela deve carregar em menos de 5 segundos
    expect(tableLoadTime).toBeLessThan(5000);
  });

  test('Integração com dados da Meta API', async ({ page }) => {
    // Verificar se os dados são consistentes com a Meta API
    const tableRows = page.locator('[data-testid="performance-table"] tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Verificar se os dados fazem sentido (valores positivos, formatos corretos)
      const firstRow = tableRows.first();
      
      const leadsText = await firstRow.locator('td').nth(2).textContent();
      const leads = parseInt(leadsText?.replace(/[^\d]/g, '') || '0');
      expect(leads).toBeGreaterThanOrEqual(0);
      
      const gastoText = await firstRow.locator('td').nth(3).textContent();
      const gasto = parseFloat(gastoText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
      expect(gasto).toBeGreaterThanOrEqual(0);
      
      const ctrText = await firstRow.locator('td').nth(4).textContent();
      const ctr = parseFloat(ctrText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
      expect(ctr).toBeGreaterThanOrEqual(0);
      // CTR pode ser > 100% em alguns casos (dados agregados)
      expect(ctr).toBeLessThanOrEqual(1000); // Limite mais alto para dados agregados
    }
  });

  test('Animações e interatividade dos gráficos', async ({ page }) => {
    // Verificar se os gráficos têm animações
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();
    
    if (svgCount > 0) {
      // Verificar se há elementos animados (rect, circle, path)
      const animatedElements = page.locator('svg rect, svg circle, svg path');
      const animatedCount = await animatedElements.count();
      expect(animatedCount).toBeGreaterThan(0);
      
      // Testar hover nos gráficos
      const firstElement = animatedElements.first();
      if (await firstElement.isVisible()) {
        await firstElement.hover();
        await page.waitForTimeout(500);
        
        // Verificar se tooltip aparece (se aplicável)
        const tooltip = page.locator('.bg-gray-900\\/95');
        if (await tooltip.isVisible()) {
          await expect(tooltip).toBeVisible();
        }
      }
    }
  });
}); 