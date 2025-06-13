import { createClient, SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js';
import { MetaAdsService } from '@/services/meta/ads';
import { logger } from '@/utils/logger';
import {
  SyncOptions,
  SyncResult,
  SyncStatus,
  SyncError,
  DEFAULT_SYNC_OPTIONS,
} from '@/types/sync';

function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const metaAdsService = new MetaAdsService({
  accessToken: process.env.META_ACCESS_TOKEN!,
  accountId: process.env.META_ACCOUNT_ID!,
});

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.pow(2, retryCount) * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      logger.error({ timeoutMs }, 'Timeout ao executar operação');
      reject(new Error('Timeout'));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

export async function syncAdsStatus(
  options: SyncOptions = {},
  injectedClient?: SupabaseClient
): Promise<SyncResult> {
  const startTime = new Date();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  let retryCount = 0;
  let lastError: SyncError | null = null;
  const supabase = injectedClient || getSupabaseClient();

  logger.info({ options: opts }, 'Iniciando sincronização de status dos anúncios');

  while (retryCount < opts.retryCount!) {
    try {
      // Buscar anúncios ativos da Meta API com timeout
      const activeAds = await withTimeout(
        metaAdsService.getActiveAds(),
        opts.timeoutMs!
      );
      logger.info({ count: activeAds.length }, 'Anúncios ativos obtidos da Meta API');

      // Preparar dados para upsert
      const adsToUpdate = activeAds.map(ad => ({
        id: ad.id,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
        meta_data: ad,
      }));

      // Atualizar status no Supabase
      const { error: upsertError } = await withTimeout<PostgrestSingleResponse<any[]>>(
        Promise.resolve(
          supabase
            .from('ads')
            .upsert(adsToUpdate, { onConflict: 'id', ignoreDuplicates: false })
            .select()
        ),
        opts.timeoutMs!
      );

      if (upsertError) {
        throw {
          code: 'DB_ERROR',
          message: 'Database Error',
          retryable: true,
          details: upsertError,
        } as SyncError;
      }

      // Marcar anúncios inativos
      const inactiveAdIds = activeAds.map(ad => ad.id);
      const { error: updateError } = await withTimeout<PostgrestSingleResponse<any[]>>(
        Promise.resolve(
          supabase
            .from('ads')
            .update({ status: 'INACTIVE' })
            .in('id', inactiveAdIds)
            .select()
        ),
        opts.timeoutMs!
      );

      if (updateError) {
        throw {
          code: 'DB_ERROR',
          message: 'Database Error',
          retryable: true,
          details: updateError,
        } as SyncError;
      }

      const endTime = new Date();
      const status: SyncStatus = {
        success: true,
        timestamp: endTime.toISOString(),
        totalAds: activeAds.length,
        activeAds: activeAds.length,
        details: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          retryCount,
        },
      };

      logger.info(
        { status, retryCount },
        'Sincronização de status dos anúncios concluída com sucesso'
      );

      return { status, ads: activeAds };
    } catch (error) {
      lastError = error as SyncError;
      
      // Se for timeout, não tenta novamente
      if (lastError.message === 'Timeout') {
        logger.error({ error: lastError }, 'Timeout na sincronização');
        break;
      }

      retryCount++;

      if (!lastError.retryable || retryCount >= opts.retryCount!) {
        logger.error(
          { error: lastError, retryCount },
          'Erro na sincronização de status dos anúncios'
        );
        break;
      }

      logger.warn(
        { error: lastError, retryCount, nextRetryIn: Math.pow(2, retryCount) * 1000 },
        'Tentativa de sincronização falhou, aguardando próxima tentativa'
      );

      await exponentialBackoff(retryCount);
    }
  }

  const endTime = new Date();
  const status: SyncStatus = {
    success: false,
    timestamp: endTime.toISOString(),
    totalAds: 0,
    activeAds: 0,
    error: lastError?.message || 'Erro desconhecido na sincronização',
    details: {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
      retryCount,
    },
  };

  return { status, ads: [] };
} 