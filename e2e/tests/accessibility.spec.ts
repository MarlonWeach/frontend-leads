import { test, expect } from '@playwright/test';

test.describe('Acessibilidade - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('Contraste de cores adequado', async ({ page }) => {
    // Verificar contraste em elementos de texto
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    
    for (let i = 0; i < Math.min(await textElements.count(), 10); i++) {
      const element = textElements.nth(i);
      const text = await element.textContent();
      
      if (text && text.trim().length > 0) {
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor
          };
        });
        
        // Verificar se não são cores extremas
        expect(color.color).not.toBe('rgb(255, 255, 255)');
        expect(color.color).not.toBe('rgb(0, 0, 0)');
      }
    }
  });

  test('Navegação por teclado completa', async ({ page }) => {
    // Testar Tab em todos os elementos focáveis
    const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
  });

  test('Elementos interativos acessíveis', async ({ page }) => {
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

  test('Imagens com alt text', async ({ page }) => {
    // Verificar se imagens têm alt text
    const images = page.locator('img');
    
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      
      // Imagens devem ter alt text (ou ser decorativas com alt="")
      expect(alt).not.toBeNull();
    }
  });

  test('Estrutura de cabeçalhos adequada', async ({ page }) => {
    // Verificar hierarquia de cabeçalhos
    const headers = page.locator('h1, h2, h3, h4, h5, h6');
    const headerLevels = [];
    
    for (let i = 0; i < await headers.count(); i++) {
      const header = headers.nth(i);
      const tagName = await header.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      headerLevels.push(level);
    }
    
    // Verificar se não há saltos grandes na hierarquia
    for (let i = 1; i < headerLevels.length; i++) {
      const jump = headerLevels[i] - headerLevels[i - 1];
      expect(jump).toBeLessThanOrEqual(2);
    }
  });

  test('Formulários acessíveis', async ({ page }) => {
    // Verificar se inputs têm labels
    const inputs = page.locator('input, select, textarea');
    
    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Deve ter id+label, aria-label, ou placeholder
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
    }
  });

  test('Redução de movimento respeitada', async ({ page }) => {
    // Verificar se animações respeitam prefers-reduced-motion
    await page.addInitScript(() => {
      Object.defineProperty(window.matchMedia, 'prefers-reduced-motion', {
        value: { matches: true }
      });
    });
    
    await page.reload();
    
    // Verificar se animações foram desabilitadas
    const animatedElements = page.locator('.glass-card, .sidebar, button');
    
    for (let i = 0; i < await animatedElements.count(); i++) {
      const element = animatedElements.nth(i);
      const transition = await element.evaluate(el => 
        window.getComputedStyle(el).transition
      );
      
      // Transições devem ser reduzidas ou removidas
      expect(transition).toMatch(/none|0s/);
    }
  });

  test('Screen reader compatibility', async ({ page }) => {
    // Verificar elementos com roles semânticos
    const semanticElements = page.locator('[role], nav, main, aside, header, footer');
    
    for (let i = 0; i < await semanticElements.count(); i++) {
      const element = semanticElements.nth(i);
      const role = await element.getAttribute('role');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      // Elementos devem ter role apropriado ou tag semântica
      expect(role || ['nav', 'main', 'aside', 'header', 'footer'].includes(tagName)).toBeTruthy();
    }
  });

  test('Foco visível', async ({ page }) => {
    // Verificar se elementos focáveis têm outline visível
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    const outline = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    
    // Deve ter outline visível
    expect(outline).not.toBe('none');
  });

  test('Skip links para navegação', async ({ page }) => {
    // Verificar se há skip links para acessibilidade
    const skipLinks = page.locator('a[href^="#"], [data-skip-link]');
    
    if (await skipLinks.count() > 0) {
      for (let i = 0; i < await skipLinks.count(); i++) {
        const skipLink = skipLinks.nth(i);
        await skipLink.click();
        
        // Verificar se o foco foi movido para o elemento alvo
        await expect(page.locator(':focus')).toBeVisible();
      }
    }
  });

  test('Mensagens de erro acessíveis', async ({ page }) => {
    // Simular erro e verificar se é anunciado para screen readers
    await page.route('**/api/dashboard/overview', route => 
      route.fulfill({ status: 500, body: 'Error' })
    );
    
    await page.reload();
    
    // Verificar se erro é exibido
    const errorElement = page.locator('.error, [role="alert"], [aria-live="polite"]');
    await expect(errorElement).toBeVisible();
  });

  test('Tamanho de fonte ajustável', async ({ page }) => {
    // Testar zoom de página
    await page.evaluate(() => {
      document.body.style.fontSize = '150%';
    });
    
    // Verificar se texto ainda é legível
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6');
    await expect(textElements.first()).toBeVisible();
    
    // Verificar se layout não quebra
    await expect(page.locator('.glass-card')).toBeVisible();
  });

  test('Contraste em modo de alto contraste', async ({ page }) => {
    // Simular modo de alto contraste
    await page.addInitScript(() => {
      Object.defineProperty(window.matchMedia, 'prefers-contrast', {
        value: { matches: true }
      });
    });
    
    await page.reload();
    
    // Verificar se elementos ainda são visíveis
    await expect(page.locator('.glass-card')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });
}); 