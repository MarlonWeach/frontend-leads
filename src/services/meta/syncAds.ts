import { createClient } from '@supabase/supabase-js';
import { MetaAdsService } from './ads';
import { MetaAd } from '../../types/meta';
import { logger } from '../../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function syncActiveMetaAds(metaConfig: {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
}) {
  logger.info({ msg: 'Iniciando sincronização de anúncios ativos da Meta API' });
  const metaAdsService = new MetaAdsService(metaConfig);
  const activeAds: MetaAd[] = await metaAdsService.getActiveAds();

  // Atualizar/inserir anúncios ativos no Supabase
  for (const ad of activeAds) {
    const { error } = await supabase
      .from('ads')
      .upsert({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        created_time: ad.created_time,
        updated_time: ad.updated_time
      }, { onConflict: 'id' });
    if (error) {
      logger.error({ msg: 'Erro ao upsert anúncio', adId: ad.id, error });
    }
  }

  // Marcar anúncios que não estão mais ativos
  const { data: allAds, error: fetchError } = await supabase
    .from('ads')
    .select('id, status')
    .neq('status', 'INACTIVE');
  if (fetchError) {
    logger.error({ msg: 'Erro ao buscar anúncios para marcar inativos', error: fetchError });
    return;
  }
  const activeIds = new Set(activeAds.map(ad => ad.id));
  for (const ad of allAds || []) {
    if (!activeIds.has(ad.id)) {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'INACTIVE', effective_status: 'INACTIVE' })
        .eq('id', ad.id);
      if (error) {
        logger.error({ msg: 'Erro ao marcar anúncio como inativo', adId: ad.id, error });
      }
    }
  }
  logger.info({ msg: 'Sincronização de anúncios ativos concluída', totalAtivos: activeAds.length });
} 