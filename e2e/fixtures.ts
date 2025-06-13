import { test as base } from '@playwright/test';

// Fixture para mockar a API do Meta
export const mockMetaApi = async ({ page }, use) => {
  await page.route('**/api/meta/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/ads')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: '123',
              name: 'Anúncio Teste 1',
              status: 'ACTIVE',
              campaign_id: 'campaign_1',
              adset_id: 'adset_1'
            },
            {
              id: '456',
              name: 'Anúncio Teste 2',
              status: 'ACTIVE',
              campaign_id: 'campaign_1',
              adset_id: 'adset_1'
            }
          ]
        })
      });
    } else if (url.includes('/insights')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              ad_id: '123',
              spend: 100.50,
              impressions: 1000,
              clicks: 50,
              actions: [
                {
                  action_type: 'onsite_conversion.lead_grouped',
                  value: '5'
                }
              ]
            },
            {
              ad_id: '456',
              spend: 150.75,
              impressions: 1500,
              clicks: 75,
              actions: [
                {
                  action_type: 'onsite_conversion.lead_grouped',
                  value: '8'
                }
              ]
            }
          ]
        })
      });
    }
  });

  await use(page);
};

// Fixture para mockar o Supabase
export const mockSupabase = async ({ page }, use) => {
  await page.route('**/api/dashboard/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/activity')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          metrics: {
            campaigns: {
              total: 2,
              active: 2
            },
            leads: {
              total: 13,
              new: 5,
              converted: 8,
              conversion_rate: 61.5
            },
            advertisers: {
              total: 1,
              active: 1
            },
            performance: {
              spend: 251.25,
              impressions: 2500,
              clicks: 125,
              ctr: 5.0
            }
          },
          recentActivity: [
            {
              id: '123',
              type: 'lead',
              value: 5,
              timestamp: new Date().toISOString(),
              metadata: {
                spend: 100.50,
                impressions: 1000,
                clicks: 50
              }
            }
          ]
        })
      });
    } else if (url.includes('/overview')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          metrics: {
            campaigns: {
              total: 2,
              active: 2
            },
            leads: {
              total: 13,
              new: 5,
              converted: 8,
              conversion_rate: 61.5
            },
            advertisers: {
              total: 1,
              active: 1
            },
            performance: {
              spend: 251.25,
              impressions: 2500,
              clicks: 125,
              ctr: 5.0
            }
          }
        })
      });
    }
  });

  await use(page);
};

// Extender o objeto test com os fixtures
export const test = base.extend({
  mockMetaApi,
  mockSupabase
});

export { expect } from '@playwright/test'; 