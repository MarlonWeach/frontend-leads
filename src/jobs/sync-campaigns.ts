import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetaCampaignsService, MetaCampaign } from '../services/meta/campaigns';
import { logger } from '../utils/logger';

// Função para obter o cliente Supabase
function getSupabaseClient(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Função para fazer o upsert dos dados das campanhas no Supabase
export async function upsertCampaigns(
  supabase: SupabaseClient,
  campaignsData: MetaCampaign[]
): Promise<{ success: boolean; error?: any }> {
  const recordsToUpsert = campaignsData.map((campaign: MetaCampaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    // Usar apenas colunas mais básicas que provavelmente existem
    // effective_status: campaign.effective_status,
    // created_time: campaign.created_time,
    // updated_time: campaign.updated_time,
    // objective: campaign.objective,
    // special_ad_categories: campaign.special_ad_categories,
    // spend_cap: campaign.spend_cap,
    // daily_budget: campaign.daily_budget,
    // lifetime_budget: campaign.lifetime_budget,
  }));

  try {
    const { error } = await supabase
      .from('campaigns')
      .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      logger.error({ error }, 'Erro ao fazer upsert das campanhas no Supabase.');
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Erro inesperado na operação de upsert das campanhas.');
    return { success: false, error };
  }
}

// Função principal de sincronização de campanhas
export async function syncCampaigns(): Promise<void> {
  const supabase = getSupabaseClient();
  const metaCampaignsService = new MetaCampaignsService({
    accessToken: process.env.META_ACCESS_TOKEN!,
    accountId: process.env.META_ACCOUNT_ID!,
  });

  logger.info('Iniciando sincronização de campanhas.');

  try {
    const campaigns = await metaCampaignsService.getCampaigns();
    logger.info({ count: campaigns.length }, 'Campanhas obtidas da Meta API.');
    const upsertResult = await upsertCampaigns(supabase, campaigns);
    if (!upsertResult.success) {
      throw new Error('Falha no upsert das campanhas para o Supabase.');
    }
    logger.info('Sincronização de campanhas concluída com sucesso.');
  } catch (error: any) {
    logger.error({ error }, 'Erro durante a sincronização de campanhas.');
    throw error;
  }
}

// Se rodar diretamente via CLI
if (require.main === module) {
  syncCampaigns().catch((err) => {
    logger.error({ err }, 'Erro fatal na sincronização de campanhas.');
    process.exit(1);
  });
} 