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
      CacheType.DASHBOARD_SEARCH
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
          logger.warn('Nenhum anúncio ativo encontrado para dados de busca');
          return [];
        }
        
        // Buscar leads associados a anúncios ativos
        const { data: metaLeads, error: metaLeadsError } = await supabase
          .from('meta_leads')
          .select('ad_name, lead_count, campaign_name')
          .in('ad_id', activeAdIds);
        
        if (metaLeadsError) throw metaLeadsError;
        
        // Agrupa os leads por fonte (usando campaign_name como fonte)
        const searchData = metaLeads.reduce((acc, lead) => {
          const source = lead.campaign_name || lead.ad_name || 'outros';
          const count = lead.lead_count || 1;
          acc[source] = (acc[source] || 0) + count;
          return acc;
        }, {});

        // Converte para o formato esperado pelo componente Search
        const formattedData = Object.entries(searchData).map(([source, total]) => ({
          source,
          total
        }));

        logger.debug({ 
          activeAdsCount: activeAdIds.length,
          leadsCount: metaLeads.length,
          sourceGroups: Object.keys(searchData).length
        }, 'Dados de busca processados');

        return formattedData;
      },
      CacheType.DASHBOARD_SEARCH
    ));
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error)
    }, 'Erro ao buscar dados de busca');
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados de busca' },
      { status: 500 }
    );
  }
} 