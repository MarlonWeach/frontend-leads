import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
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
        // Primeiro, buscar anúncios ativos
        const { data: activeAds, error: adsError } = await supabase
          .from('ads')
          .select('id')
          .eq('status', 'ACTIVE');
        
        if (adsError) throw adsError;
        
        const activeAdIds = (activeAds || []).map(ad => ad.id).filter(Boolean);
        
        // Se não houver anúncios ativos, retornar dados vazios
        if (activeAdIds.length === 0) {
          logger.warn('Nenhum anúncio ativo encontrado para dados de atividade');
          return [];
        }
        
        // Buscar leads associados a anúncios ativos
        const { data: metaLeads, error: metaLeadsError } = await supabase
          .from('meta_leads')
          .select('lead_count, status')
          .in('ad_id', activeAdIds);
        
        if (metaLeadsError) throw metaLeadsError;
        
        // Agrupa os leads por status
        const activityData = metaLeads.reduce((acc, lead) => {
          const status = lead.status || 'pendente';
          const count = lead.lead_count || 1;
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
          leadsCount: metaLeads.length,
          statusGroups: Object.keys(activityData).length
        }, 'Dados de atividade processados');

        return formattedData;
      },
      CacheType.DASHBOARD_ACTIVITY
    ));
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error)
    }, 'Erro ao buscar dados de atividade');
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados de atividade' },
      { status: 500 }
    );
  }
} 