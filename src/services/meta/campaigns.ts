import { logger } from '../../utils/logger';

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  created_time: string;
  updated_time: string;
  objective: string;
  special_ad_categories: string[];
  spend_cap: number;
  daily_budget: number;
  lifetime_budget: number;
}

export interface MetaCampaignsResponse {
  data: MetaCampaign[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface MetaCampaignsServiceConfig {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

const DEFAULT_BASE_URL = 'https://graph.facebook.com/v18.0';
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 segundo

function normalizeAccountId(accountId: string): string {
  if (!accountId) return '';
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

export class MetaCampaignsService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly accountId: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(config: MetaCampaignsServiceConfig) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.accessToken = config.accessToken;
    this.accountId = normalizeAccountId(config.accountId);
    this.retryAttempts = config.retryAttempts || DEFAULT_RETRY_ATTEMPTS;
    this.retryDelay = config.retryDelay || DEFAULT_RETRY_DELAY;
  }

  private async makeRequest<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          const error = data.error;
          throw new Error(`Meta API Error: ${error.message} (Code: ${error.code})`);
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryAttempts) {
          logger.warn({
            msg: 'Erro temporário na Meta API, tentando novamente',
            attempt,
            error: error instanceof Error ? error.message : error
          });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async getCampaigns(): Promise<MetaCampaign[]> {
    logger.info({
      msg: 'Buscando campanhas',
      accountId: this.accountId
    });

    const allCampaigns: MetaCampaign[] = [];
    let nextUrl: string | undefined = `${this.accountId}/campaigns`;

    while (nextUrl) {
      try {
        // Se nextUrl é uma URL completa (começa com http), extrair apenas o path
        let path: string;
        const params: Record<string, string> = {
          fields: 'id,name,status,effective_status,created_time,updated_time,objective,special_ad_categories,spend_cap,daily_budget,lifetime_budget',
          limit: '100'
        };

        if (nextUrl.startsWith('http')) {
          // É uma URL completa da Meta API, extrair path e parâmetros
          const url = new URL(nextUrl);
          path = url.pathname.replace('/v18.0/', '').replace('/v22.0/', '');
          // Manter os parâmetros existentes da URL
          url.searchParams.forEach((value, key) => {
            params[key] = value;
          });
        } else {
          // É um path relativo
          path = nextUrl;
        }

        const response: MetaCampaignsResponse = await this.makeRequest<MetaCampaignsResponse>(path, params);

        allCampaigns.push(...response.data);
        nextUrl = response.paging.next;

        logger.debug({
          msg: 'Página de campanhas obtida',
          count: response.data.length,
          hasNext: !!nextUrl
        });
      } catch (error) {
        logger.error({
          msg: 'Erro ao buscar campanhas',
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    }

    logger.info({
      msg: 'Busca de campanhas concluída',
      totalCampaigns: allCampaigns.length
    });

    return allCampaigns;
  }

  async getActiveCampaigns(): Promise<MetaCampaign[]> {
    const allCampaigns = await this.getCampaigns();
    return allCampaigns.filter(campaign => 
      campaign.effective_status === 'ACTIVE' || 
      campaign.status === 'ACTIVE'
    );
  }

  async getCampaignInsights(campaignId: string, startDate: string, endDate: string): Promise<any> {
    logger.info({
      msg: 'Buscando insights da campanha',
      campaignId,
      startDate,
      endDate
    });

    // Formatar time_range corretamente para a Meta API
    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    
    try {
      const response = await this.makeRequest<any>(`${campaignId}/insights`, {
        fields: 'spend,impressions,clicks,cpc,cpm,ctr,results,actions',
        time_range: timeRange,
        time_increment: '1'
      });

      return response.data || [];
    } catch (error) {
      logger.error({
        msg: 'Erro ao buscar insights da campanha',
        campaignId,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }
} 