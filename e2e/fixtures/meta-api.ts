import { test as base } from '@playwright/test';

// Tipos para os dados mockados
interface MockAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface MockMetaApi {
  ads: {
    data: MockAd[];
    requestCount: number;
  };
  simulateError: boolean;
  errorType: 'TEMPORARY' | 'PERMANENT' | 'TIMEOUT' | null;
}

// Dados mockados iniciais
const initialAdsData: MockAd[] = [
  {
    id: 'ad_1',
    name: 'Anúncio Ativo 1',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    spend: 100.50,
    impressions: 1000,
    clicks: 50,
    leads: 5
  },
  {
    id: 'ad_2',
    name: 'Anúncio Ativo 2',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    spend: 75.25,
    impressions: 750,
    clicks: 35,
    leads: 3
  }
];

// Extensão do tipo base do Playwright
type MetaApiFixtures = {
  mockMetaApi: MockMetaApi;
};

// Fixture personalizada
export const test = base.extend<MetaApiFixtures>({
  mockMetaApi: async ({ page }, use) => {
    // Inicializa o mock da API
    const mockApi: MockMetaApi = {
      ads: {
        data: [...initialAdsData],
        requestCount: 0
      },
      simulateError: false,
      errorType: null
    };

    // Intercepta chamadas à Meta API
    await page.route('**/graph.facebook.com/v18.0/**', async (route) => {
      mockApi.ads.requestCount++;

      // Simula diferentes tipos de erro
      if (mockApi.simulateError) {
        switch (mockApi.errorType) {
          case 'TEMPORARY':
            await route.fulfill({
              status: 503,
              body: JSON.stringify({
                error: {
                  message: 'Erro temporário na API',
                  code: 503
                }
              })
            });
            return;
          case 'PERMANENT':
            await route.fulfill({
              status: 500,
              body: JSON.stringify({
                error: {
                  message: 'Erro interno na API',
                  code: 500
                }
              })
            });
            return;
          case 'TIMEOUT':
            await route.fulfill({
              status: 408,
              body: JSON.stringify({
                error: {
                  message: 'Timeout na requisição',
                  code: 408
                }
              })
            });
            return;
        }
      }

      // Simula resposta bem-sucedida
      const url = route.request().url();
      if (url.includes('/ads')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: mockApi.ads.data,
            paging: {
              cursors: {
                before: 'MAZDZD',
                after: 'MjQZD'
              },
              next: 'https://graph.facebook.com/v18.0/act_123/ads?access_token=...&after=MjQZD'
            }
          })
        });
      } else if (url.includes('/insights')) {
        // Simula resposta de insights
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: mockApi.ads.data.map(ad => ({
              ad_id: ad.id,
              spend: ad.spend,
              impressions: ad.impressions,
              clicks: ad.clicks,
              leads: ad.leads
            }))
          })
        });
      } else {
        // Para outras rotas, retorna erro 404
        await route.fulfill({
          status: 404,
          body: JSON.stringify({
            error: {
              message: 'Endpoint não encontrado',
              code: 404
            }
          })
        });
      }
    });

    // Disponibiliza o mock para os testes
    await use(mockApi);
  }
});

export { expect } from '@playwright/test'; 