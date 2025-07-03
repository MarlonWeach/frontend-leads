import { NextRequest, NextResponse } from 'next/server';
import { syncAdsStatus } from '@/jobs/sync-ads';
import { logger } from '@/utils/logger';
import { DEFAULT_SYNC_OPTIONS } from '@/types/sync';

export async function POST(request: NextRequest) {
  try {
    // Obter opções de sincronização do corpo da requisição
    let options = DEFAULT_SYNC_OPTIONS;
    try {
      const body = await request.json();
      if (body) {
        options = {
          force: body.force ?? DEFAULT_SYNC_OPTIONS.force,
          retryCount: body.retryCount ?? DEFAULT_SYNC_OPTIONS.retryCount,
          timeoutMs: body.timeoutMs ?? DEFAULT_SYNC_OPTIONS.timeoutMs,
        };
      }
    } catch (e) {
      // Em caso de erro ao processar o corpo, usa as opções padrão
      logger.warn({
        msg: 'Erro ao processar corpo da requisição, usando opções padrão',
        error: e instanceof Error ? e.message : String(e)
      });
    }

    // Executar sincronização
    const result = await syncAdsStatus(options);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({
      msg: 'Erro interno ao sincronizar status dos anúncios',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Erro interno ao sincronizar status dos anúncios' },
      { status: 500 }
    );
  }
} 