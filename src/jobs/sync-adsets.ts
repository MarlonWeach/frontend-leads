import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetaAdsetsService } from '../services/meta/adsets';
import { logger } from '../utils/logger';
import { SyncOptions, SyncResult, SyncStatus, DEFAULT_SYNC_OPTIONS } from '../types/sync';
import { MetaAdset } from '../types/meta';

// Função para obter o cliente Supabase
function getSupabaseClient(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Função para fazer o upsert dos dados dos adsets no Supabase
export async function upsertAdsets(supabase: SupabaseClient, adsetsData: MetaAdset[]): Promise<{ success: boolean; error?: any }> {
  const recordsToUpsert = adsetsData.map(adset => ({
    id: adset.id,
    name: adset.name,
    status: adset.status,
    effective_status: adset.effective_status,
    campaign_id: adset.campaign_id,
    created_time: adset.created_time,
    start_time: adset.start_time,
    end_time: adset.end_time,
    daily_budget: adset.daily_budget,
    lifetime_budget: adset.lifetime_budget,
    optimization_goal: adset.optimization_goal,
    billing_event: adset.billing_event,
    targeting: adset.targeting,
    spend: adset.insights?.[0]?.spend,
    impressions: adset.insights?.[0]?.impressions,
    clicks: adset.insights?.[0]?.clicks,
    ctr: adset.insights?.[0]?.ctr,
    cpc: adset.insights?.[0]?.cpc,
    cpm: adset.insights?.[0]?.cpm,
    leads: adset.insights?.[0]?.actions?.find((a: any) => a.action_type === 'onsite_conversion.lead_grouped')?.value ?? 0,
    last_synced: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from('adsets')
      .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      logger.error({ error }, 'Erro ao fazer upsert dos adsets no Supabase.');
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Erro inesperado na operação de upsert dos adsets.');
    return { success: false, error };
  }
}

// Função principal de sincronização de adsets
export async function syncAdsets(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = new Date();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const supabase = getSupabaseClient();
  const metaAdsetsService = new MetaAdsetsService(
    process.env.META_ACCESS_TOKEN!,
    process.env.META_ACCOUNT_ID!
  );

  logger.info({ options: opts }, 'Iniciando sincronização de adsets.');

  try {
    // Busca todos os adsets com insights (o service lida com paginação)
    const adsetsWithInsights = await metaAdsetsService.getAdsetsWithInsights();

    if (opts.dryRun) {
      logger.info({ count: adsetsWithInsights.length }, 'Modo dryRun ativado. Adsets que seriam sincronizados.');
      const endTime = new Date();
      return {
        status: {
          success: true,
          timestamp: endTime.toISOString(),
          totalAds: adsetsWithInsights.length,
          activeAds: adsetsWithInsights.filter(a => a.status === 'ACTIVE').length,
          details: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMs: endTime.getTime() - startTime.getTime(),
            message: `Dry run: ${adsetsWithInsights.length} adsets seriam sincronizados.`,
          },
        },
        data: adsetsWithInsights,
      };
    }

    // Faz o upsert dos dados no Supabase
    const upsertResult = await upsertAdsets(supabase, adsetsWithInsights);

    if (!upsertResult.success) {
      throw new Error('Falha no upsert dos adsets para o Supabase.');
    }

    const endTime = new Date();
    const status: SyncStatus = {
      success: true,
      timestamp: endTime.toISOString(),
      totalAds: adsetsWithInsights.length,
      activeAds: adsetsWithInsights.filter(a => a.status === 'ACTIVE').length,
      details: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        message: `Sincronizados ${adsetsWithInsights.length} adsets.`,
      },
    };

    return { status, data: adsetsWithInsights };
  } catch (error: any) {
    logger.error({ error }, 'Erro durante a sincronização de adsets.');
    const endTime = new Date();
    return {
      status: {
        success: false,
        timestamp: endTime.toISOString(),
        totalAds: 0,
        activeAds: 0,
        error: error.message,
        details: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };
  }
} 