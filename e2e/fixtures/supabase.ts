import { test as base } from '@playwright/test';

export const mockSupabaseData = {
  ads: [
    {
      id: '123456789',
      name: 'Anúncio Ativo 1',
      status: 'ACTIVE',
      campaign_id: '987654321',
      adset_id: '456789123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '234567890',
      name: 'Anúncio Ativo 2',
      status: 'ACTIVE',
      campaign_id: '987654321',
      adset_id: '456789123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  leads: [
    {
      id: 1,
      ad_id: '123456789',
      name: 'Lead 1',
      email: 'lead1@example.com',
      phone: '11999999999',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      ad_id: '123456789',
      name: 'Lead 2',
      email: 'lead2@example.com',
      phone: '11999999998',
      status: 'converted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      ad_id: '234567890',
      name: 'Lead 3',
      email: 'lead3@example.com',
      phone: '11999999997',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  performance_metrics: [
    {
      ad_id: '123456789',
      date: new Date().toISOString().split('T')[0],
      spend: 100.50,
      impressions: 1000,
      clicks: 50,
      leads: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      ad_id: '234567890',
      date: new Date().toISOString().split('T')[0],
      spend: 75.25,
      impressions: 750,
      clicks: 35,
      leads: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

// Definir a interface da fixture
interface SupabaseFixtures {
  mockSupabase: typeof mockSupabaseData;
}

export const test = base.extend<SupabaseFixtures>({
  mockSupabase: async ({ page }, use) => {
    await page.route('**/rest/v1/ads**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSupabaseData.ads),
      });
    });

    await page.route('**/rest/v1/meta_leads**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSupabaseData.leads),
      });
    });

    await page.route('**/rest/v1/performance_metrics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSupabaseData.performance_metrics),
      });
    });

    await use(mockSupabaseData);
  },
}); 