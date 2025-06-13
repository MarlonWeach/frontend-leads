import { createClient, SupabaseClient, PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
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
  const retryCount = opts.retryCount ?? DEFAULT_SYNC_OPTIONS.retryCount ?? 3;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_SYNC_OPTIONS.timeoutMs ?? 30000;
  let currentRetryCount = 0;
  let lastError: SyncError | null = null;
  const supabase = injectedClient || getSupabaseClient();

  logger.info({ options: opts }, 'Iniciando sincronização de status dos anúncios');

  while (currentRetryCount < retryCount) {
    try {
      // Buscar anúncios ativos da Meta API com timeout
      const activeAds = await withTimeout(
        metaAdsService.getActiveAds(),
        timeoutMs
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
      const upsertResult: PostgrestSingleResponse<any> = await withTimeout(
        (async () => await supabase
          .from('ads')
          .upsert(adsToUpdate, {
            onConflict: 'id',
            ignoreDuplicates: false,
          })
          .select()
        )(),
        timeoutMs
      );
      const upsertError = upsertResult.error;

      if (upsertError) {
        throw {
          code: 'DB_ERROR',
          message: 'Database Error',
          retryable: true,
          details: upsertError,
        } as SyncError;
      }

      // Marcar anúncios inativos
      const updateResult: PostgrestSingleResponse<any> = await withTimeout(
        (async () => await supabase
          .from('ads')
          .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
          .not('id', 'in', activeAds.map(ad => ad.id))
          .select()
        )(),
        timeoutMs
      );
      const updateError = updateResult.error;

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
          retryCount: currentRetryCount,
        },
      };

      logger.info(
        { status, retryCount: currentRetryCount },
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

      currentRetryCount++;

      if (!lastError.retryable || currentRetryCount >= retryCount) {
        logger.error(
          { error: lastError, retryCount: currentRetryCount },
          'Erro na sincronização de status dos anúncios'
        );
        break;
      }

      logger.warn(
        { error: lastError, retryCount: currentRetryCount, nextRetryIn: Math.pow(2, currentRetryCount) * 1000 },
        'Tentativa de sincronização falhou, aguardando próxima tentativa'
      );

      await exponentialBackoff(currentRetryCount);
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
      retryCount: currentRetryCount,
    },
  };

  return { status, ads: [] };
} 