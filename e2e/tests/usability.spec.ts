import { test, expect } from '@playwright/test';

test.describe('Usabilidade e Experiência do Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('Navegação por teclado funciona corretamente', async ({ page }) => {
    // Testar navegação por Tab
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Navegar pelos elementos principais
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar se o foco está visível
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('Responsividade em diferentes resoluções', async ({ page }) => {
    // Testar desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.glass-card')).toBeVisible();
    
    // Testar tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.glass-card')).toBeVisible();
    
    // Testar mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.glass-card')).toBeVisible();
  });

  test('Microinterações e feedback visual', async ({ page }) => {
    // Testar hover em cards
    const card = page.locator('.glass-card').first();
    await card.hover();
    
    // Verificar se há feedback visual (transição, sombra, etc.)
    await expect(card).toHaveCSS('transform', /scale/);
    
    // Testar clique em botões
    const button = page.locator('button').first();
    await button.click();
    
    // Verificar se não há erros
    await expect(page.locator('.error')).not.toBeVisible();
  });

  test('Estados de loading e erro', async ({ page }) => {
    // Simular estado de loading
    await page.route('**/api/dashboard/overview', route => 
      route.fulfill({ status: 200, body: JSON.stringify({ loading: true }) })
    );
    
    await page.reload();
    
    // Verificar se loading é exibido
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('Acessibilidade - contraste e legibilidade', async ({ page }) => {
    // Verificar se textos têm contraste adequado
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span');
    
    for (let i = 0; i < await textElements.count(); i++) {
      const element = textElements.nth(i);
      const color = await element.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Verificar se não é branco puro ou preto puro
      expect(color).not.toBe('rgb(255, 255, 255)');
      expect(color).not.toBe('rgb(0, 0, 0)');
    }
  });

  test('Performance - animações suaves', async ({ page }) => {
    // Verificar se animações estão configuradas
    const animatedElements = page.locator('.glass-card, .sidebar, button');
    
    for (let i = 0; i < await animatedElements.count(); i++) {
      const element = animatedElements.nth(i);
      const transition = await element.evaluate(el => 
        window.getComputedStyle(el).transition
      );
      
      // Verificar se há transições configuradas
      expect(transition).not.toBe('all 0s ease 0s');
    }
  });

  test('Navegação entre páginas', async ({ page }) => {
    // Testar navegação para diferentes páginas
    const navLinks = ['/performance', '/leads', '/campaigns'];
    
    for (const link of navLinks) {
      await page.goto(link);
      await expect(page).toHaveURL(link);
      
      // Verificar se a página carrega sem erros
      await expect(page.locator('body')).not.toContainText('Error');
    }
  });

  test('Interações touch em dispositivos móveis', async ({ page }) => {
    // Simular dispositivo móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Testar toque em elementos interativos
    const interactiveElements = page.locator('button, .glass-card, a');
    
    for (let i = 0; i < Math.min(await interactiveElements.count(), 5); i++) {
      const element = interactiveElements.nth(i);
      await element.tap();
      
      // Verificar se não há erros após o toque
      await expect(page.locator('.error')).not.toBeVisible();
    }
  });

  test('Zoom e redimensionamento', async ({ page }) => {
    // Testar zoom in
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    
    await expect(page.locator('.glass-card')).toBeVisible();
    
    // Testar zoom out
    await page.evaluate(() => {
      document.body.style.zoom = '0.8';
    });
    
    await expect(page.locator('.glass-card')).toBeVisible();
  });

  test('Gestos e interações avançadas', async ({ page }) => {
    // Testar scroll suave
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(1000);
    
    // Verificar se o scroll funcionou
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('Feedback visual em formulários', async ({ page }) => {
    // Testar interação com filtros
    const filterButton = page.locator('[data-testid="filter-button"]').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Verificar se modal de filtros aparece
      await expect(page.locator('.filter-modal')).toBeVisible();
      
      // Fechar modal
      await page.keyboard.press('Escape');
      await expect(page.locator('.filter-modal')).not.toBeVisible();
    }
  });
}); 