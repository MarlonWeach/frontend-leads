import { test, expect } from '@playwright/test';

test.describe('Usabilidade Simplificada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
  });

  test('Elementos básicos estão visíveis', async ({ page }) => {
    // Verificar se a página carrega
    await expect(page.locator('body')).toBeVisible();
    
    // Verificar se há conteúdo na página
    const hasContent = await page.locator('h1, h2, h3, p, div').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('Navegação por teclado básica', async ({ page }) => {
    // Testar Tab
    await page.keyboard.press('Tab');
    
    // Verificar se algum elemento está focado
    const focusedElement = page.locator(':focus');
    const focusCount = await focusedElement.count();
    
    // Pelo menos um elemento deve estar focável
    expect(focusCount).toBeGreaterThan(0);
  });

  test('Contraste de cores melhorado', async ({ page }) => {
    // Verificar se não há texto em branco puro
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    
    for (let i = 0; i < Math.min(await textElements.count(), 5); i++) {
      const element = textElements.nth(i);
      const text = await element.textContent();
      
      if (text && text.trim().length > 0) {
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.color;
        });
        
        // Verificar se não é branco puro
        expect(color).not.toBe('rgb(255, 255, 255)');
        expect(color).not.toBe('rgba(255, 255, 255, 1)');
      }
    }
  });

  test('Elementos interativos respondem', async ({ page }) => {
    // Procurar por botões
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Testar o primeiro botão
      const firstButton = buttons.first();
      await firstButton.click();
      
      // Verificar se não há erros após o clique
      const errorElements = page.locator('.error, [data-testid="error"]');
      await expect(errorElements).not.toBeVisible();
    }
  });

  test('Responsividade básica', async ({ page }) => {
    // Testar diferentes tamanhos de tela
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verificar se a página ainda é visível
      await expect(page.locator('body')).toBeVisible();
      
      // Aguardar um pouco para estabilizar
      await page.waitForTimeout(500);
    }
  });

  test('Estados de loading', async ({ page }) => {
    // Recarregar a página para ver o estado de loading
    await page.reload();
    
    // Aguardar um pouco para ver se há loading
    await page.waitForTimeout(1000);
    
    // Verificar se não há erros de carregamento
    const errorElements = page.locator('.error, [data-testid="error"]');
    await expect(errorElements).not.toBeVisible();
  });

  test('Acessibilidade básica', async ({ page }) => {
    // Verificar se imagens têm alt text
    const images = page.locator('img');
    
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      
      // Alt deve existir (pode ser vazio para imagens decorativas)
      expect(alt).not.toBeNull();
    }
    
    // Verificar se botões têm texto ou aria-label
    const buttons = page.locator('button');
    
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Deve ter texto ou aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
}); 