import { test, expect } from '@playwright/test';

test.describe('Acessibilidade - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Página possui estrutura semântica principal', async ({ page }) => {
    const mainLike = page.locator('main, [role="main"]');
    await expect(mainLike.first()).toBeVisible();

    const navLike = page.locator('nav, [role="navigation"]');
    await expect(navLike.first()).toBeVisible();

    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Navegação por teclado mantém foco visível', async ({ page }) => {
    const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 8); i++) {
      await page.keyboard.press('Tab');
      const activeTag = await page.evaluate(() => document.activeElement?.tagName || '');
      expect(activeTag).not.toBe('');
    }
  });

  test('Botões interativos têm nome acessível', async ({ page }) => {
    const buttons = page.locator('button');
    const maxToCheck = Math.min(await buttons.count(), 25);

    for (let i = 0; i < maxToCheck; i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      if (!isVisible) continue;

      const text = (await button.textContent())?.trim();
      const ariaLabel = (await button.getAttribute('aria-label'))?.trim();
      const title = (await button.getAttribute('title'))?.trim();
      expect(Boolean(text || ariaLabel || title)).toBeTruthy();
    }
  });

  test('Imagens com alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('Estrutura de cabeçalhos inicia com h1', async ({ page }) => {
    const headers = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headers.count();
    if (count === 0) {
      test.skip(true, 'Sem cabeçalhos na página para validar hierarquia.');
      return;
    }

    const firstTag = await headers.first().evaluate(el => el.tagName.toLowerCase());
    expect(firstTag).toBe('h1');
  });

  test('Campos de formulário têm associação acessível', async ({ page }) => {
    const inputs = page.locator('input, select, textarea');
    const maxToCheck = Math.min(await inputs.count(), 20);
    for (let i = 0; i < maxToCheck; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = (await input.getAttribute('aria-label'))?.trim();
      const ariaLabelledBy = (await input.getAttribute('aria-labelledby'))?.trim();
      const placeholder = (await input.getAttribute('placeholder'))?.trim();
      const hasLabel = Boolean(id && await page.locator(`label[for="${id}"]`).count() > 0);
      expect(Boolean(hasLabel || ariaLabel || ariaLabelledBy || placeholder)).toBeTruthy();
    }
  });

  test('Elementos principais expõem landmarks semânticos', async ({ page }) => {
    const landmarks = page.locator('header, footer, nav, main, aside, [role="banner"], [role="contentinfo"], [role="navigation"], [role="main"]');
    const count = await landmarks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Há elemento ativo após navegação por teclado', async ({ page }) => {
    await page.keyboard.press('Tab');
    const hasFocus = await page.evaluate(() => document.activeElement !== null && document.activeElement !== document.body);
    expect(hasFocus).toBeTruthy();
  });

  test('Skip links são válidos quando presentes', async ({ page }) => {
    const skipLinks = page.locator('a[href^="#"], [data-skip-link]');
    const count = await skipLinks.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const skipLink = skipLinks.nth(i);
        const href = await skipLink.getAttribute('href');
        if (!href || !href.startsWith('#')) continue;
        const targetSelector = href;
        const targetExists = await page.locator(targetSelector).count();
        expect(targetExists).toBeGreaterThan(0);
      }
    }
  });

  test('Mensagens de erro usam região anunciável quando exibidas', async ({ page }) => {
    await page.route('**/api/dashboard/overview', route => 
      route.fulfill({ status: 500, body: 'Error' })
    );
    await page.reload();
    const errorElement = page.locator('.error, [role="alert"], [aria-live="polite"]');
    const count = await errorElement.count();
    if (count > 0) {
      await expect(errorElement.first()).toBeVisible();
    }
  });

  test('Layout permanece renderizável com fonte ampliada', async ({ page }) => {
    await page.evaluate(() => {
      document.body.style.fontSize = '150%';
    });
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6');
    await expect(textElements.first()).toBeVisible();
    await expect(page.locator('.glass-card')).toBeVisible();
  });
}); 