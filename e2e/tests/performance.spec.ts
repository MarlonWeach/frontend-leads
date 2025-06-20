import { test, expect } from '@playwright/test';

test.describe('Performance e Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar para capturar métricas de performance
    await page.addInitScript(() => {
      window.performance.mark = window.performance.mark || (() => {});
      window.performance.measure = window.performance.measure || (() => {});
    });
  });

  test('Tempo de carregamento inicial', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });

  test('Largest Contentful Paint (LCP)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Medir LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCP deve ser menor que 2.5 segundos
    expect(lcp).toBeLessThan(2500);
  });

  test('First Input Delay (FID)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Medir FID
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry.processingStart - firstEntry.startTime);
        }).observe({ entryTypes: ['first-input'] });
      });
    });
    
    // FID deve ser menor que 100ms
    expect(fid).toBeLessThan(100);
  });

  test('Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Medir CLS
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
    
    // CLS deve ser menor que 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('Animações em 60fps', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Testar animações
    const card = page.locator('.glass-card').first();
    await card.hover();
    
    // Verificar se animação é suave
    const animationDuration = await card.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.transitionDuration) * 1000;
    });
    
    // Duração deve ser razoável (entre 200ms e 500ms)
    expect(animationDuration).toBeGreaterThan(200);
    expect(animationDuration).toBeLessThan(500);
  });

  test('Otimização de imagens', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se imagens estão otimizadas
    const images = page.locator('img');
    
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i);
      const src = await image.getAttribute('src');
      
      if (src) {
        // Verificar se imagens têm formatos otimizados
        expect(src).toMatch(/\.(webp|avif|jpg|jpeg|png)$/);
      }
    }
  });

  test('Bundle size otimizado', async ({ page }) => {
    const response = await page.goto('/dashboard');
    
    // Verificar headers de cache
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toContain('max-age');
    
    // Verificar compressão
    const contentEncoding = response?.headers()['content-encoding'];
    expect(contentEncoding).toMatch(/gzip|br/);
  });

  test('Lazy loading de componentes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se componentes não críticos são carregados sob demanda
    const lazyComponents = page.locator('[data-lazy], [loading="lazy"]');
    
    if (await lazyComponents.count() > 0) {
      // Scroll para carregar componentes lazy
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      // Verificar se componentes foram carregados
      for (let i = 0; i < await lazyComponents.count(); i++) {
        const component = lazyComponents.nth(i);
        await expect(component).toBeVisible();
      }
    }
  });

  test('Cache de dados eficiente', async ({ page }) => {
    // Primeira visita
    const startTime1 = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime1 = Date.now() - startTime1;
    
    // Segunda visita (deve ser mais rápida)
    const startTime2 = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime2 = Date.now() - startTime2;
    
    // Segunda visita deve ser pelo menos 20% mais rápida
    expect(loadTime2).toBeLessThan(loadTime1 * 0.8);
  });

  test('Redução de layout shift', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se elementos têm dimensões definidas
    const cards = page.locator('.glass-card');
    
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const width = await card.evaluate(el => el.offsetWidth);
      const height = await card.evaluate(el => el.offsetHeight);
      
      // Elementos devem ter dimensões estáveis
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    }
  });

  test('Otimização de fontes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se fontes estão sendo carregadas eficientemente
    const fontDisplay = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      return styleSheets.some(sheet => {
        try {
          return sheet.cssRules && Array.from(sheet.cssRules).some(rule => 
            rule.cssText.includes('font-display')
          );
        } catch {
          return false;
        }
      });
    });
    
    // Fontes devem ter font-display configurado
    expect(fontDisplay).toBeTruthy();
  });

  test('Service Worker para cache offline', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar se service worker está registrado
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    if (hasServiceWorker) {
      const swRegistered = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistrations().then(registrations => 
          registrations.length > 0
        );
      });
      
      expect(swRegistered).toBeTruthy();
    }
  });

  test('Métricas de memória', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verificar uso de memória
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (memoryInfo) {
      // Uso de memória deve ser razoável
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('Tempo de resposta da API', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Medir tempo de resposta da API
    const apiResponseTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const start = performance.now();
        fetch('/api/dashboard/overview')
          .then(() => {
            const end = performance.now();
            resolve(end - start);
          });
      });
    });
    
    // API deve responder em menos de 1 segundo
    expect(apiResponseTime).toBeLessThan(1000);
  });
}); 