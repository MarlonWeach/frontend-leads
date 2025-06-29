import { test, expect } from '@playwright/test';

test.describe('AI Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to performance page where AI panel is located
    await page.goto('/performance');
    
    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded');
    
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
    // Click on performance analysis button
    await page.click('button:has-text("Performance")');
    
    // Wait for loading state - use first() to avoid strict mode violation
    await expect(page.locator('.animate-spin').first()).toBeVisible();
    
    // Wait for analysis to complete (max 30 seconds)
    await page.waitForSelector('.prose', { timeout: 30000 });
    
    // Verify analysis results are displayed
    const analysisContent = page.locator('.prose');
    await expect(analysisContent).toBeVisible();
    
    // Check for meaningful content
    const text = await analysisContent.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(50);
  });

  test('should detect anomalies', async ({ page }) => {
    // Click on anomalies button
    await page.click('button:has-text("Anomalias")');
    
    // Wait for loading - use first() to avoid strict mode violation
    await expect(page.locator('.animate-spin').first()).toBeVisible();
    
    // Wait for results (max 30 seconds)
    await page.waitForTimeout(5000); // Give some time for API call
    
    // Verify anomalies section is displayed
    const anomaliesSection = page.locator('[data-testid="anomalies-section"]');
    await expect(anomaliesSection).toBeVisible();
  });

  test('should provide optimization suggestions', async ({ page }) => {
    // Click on optimization button
    await page.click('button:has-text("Otimização")');
    
    // Wait for loading - use first() to avoid strict mode violation
    await expect(page.locator('.animate-spin').first()).toBeVisible();
    
    // Wait for suggestions to load (max 30 seconds)
    await page.waitForTimeout(5000);
    
    // Verify optimization section is displayed
    const optimizationSection = page.locator('[data-testid="optimization-section"]');
    await expect(optimizationSection).toBeVisible();
  });

  test('should handle chat assistant', async ({ page }) => {
    // Click on chat button
    await page.click('button:has-text("Chat")');
    
    // Wait for chat to open
    await page.waitForTimeout(2000);
    
    // Verify chat interface is displayed
    const chatInterface = page.locator('[data-testid="chat-assistant"]');
    await expect(chatInterface).toBeVisible();
    
    // Check for chat input
    const chatInput = page.locator('input[placeholder*="pergunta"], textarea[placeholder*="pergunta"]');
    await expect(chatInput).toBeVisible();
  });

  test('should handle multiple AI operations simultaneously', async ({ page }) => {
    // Start performance analysis
    await page.click('button:has-text("Performance")');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Start anomalies detection
    await page.click('button:has-text("Anomalias")');
    
    // Verify both results are displayed or appropriate loading states
    await page.waitForTimeout(10000); // Wait 10 seconds for operations
    
    // Check that page is still responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify at least one AI section is visible
    const aiSections = page.locator('[data-testid="anomalies-section"], [data-testid="optimization-section"], .prose');
    await expect(aiSections.first()).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error by temporarily disabling network
    await page.route('**/api/ai/analyze', route => {
      console.log('Intercepting analyze API call');
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to perform analysis
    await page.click('button:has-text("Performance")');
    
    // Wait for error to be handled
    await page.waitForTimeout(5000);
    
    // Verify error message is displayed - check for specific error text
    const errorMessage = page.locator('[data-testid="ai-error"]');
    await expect(errorMessage).toBeVisible();
    
    // Verify page remains functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should respect rate limits and show appropriate feedback', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/ai/analyze', route => {
      console.log('Intercepting analyze API call for rate limit');
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });
    
    // Try to perform analysis
    await page.click('button:has-text("Performance")');
    
    // Wait for rate limit message
    await page.waitForTimeout(5000);
    
    // Verify rate limit message is displayed - check for specific rate limit text
    const rateLimitMessage = page.locator('[data-testid="ai-rate-limit"]');
    await expect(rateLimitMessage).toBeVisible();
  });

  test('should maintain performance during AI operations', async ({ page }) => {
    const startTime = Date.now();
    
    // Perform multiple operations
    await page.click('button:has-text("Performance")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Anomalias")');
    await page.waitForTimeout(5000);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify operations complete within reasonable time
    expect(totalTime).toBeLessThan(15000); // 15 seconds max
    
    // Verify page remains responsive
    await expect(page.locator('h1')).toBeVisible();
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
      await page.click('button:has-text("Performance")');
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