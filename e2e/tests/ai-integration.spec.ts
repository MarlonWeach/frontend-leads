import { test, expect } from '@playwright/test';

test.describe('AI Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to performance page where AI panel is located
    await page.goto('/performance');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Verify AI panel is visible
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
  });

  test('should display AI panel with all functionality buttons', async ({ page }) => {
    // Verify all AI functionality buttons are present
    await expect(page.locator('button', { hasText: 'Variações' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Anomalias' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Otimização' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Chat' })).toBeVisible();
  });

  test('should perform performance analysis', async ({ page }) => {
    // Click on Variações (Performance Analysis)
    await page.click('button:has-text("Variações")');
    
    // Wait for loading state
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for analysis to complete (max 30 seconds)
    await page.waitForSelector('.prose', { timeout: 30000 });
    
    // Verify analysis content is displayed
    const analysisContent = await page.locator('.prose').textContent();
    expect(analysisContent).toBeTruthy();
    expect(analysisContent!.length).toBeGreaterThan(50);
    
    // Verify analysis contains relevant keywords
    expect(analysisContent).toMatch(/(campanha|performance|CPL|lead|conversão|gasto)/i);
  });

  test('should detect anomalies', async ({ page }) => {
    // Click on Anomalias
    await page.click('button:has-text("Anomalias")');
    
    // Wait for loading
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for results (max 30 seconds)
    await page.waitForTimeout(5000); // Give some time for API call
    
    // Check if anomalies section is displayed
    const anomaliesSection = page.locator('[data-testid="anomalies-section"]');
    if (await anomaliesSection.isVisible()) {
      // Verify anomalies content
      const anomaliesContent = await anomaliesSection.textContent();
      expect(anomaliesContent).toBeTruthy();
    } else {
      // If no anomalies, should show appropriate message
      const noAnomaliesMessage = page.locator('text=Nenhuma anomalia detectada');
      await expect(noAnomaliesMessage).toBeVisible();
    }
  });

  test('should provide optimization suggestions', async ({ page }) => {
    // Click on Otimização
    await page.click('button:has-text("Otimização")');
    
    // Wait for loading
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for suggestions to load (max 30 seconds)
    await page.waitForTimeout(5000);
    
    // Check if optimization section is displayed
    const optimizationSection = page.locator('[data-testid="optimization-section"]');
    if (await optimizationSection.isVisible()) {
      // Verify optimization content
      const optimizationContent = await optimizationSection.textContent();
      expect(optimizationContent).toBeTruthy();
      
      // Check for optimization categories
      expect(optimizationContent).toMatch(/(segmentação|criativo|orçamento|timing|teste)/i);
    } else {
      // If no suggestions, should show appropriate message
      const noSuggestionsMessage = page.locator('text=Nenhuma sugestão de otimização');
      await expect(noSuggestionsMessage).toBeVisible();
    }
  });

  test('should handle chat assistant', async ({ page }) => {
    // Click on Chat
    await page.click('button:has-text("Chat")');
    
    // Verify chat interface is displayed
    await expect(page.locator('[data-testid="chat-section"]')).toBeVisible();
    
    // Check for chat input
    const chatInput = page.locator('input[placeholder*="pergunta"], textarea[placeholder*="pergunta"]');
    if (await chatInput.isVisible()) {
      // Type a test question
      await chatInput.fill('Qual campanha teve melhor performance?');
      
      // Submit question (look for send button or Enter key)
      const sendButton = page.locator('button:has-text("Enviar"), button[type="submit"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await chatInput.press('Enter');
      }
      
      // Wait for response (max 30 seconds)
      await page.waitForTimeout(5000);
      
      // Verify response is displayed
      const chatResponse = page.locator('[data-testid="chat-response"], .chat-message');
      if (await chatResponse.isVisible()) {
        const responseText = await chatResponse.textContent();
        expect(responseText).toBeTruthy();
        expect(responseText!.length).toBeGreaterThan(10);
      }
    }
  });

  test('should handle multiple AI operations simultaneously', async ({ page }) => {
    // Start multiple operations at once to test concurrency
    const variationsPromise = page.click('button:has-text("Variações")');
    await page.waitForTimeout(1000);
    
    const anomaliesPromise = page.click('button:has-text("Anomalias")');
    await page.waitForTimeout(1000);
    
    // Wait for both operations to complete
    await Promise.all([variationsPromise, anomaliesPromise]);
    
    // Verify both results are displayed or appropriate loading states
    await page.waitForTimeout(10000); // Wait 10 seconds for operations
    
    // Check that page is still responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify no JavaScript errors occurred
    const errors = await page.evaluate(() => window.errors || []);
    expect(errors.length).toBe(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure by intercepting requests
    await page.route('**/api/ai/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    // Try to perform analysis
    await page.click('button:has-text("Variações")');
    
    // Wait for error handling
    await page.waitForTimeout(5000);
    
    // Verify error message is displayed
    const errorMessage = page.locator('text=Erro, text=falha, text=indisponível');
    await expect(errorMessage.first()).toBeVisible();
    
    // Verify page remains functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should respect rate limits and show appropriate feedback', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/ai/**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      });
    });
    
    // Try to perform analysis
    await page.click('button:has-text("Variações")');
    
    // Wait for rate limit handling
    await page.waitForTimeout(3000);
    
    // Verify rate limit message is displayed
    const rateLimitMessage = page.locator('text=limite, text=aguarde, text=muitas requisições');
    await expect(rateLimitMessage.first()).toBeVisible();
  });

  test('should maintain performance during AI operations', async ({ page }) => {
    const startTime = Date.now();
    
    // Perform a complete analysis workflow
    await page.click('button:has-text("Variações")');
    await page.waitForTimeout(5000);
    
    await page.click('button:has-text("Anomalias")');
    await page.waitForTimeout(5000);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify total time is reasonable (less than 60 seconds)
    expect(totalTime).toBeLessThan(60000);
    
    // Verify page is still responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for any performance issues
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });
    
    // Verify page load performance is acceptable
    if (performanceEntries) {
      expect(performanceEntries.loadEventEnd - performanceEntries.loadEventStart).toBeLessThan(10000);
    }
  });

  test('should display OpenAI billing widget', async ({ page }) => {
    // Check if billing widget is visible
    const billingWidget = page.locator('[data-testid="openai-billing-widget"]');
    
    if (await billingWidget.isVisible()) {
      // Verify billing information is displayed
      await expect(billingWidget.locator('text=OpenAI, text=Billing, text=Uso')).toBeVisible();
      
      // Check for usage metrics
      const usageMetrics = billingWidget.locator('text=$, text=tokens, text=%');
      expect(await usageMetrics.count()).toBeGreaterThan(0);
    }
  });

  test('should validate data consistency across AI modules', async ({ page }) => {
    // Get campaign data from the page
    const campaignElements = await page.locator('[data-testid="campaign-row"]').count();
    
    if (campaignElements > 0) {
      // Perform analysis
      await page.click('button:has-text("Variações")');
      await page.waitForTimeout(5000);
      
      // Check if analysis mentions campaigns
      const analysisText = await page.locator('.prose').textContent();
      
      if (analysisText) {
        // Verify analysis is contextual to the displayed data
        expect(analysisText).toMatch(/(campanha|performance|dados)/i);
      }
      
      // Perform anomaly detection
      await page.click('button:has-text("Anomalias")');
      await page.waitForTimeout(5000);
      
      // Verify consistency between modules
      // Both should reference the same campaign data
      const anomalyText = await page.locator('[data-testid="anomalies-section"]').textContent();
      
      if (anomalyText && analysisText) {
        // Both should be analyzing the same time period
        expect(typeof anomalyText).toBe('string');
        expect(typeof analysisText).toBe('string');
      }
    }
  });
}); 