import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetaAdsetsService } from '../services/meta/adsets';
import { MetaCampaignsService } from '../services/meta/campaigns';
import { logger } from '../utils/logger';
import { SyncOptions, SyncResult, SyncStatus, DEFAULT_SYNC_OPTIONS } from '../types/sync';
import { MetaAdset } from '../types/meta';

// Configurações de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCESS_TOKEN = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN!;
const META_ACCOUNT_ID = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
  throw new Error('Variáveis de ambiente obrigatórias não configuradas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para obter o cliente Supabase
function getSupabaseClient(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Certifique-se de que o accountId sempre tenha o prefixo 'act_'
const getAccountId = () => {
  if (META_ACCOUNT_ID && !META_ACCOUNT_ID.startsWith('act_')) {
    return `act_${META_ACCOUNT_ID}`;
  }
  return META_ACCOUNT_ID;
};

// Função para fazer o upsert dos dados dos adsets no Supabase
export async function upsertAdsets(supabase: SupabaseClient, adsetsData: MetaAdset[]): Promise<{ success: boolean; error?: any }> {
  const recordsToUpsert = adsetsData.map(adset => ({
    id: adset.id,
    name: adset.name,
    status: adset.status,
    effective_status: adset.effective_status,
    campaign_id: adset.campaign_id,
    created_time: adset.created_time,
    start_time: adset.start_time,
    end_time: adset.end_time,
    daily_budget: adset.daily_budget,
    lifetime_budget: adset.lifetime_budget,
    optimization_goal: adset.optimization_goal,
    billing_event: adset.billing_event,
    targeting: adset.targeting,
    spend: adset.insights?.[0]?.spend,
    impressions: adset.insights?.[0]?.impressions,
    clicks: adset.insights?.[0]?.clicks,
    ctr: adset.insights?.[0]?.ctr,
    cpc: adset.insights?.[0]?.cpc,
    cpm: adset.insights?.[0]?.cpm,
    leads: adset.insights?.[0]?.actions?.find((a: any) => a.action_type === 'onsite_conversion.lead_grouped')?.value ?? 0,
    last_synced: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from('adsets')
      .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      logger.error({ error }, 'Erro ao fazer upsert dos adsets no Supabase.');
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Erro inesperado na operação de upsert dos adsets.');
    return { success: false, error };
  }
}

// Função principal de sincronização de adsets
export async function syncAdsets(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = new Date();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const supabase = getSupabaseClient();
  const metaAdsetsService = new MetaAdsetsService(
    process.env.META_ACCESS_TOKEN!,
    getAccountId()
  );

  logger.info({ options: opts }, 'Iniciando sincronização de adsets.');

  try {
    // Busca todos os adsets com insights (o service lida com paginação)
    const adsetsWithInsights = await metaAdsetsService.getAdsetsWithInsights();

    if (opts.dryRun) {
      logger.info({ count: adsetsWithInsights.length }, 'Modo dryRun ativado. Adsets que seriam sincronizados.');
      const endTime = new Date();
      return {
        status: {
          success: true,
          timestamp: endTime.toISOString(),
          totalAds: adsetsWithInsights.length,
          activeAds: adsetsWithInsights.filter(a => a.status === 'ACTIVE').length,
          details: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMs: endTime.getTime() - startTime.getTime(),
            message: `Dry run: ${adsetsWithInsights.length} adsets seriam sincronizados.`,
          },
        },
        data: adsetsWithInsights,
      };
    }

    // Faz o upsert dos dados no Supabase
    const upsertResult = await upsertAdsets(supabase, adsetsWithInsights);

    if (!upsertResult.success) {
      throw new Error('Falha no upsert dos adsets para o Supabase.');
    }

    const endTime = new Date();
    const status: SyncStatus = {
      success: true,
      timestamp: endTime.toISOString(),
      totalAds: adsetsWithInsights.length,
      activeAds: adsetsWithInsights.filter(a => a.status === 'ACTIVE').length,
      details: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime(),
        message: `Sincronizados ${adsetsWithInsights.length} adsets.`,
      },
    };

    return { status, data: adsetsWithInsights };
  } catch (error: any) {
    logger.error({ error }, 'Erro durante a sincronização de adsets.');
    const endTime = new Date();
    return {
      status: {
        success: false,
        timestamp: endTime.toISOString(),
        totalAds: 0,
        activeAds: 0,
        error: error.message,
        details: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };
  }
}

export async function syncAdsetsJob(startDateArg?: string, endDateArg?: string) {
  logger.info('Iniciando sincronização de adsets e insights da Meta API para o Supabase.');

  // Datas parametrizáveis
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = startDateArg || process.env.ADSYNC_START_DATE || defaultStart;
  const endDate = endDateArg || process.env.ADSYNC_END_DATE || defaultEnd;

  // 1. Buscar campanhas ativas
  const campaignsService = new MetaCampaignsService({
    accessToken: META_ACCESS_TOKEN,
    accountId: getAccountId()
  });
  const activeCampaigns = await campaignsService.getActiveCampaigns();
  logger.info({ count: activeCampaigns.length }, 'Campanhas ativas encontradas.');

  // 2. Para cada campanha, buscar adsets
  const adsetsService = new MetaAdsetsService(
    META_ACCESS_TOKEN,
    getAccountId()
  );

  for (const campaign of activeCampaigns) {
    logger.info({ campaignId: campaign.id, campaignName: campaign.name }, 'Sincronizando adsets da campanha.');
    const adsets = await adsetsService.getAdsets(campaign.id);
    logger.info({ count: adsets.length, campaignId: campaign.id }, 'Adsets encontrados para a campanha.');

    // 3. Para cada adset, buscar insights e preparar upsert
    for (const adset of adsets) {
      // Buscar insights do adset para o período desejado (parametrizado)
      let insights: any[] = [];
      try {
        insights = await adsetsService.getAdsetInsights(adset.id, startDate, endDate);
        logger.info({ adsetId: adset.id, insightsCount: insights.length }, 'Insights buscados para o adset.');
      } catch (err) {
        logger.error({ adsetId: adset.id, err }, 'Erro ao buscar insights do adset.');
      }

      // Agregar métricas dos insights (exemplo: soma de spend, impressões, cliques, leads)
      const aggregated = insights.reduce((acc, i) => {
        acc.spend += Number(i.spend || 0);
        acc.impressions += Number(i.impressions || 0);
        acc.clicks += Number(i.clicks || 0);
        acc.leads += Number(i.results?.find((r: any) => r.indicator === 'actions:onsite_conversion.lead_grouped')?.values?.[0]?.value || 0);
        acc.ctr += Number(i.ctr || 0);
        acc.cpc += Number(i.cpc || 0);
        acc.cpm += Number(i.cpm || 0);
        return acc;
      }, { spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpm: 0 });

      // Upsert no Supabase
      const upsertData = {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        effective_status: adset.effective_status,
        campaign_id: adset.campaign_id,
        created_time: adset.created_time,
        updated_at: adset.updated_time,
        start_time: adset.start_time,
        end_time: adset.end_time,
        daily_budget: adset.daily_budget,
        lifetime_budget: adset.lifetime_budget,
        optimization_goal: adset.optimization_goal,
        billing_event: adset.billing_event,
        targeting: adset.targeting,
        spend: aggregated.spend,
        impressions: aggregated.impressions,
        clicks: aggregated.clicks,
        leads: aggregated.leads,
        ctr: aggregated.ctr,
        cpc: aggregated.cpc,
        cpm: aggregated.cpm,
        last_synced: new Date().toISOString()
      };
      try {
        const { error } = await supabase.from('adsets').upsert(upsertData, { onConflict: 'id' });
        if (error) {
          logger.error({ adsetId: adset.id, error }, 'Erro ao fazer upsert do adset no Supabase.');
        } else {
          logger.info({ adsetId: adset.id }, 'Upsert do adset realizado com sucesso.');
        }
      } catch (err) {
        logger.error({ adsetId: adset.id, err }, 'Erro inesperado no upsert do adset.');
      }
    }
  }

  logger.info('Sincronização de adsets concluída.');
}

// Permite execução direta via CLI
if (require.main === module) {
  const [,, startDateArg, endDateArg] = process.argv;
  syncAdsetsJob(startDateArg, endDateArg).catch((err) => {
    logger.error({ err }, 'Erro na sincronização de adsets');
    process.exit(1);
  });
} 