import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetaAdsService } from './ads';
import { logger } from '../../utils/logger';
import { MetaAd } from '../../types/meta';

interface SyncLeadsConfig {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

function normalizeAccountId(accountId: string): string {
  if (!accountId) return '';
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

export class MetaLeadsSyncService {
  private supabase: SupabaseClient;
  private metaAdsService: MetaAdsService;
  private retryAttempts: number;
  private retryDelay: number;
  private accessToken: string;
  private accountId: string;

  constructor(config: SyncLeadsConfig) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.metaAdsService = new MetaAdsService({
      ...config,
      accountId: normalizeAccountId(config.accountId)
    });
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.accessToken = config.accessToken;
    this.accountId = normalizeAccountId(config.accountId);
  }

  private async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.pow(2, retryCount) * this.retryDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async fetchLeadsWithRetry(startDate: string, endDate: string, retryCount = 0): Promise<any> {
    try {
      // Primeiro, buscar anúncios ativos
      const activeAds = await this.metaAdsService.getActiveAds();
      const activeAdIds = activeAds.map(ad => ad.id);

      if (activeAdIds.length === 0) {
        logger.warn({ msg: 'Nenhum anúncio ativo encontrado para o período' });
        return [];
      }

      const timeRange = encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }));
      const adIdsFilter = encodeURIComponent(JSON.stringify(activeAdIds));
      const url = `https://graph.facebook.com/v23.0/${this.accountId}/insights?fields=ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,cpc,cpm,ctr,results,actions,action_values&level=ad&time_increment=1&time_range=${timeRange}&ad_ids=${adIdsFilter}&access_token=${this.accessToken}`;
      
      logger.debug({ 
        msg: 'Fazendo requisição para Meta API', 
        url: url.replace(this.accessToken, '[REDACTED]'),
        activeAdCount: activeAdIds.length
      });
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        logger.error({ 
          msg: 'Erro na resposta da Meta API', 
          error: data.error,
          code: data.error.code,
          subcode: data.error.error_subcode,
          type: data.error.type,
          fbtrace_id: data.error.fbtrace_id
        });

        if (data.error.code === 190 && retryCount < this.retryAttempts) {
          logger.warn({ msg: 'Erro de autenticação, tentando novamente', retryCount });
          await this.exponentialBackoff(retryCount);
          return this.fetchLeadsWithRetry(startDate, endDate, retryCount + 1);
        }
        throw new Error(`Meta API Error: ${data.error.message}`);
      }

      return data.data || [];
    } catch (error) {
      if (retryCount < this.retryAttempts) {
        logger.warn({ 
          msg: 'Erro ao buscar leads, tentando novamente', 
          retryCount,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        await this.exponentialBackoff(retryCount);
        return this.fetchLeadsWithRetry(startDate, endDate, retryCount + 1);
      }
      throw error;
    }
  }

  private transformLeadData(ad: any) {
    const leadResult = ad.results?.find((r: any) => r.indicator === 'actions:onsite_conversion.lead_grouped');
    const leadCount = leadResult?.values?.[0]?.value ? parseInt(leadResult.values[0].value) : 0;

    if (leadCount <= 0) return null;

    return {
      created_time: ad.date_start,
      ad_id: ad.ad_id,
      ad_name: ad.ad_name,
      campaign_id: ad.campaign_id,
      adset_id: ad.adset_id,
      campaign_name: ad.campaign_name,
      adset_name: ad.adset_name,
      spend: parseFloat(ad.spend || 0),
      impressions: parseInt(ad.impressions || 0),
      clicks: parseInt(ad.clicks || 0),
      cpc: parseFloat(ad.cpc || 0),
      cpm: parseFloat(ad.cpm || 0),
      ctr: parseFloat(ad.ctr || 0),
      lead_count: leadCount,
      raw_data: ad
    };
  }

  private async upsertLead(leadData: any): Promise<void> {
    try {
      // Por enquanto, usar INSERT simples
      // TODO: Adicionar constraint única e usar upsert
      const { error } = await this.supabase
        .from('meta_leads')
        .insert(leadData);

      if (error) {
        logger.error({ msg: 'Erro ao inserir lead', lead: leadData, error });
        throw error;
      }
    } catch (error) {
      logger.error({ msg: 'Erro ao upsert lead', lead: leadData, error });
      throw error;
    }
  }

  private async verifyToken(): Promise<boolean> {
    try {
      // Tenta fazer uma requisição simples para verificar o token
      const url = `https://graph.facebook.com/v23.0/me/adaccounts?access_token=${this.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        logger.error({
          msg: 'Erro ao verificar token',
          error: data.error,
          code: data.error.code,
          type: data.error.type,
          fbtrace_id: data.error.fbtrace_id
        });
        return false;
      }

      // Verifica se a conta tem acesso aos dados
      const expectedId = normalizeAccountId(this.accountId);
      const hasAccess = data.data.some((account: any) => account.id === expectedId);
      if (!hasAccess) {
        logger.error({
          msg: 'Conta não tem acesso aos dados solicitados',
          accountId: this.accountId,
          expectedId,
          availableAccounts: data.data.map((a: any) => a.id)
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error({
        msg: 'Erro ao verificar token',
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }

  public async syncLeads(startDate: string, endDate: string): Promise<void> {
    try {
      logger.info('Iniciando sincronização de leads', { startDate, endDate });

      // Verifica o token antes de prosseguir
      const isTokenValid = await this.verifyToken();
      if (!isTokenValid) {
        throw new Error('Token inválido ou sem permissões necessárias');
      }

      // Busca leads do Meta
      const ads = await this.fetchLeadsWithRetry(startDate, endDate);
      
      // Processa e salva cada lead
      for (const ad of ads) {
        const lead = this.transformLeadData(ad);
        if (lead) {
          await this.upsertLead(lead);
        }
      }

      // Limpa registros duplicados
      await this.supabase.rpc('clean_duplicate_leads');

      logger.info({ 
        msg: 'Sincronização de leads concluída',
        totalProcessed: ads.length,
        period: { startDate, endDate }
      });
    } catch (error) {
      logger.error({ 
        msg: 'Erro durante sincronização de leads',
        error,
        period: { startDate, endDate }
      });
      throw error;
    }
  }
} 