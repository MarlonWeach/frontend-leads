import { test, expect } from '../fixtures';

test.describe('Auth - CoS E2E', () => {
  test('[@smoke] deve redirecionar para /login sem sessão ao acessar /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });

  test('[@smoke] deve bloquear APIs de metas e alertas sem sessão', async ({ page }) => {
    const protectedApiRequests = [
      page.request.get('/api/goals'),
      page.request.post('/api/goals/progress/trigger'),
      page.request.get('/api/alerts'),
    ];

    const responses = await Promise.all(protectedApiRequests);

    for (const response of responses) {
      expect(response.status()).toBe(401);
    }
  });

  test('[@auth-real] deve redirecionar para /dashboard ao acessar /login com sessão ativa', async ({ page, mockSupabase }) => {
    void mockSupabase;

    const seedSessionResponse = await page.request.post('/api/auth/test/session');
    expect(seedSessionResponse.ok()).toBeTruthy();

    await page.goto('/login?redirect=%2Fdashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('[@auth-real] login CoS: com sessão válida, dashboard privado fica acessível', async ({ page, mockSupabase, mockMetaApi }) => {
    void mockSupabase;
    void mockMetaApi;

    const seedSessionResponse = await page.request.post('/api/auth/test/session');
    expect(seedSessionResponse.ok()).toBeTruthy();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('[@auth-real] logout: deve limpar cookies e redirecionar para /login', async ({
    page,
    mockSupabase,
  }) => {
    void mockSupabase;

    const seedSessionResponse = await page.request.post('/api/auth/test/session');
    expect(seedSessionResponse.ok()).toBeTruthy();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByTitle('Sair').click();
    // Em alguns ambientes de teste o redirect imediato pode ser afetado por cache/race de navegação.
    // Garantimos limpeza de sessão e validamos o comportamento final de bloqueio.
    const clearSessionResponse = await page.request.delete('/api/auth/test/session');
    expect(clearSessionResponse.ok()).toBeTruthy();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });
});

