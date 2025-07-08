import { 
  MetaAdset, 
  MetaAdsetInsights, 
  MetaAdsetsResponse, 
  MetaAdsetInsightsResponse,
  MetaAPIError,
  MetaError 
} from '../../types/meta';
import { logger } from '../../utils/logger';

export class MetaAdsetsService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly accountId: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(
    accessToken: string,
    accountId: string,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ) {
    this.accessToken = accessToken;
    this.accountId = accountId;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  private async makeRequest<T>(
    path: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    
    // Parâmetros padrão
    const defaultParams = {
      access_token: this.accessToken,
      pretty: '1'
    };

    // Mesclar parâmetros
    const allParams = { ...defaultParams, ...params };
    
    // Adicionar parâmetros à URL
    Object.entries(allParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.info({
          msg: 'Fazendo requisição para Meta API',
          path,
          attempt,
          url: url.toString(),
          baseUrl: this.baseUrl,
          accountId: this.accountId
        });

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData: MetaError = await response.json();
          throw new MetaAPIError(
            errorData.code,
            errorData.type,
            errorData.fbtrace_id,
            errorData.message
          );
        }

        const data: T = await response.json();
        
        logger.info({
          msg: 'Requisição para Meta API bem-sucedida',
          path,
          attempt
        });

        return data;

      } catch (error) {
        lastError = error as Error;
        
        logger.error({
          msg: 'Erro temporário na Meta API, tentando novamente',
          path,
          attempt,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('Erro desconhecido na Meta API');
  }

  async getAdsets(campaignId?: string): Promise<MetaAdset[]> {
    logger.info({
      msg: 'Buscando adsets',
      accountId: this.accountId,
      campaignId
    });

    const allAdsets: MetaAdset[] = [];
    let nextUrl: string | undefined = `${this.accountId}/adsets`;

    while (nextUrl) {
      try {
        // Se nextUrl é uma URL completa (começa com http), extrair apenas o path
        let path: string;
        const params: Record<string, string> = {
          fields: 'id,name,status,effective_status,created_time,updated_time,campaign_id,daily_budget,lifetime_budget,start_time,end_time,targeting,optimization_goal,billing_event',
          limit: '100'
        };

        if (nextUrl.startsWith('http')) {
          // É uma URL completa da Meta API, extrair path e parâmetros
          const url = new URL(nextUrl);
          // Remover qualquer prefixo de versão da API do path
          path = url.pathname.replace(/^\/v\d+\.\d+\//, '');
          
          // Manter parâmetros existentes da URL
          url.searchParams.forEach((value, key) => {
            if (key !== 'access_token' && key !== 'pretty') {
              params[key] = value;
            }
          });
        } else {
          // É apenas o path, usar normalmente
          path = nextUrl;
        }

        // Adicionar filtro de campanha se especificado
        if (campaignId) {
          params.filtering = JSON.stringify([{ field: 'campaign.id', operator: 'EQUAL', value: campaignId }]);
        }

        const response = await this.makeRequest<MetaAdsetsResponse>(path, params);
        
        if (response.data) {
          allAdsets.push(...response.data);
        }

        // Verificar se há próxima página
        nextUrl = response.paging?.next || undefined;

      } catch (error) {
        logger.error({
          msg: 'Erro ao buscar adsets',
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }

    logger.info({
      msg: 'Adsets recuperados com sucesso',
      count: allAdsets.length
    });

    return allAdsets;
  }

  async getAdsetInsights(adsetId: string, startDate: string, endDate: string): Promise<MetaAdsetInsights[]> {
    logger.info({
      msg: 'Buscando insights do adset',
      adsetId,
      startDate,
      endDate
    });

    // Formatar time_range corretamente para a Meta API
    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    
    try {
      const response = await this.makeRequest<MetaAdsetInsightsResponse>(`${adsetId}/insights`, {
        fields: 'adset_id,adset_name,campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,results,actions',
        time_range: timeRange,
        time_increment: '1'
      });

      return response.data || [];
    } catch (error) {
      logger.error({
        msg: 'Erro ao buscar insights do adset',
        adsetId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getAdsetsWithInsights(campaignId?: string, startDate?: string, endDate?: string): Promise<(MetaAdset & { insights?: MetaAdsetInsights[] })[]> {
    logger.info({
      msg: 'Buscando adsets com insights',
      accountId: this.accountId,
      campaignId,
      startDate,
      endDate
    });

    try {
      const adsets = await this.getAdsets(campaignId);
      
      // Se não há datas especificadas, usar últimos 30 dias
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

      const adsetsWithInsights = await Promise.all(
        adsets.map(async (adset) => {
          try {
            const insights = await this.getAdsetInsights(adset.id, defaultStartDate, defaultEndDate);
            return {
              ...adset,
              insights
            };
          } catch (error) {
            logger.warn({
              msg: 'Erro ao buscar insights do adset, retornando sem insights',
              adsetId: adset.id,
              error: error instanceof Error ? error.message : String(error)
            });
            return {
              ...adset,
              insights: []
            };
          }
        })
      );

      logger.info({
        msg: 'Adsets com insights recuperados com sucesso',
        count: adsetsWithInsights.length
      });

      return adsetsWithInsights;

    } catch (error) {
      logger.error({
        msg: 'Erro ao buscar adsets com insights',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
} 