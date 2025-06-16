import { MetaAd, MetaAdsResponse, MetaAPIError, MetaAdsServiceConfig } from '../../types/meta';
import { logger } from '../../utils/logger';
import { SyncError } from '../../types/sync';

const DEFAULT_BASE_URL = 'https://graph.facebook.com/v18.0';
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 segundo

// Constantes para erros do provedor do modelo
const MODEL_PROVIDER_ERROR_CODES = {
  CONNECTION_ERROR: 'MODEL_PROVIDER_CONNECTION_ERROR',
  TEMPORARY_ERROR: 'MODEL_PROVIDER_TEMPORARY_ERROR',
  RATE_LIMIT: 'MODEL_PROVIDER_RATE_LIMIT'
};

export class MetaAdsService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly accountId: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(config: MetaAdsServiceConfig) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.accessToken = config.accessToken;
    this.accountId = config.accountId;
    this.retryAttempts = config.retryAttempts || DEFAULT_RETRY_ATTEMPTS;
    this.retryDelay = config.retryDelay || DEFAULT_RETRY_DELAY;
  }

  private async makeRequest<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    // NÃO adicionar access_token na query string
    // url.searchParams.append('access_token', this.accessToken);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Adicionar header Authorization
        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          // Verifica se é um erro do provedor do modelo
          if (data.error?.message?.includes('trouble connecting to the model provider')) {
            const syncError = new Error('Erro de conexão com o provedor do modelo') as SyncError;
            syncError.code = 'MODEL_PROVIDER_ERROR';
            syncError.retryable = true;
            syncError.providerError = {
              code: MODEL_PROVIDER_ERROR_CODES.CONNECTION_ERROR,
              message: data.error.message,
              retryAfter: 5000 // 5 segundos
            };
            throw syncError;
          }

          const error = data.error as MetaAPIError;
          throw new MetaAPIError(
            error.code,
            error.type,
            error.fbtrace_id,
            error.message
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        // Trata erros específicos do provedor do modelo
        if (error instanceof Error && 'code' in error && (error as SyncError).code === 'MODEL_PROVIDER_ERROR') {
          const syncError = error as SyncError;
          logger.warn({
            msg: 'Erro temporário do provedor do modelo',
            attempt,
            error: syncError.providerError,
            retryAfter: syncError.providerError?.retryAfter
          });

          if (attempt < this.retryAttempts) {
            const retryDelay = syncError.providerError?.retryAfter || this.retryDelay * attempt;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }
        
        // Trata outros erros da Meta API
        if (error instanceof MetaAPIError && error.code >= 500) {
          logger.warn({
            msg: 'Erro temporário na Meta API, tentando novamente',
            attempt,
            error: {
              code: error.code,
              type: error.type,
              message: error.message
            }
          });

          if (attempt < this.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError;
  }

  async getActiveAds(): Promise<MetaAd[]> {
    logger.info({
      msg: 'Buscando anúncios ativos',
      accountId: this.accountId
    });

    const allAds: MetaAd[] = [];
    let nextUrl: string | undefined = `${this.accountId}/ads`;

    while (nextUrl) {
      try {
        const response: MetaAdsResponse = await this.makeRequest<MetaAdsResponse>(nextUrl, {
          fields: 'id,name,status,effective_status,created_time,updated_time',
          effective_status: 'ACTIVE',
          limit: '100'
        });

        allAds.push(...response.data);
        nextUrl = response.paging.next;

        logger.debug({
          msg: 'Página de anúncios obtida',
          count: response.data.length,
          hasNext: !!nextUrl
        });
      } catch (error) {
        logger.error({
          msg: 'Erro ao buscar anúncios ativos',
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            ...(error instanceof MetaAPIError ? {
              code: error.code,
              type: error.type,
              fbtrace_id: error.fbtrace_id
            } : {})
          } : error
        });
        throw error;
      }
    }

    logger.info({
      msg: 'Busca de anúncios ativos concluída',
      totalAds: allAds.length
    });

    return allAds;
  }
} 