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
      CacheType.DASHBOARD_RECENT_SALES
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
          logger.warn('Nenhum anúncio ativo encontrado para dados de vendas recentes');
          return [];
        }
        
        // Buscar leads associados a anúncios ativos
        const { data: metaLeads, error: metaLeadsError } = await supabase
          .from('meta_leads')
          .select(`
            id, 
            ad_name, 
            lead_count, 
            spend, 
            created_time
          `)
          .in('ad_id', activeAdIds)
          .order('created_time', { ascending: false })
          .limit(5);
        
        if (metaLeadsError) throw metaLeadsError;
        
        // Formatar dados para o formato esperado pelo componente
        const formattedData = metaLeads.map(lead => ({
          id: lead.id,
          name: lead.ad_name || 'Anúncio sem nome',
          email: `${lead.lead_count || 0} lead(s)`,
          status: 'convertido',
          amount: `R$ ${parseFloat(lead.spend || 0).toFixed(2)}`,
          created_at: lead.created_time
        }));

        logger.debug({ 
          activeAdsCount: activeAdIds.length,
          recentLeadsCount: metaLeads.length
        }, 'Dados de vendas recentes processados');

        return formattedData;
      },
      CacheType.DASHBOARD_RECENT_SALES
    ));
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error)
    }, 'Erro ao buscar dados de vendas recentes');
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados de vendas recentes' },
      { status: 500 }
    );
  }
} 