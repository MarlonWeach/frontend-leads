import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/utils/logger";
import { serverCache, CacheType } from '@/utils/server-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Gerar chave de cache
    const cacheKey = serverCache.constructor.generateKey(
      CacheType.DASHBOARD_ACTIVITY
    );

    // Tentar obter dados do cache ou buscar do Supabase
    return NextResponse.json(await serverCache.getOrSet(
      cacheKey,
      async () => {
        // Buscar anúncios ativos (status do anúncio, não do adset)
        const { data: activeAds, error: adsError } = await supabase
          .from('ads')
          .select('ad_id, name, adset_id, campaign_id, status')
          .eq('status', 'ACTIVE');
        if (adsError) throw adsError;
        
        const activeAdIds = (activeAds || []).map(ad => ad.ad_id).filter(Boolean);
        logger.debug({ activeAdIds }, 'IDs de anúncios ativos encontrados');
        
        // Se não houver anúncios ativos, retornar dados vazios
        if (activeAdIds.length === 0) {
          logger.warn('Nenhum anúncio ativo encontrado para dados de atividade');
          return [];
        }
        
        // Agrupa os leads por status
        const activityData = activeAdIds.reduce((acc, ad_id) => {
          const status = 'pendente';
          const count = 1;
          acc[status] = (acc[status] || 0) + count;
          return acc;
        }, {});

        // Converte para o formato esperado pelo componente Activity
        const formattedData = Object.entries(activityData).map(([status, total]) => ({
          status,
          total
        }));

        logger.debug({ 
          activeAdsCount: activeAdIds.length,
          leadsCount: 0,
          statusGroups: Object.keys(activityData).length
        }, 'Dados de atividade processados');

        return formattedData;
      },
      CacheType.DASHBOARD_ACTIVITY
    ));
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Erro ao buscar dados de atividade');
    return NextResponse.json(
      { error: 'Erro ao buscar dados de atividade' },
      { status: 500 }
    );
  }
} 