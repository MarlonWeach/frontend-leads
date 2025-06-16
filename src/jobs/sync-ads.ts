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

// Função separada para operações do Supabase - mais fácil de testar
export async function upsertActiveAds(
  supabase: SupabaseClient,
  adsData: Array<{ id: string; status: string; updated_at: string; meta_data: any }>
): Promise<{ success: boolean; error?: any }> {
  try {
    const result = await supabase
      .from('ads')
      .upsert(adsData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select();

    if (result.error) {
      return { success: false, error: result.error };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Função separada para marcar anúncios inativos - mais fácil de testar
export async function markInactiveAds(
  supabase: SupabaseClient,
  activeAdIds: string[]
): Promise<{ success: boolean; error?: any }> {
  try {
    const result = await supabase
      .from('ads')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .not('id', 'in', activeAdIds)
      .select();

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Interface para dependências injetáveis
export interface SyncDependencies {
  metaAdsService?: MetaAdsService;
  supabaseClient?: SupabaseClient;
}

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

// Função principal simplificada - lógica pura, mais fácil de testar
export async function syncAdsStatusCore(
  activeAds: any[],
  supabase: SupabaseClient,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = new Date();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };

  // Se for dryRun, não faz nenhuma operação no banco
  if (opts.dryRun) {
    logger.info('Modo dryRun ativado - nenhuma alteração será feita no banco');
    
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
      },
    };

    return { status, ads: activeAds };
  }

  // Preparar dados para upsert
  const adsToUpdate = activeAds.map(ad => ({
    id: ad.id,
    status: 'ACTIVE',
    updated_at: new Date().toISOString(),
    meta_data: ad,
  }));

  // Atualizar anúncios ativos
  const upsertResult = await upsertActiveAds(supabase, adsToUpdate);
  if (!upsertResult.success) {
    throw {
      code: 'DB_ERROR',
      message: 'Database Error',
      retryable: true,
      details: upsertResult.error,
    } as SyncError;
  }

  // Marcar anúncios inativos
  const updateResult = await markInactiveAds(supabase, activeAds.map(ad => ad.id));
  if (!updateResult.success) {
    throw {
      code: 'DB_ERROR',
      message: 'Database Error',
      retryable: true,
      details: updateResult.error,
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
    },
  };

  return { status, ads: activeAds };
}

// Função principal com retry logic e dependências injetáveis
export async function syncAdsStatus(
  options: SyncOptions = {},
  injectedClient?: SupabaseClient,
  dependencies: SyncDependencies = {}
): Promise<SyncResult> {
  const startTime = new Date();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const retryCount = opts.retryCount ?? DEFAULT_SYNC_OPTIONS.retryCount ?? 3;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_SYNC_OPTIONS.timeoutMs ?? 30000;
  let currentRetryCount = 0;
  let lastError: SyncError | null = null;
  
  const supabase = injectedClient || getSupabaseClient();
  const metaAdsService = dependencies.metaAdsService || new MetaAdsService({
    accessToken: process.env.META_ACCESS_TOKEN!,
    accountId: process.env.META_ACCOUNT_ID!,
  });

  logger.info({ options: opts }, 'Iniciando sincronização de status dos anúncios');

  while (currentRetryCount < retryCount) {
    try {
      // Buscar anúncios ativos da Meta API com timeout
      const activeAds = await withTimeout(
        metaAdsService.getActiveAds(),
        timeoutMs
      );
      logger.info({ count: activeAds.length }, 'Anúncios ativos obtidos da Meta API');

      // Se for dryRun, retorna sucesso com os dados da API, sem acessar o banco
      if (opts.dryRun) {
        logger.info('Modo dryRun ativado - nenhuma alteração será feita no banco');
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
          },
        };
        return { status, ads: activeAds };
      }

      // Usar a função core simplificada
      return await syncAdsStatusCore(activeAds, supabase, options);
      
    } catch (error) {
      lastError = error as SyncError;
      
      // Se for timeout, não tenta novamente
      if (lastError && lastError.message === 'Timeout') {
        logger.error({ error: lastError }, 'Timeout na sincronização');
        const endTime = new Date();
        const status: SyncStatus = {
          success: false,
          timestamp: endTime.toISOString(),
          totalAds: 0,
          activeAds: 0,
          error: 'Timeout',
          details: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMs: endTime.getTime() - startTime.getTime(),
            retryCount: currentRetryCount,
          },
        };
        return { status, ads: [] };
      }

      currentRetryCount++;

      if (!lastError?.retryable || currentRetryCount >= retryCount) {
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

  // Se não conseguiu buscar anúncios, mas não houve erro fatal, retorna sucesso com lista vazia
  if (opts.dryRun) {
    logger.info('Modo dryRun ativado - nenhuma alteração será feita no banco');
    const endTime = new Date();
    const status: SyncStatus = {
      success: true,
      timestamp: endTime.toISOString(),
      totalAds: 0,
      activeAds: 0,
      details: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
      },
    };
    return { status, ads: [] };
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