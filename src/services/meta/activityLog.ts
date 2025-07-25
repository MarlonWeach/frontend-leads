// src/services/meta/activityLog.ts
import { logger } from '../../utils/logger';

const DEFAULT_BASE_URL = 'https://graph.facebook.com/v18.0';
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000;

export interface MetaActivity {
  event_time: string;
  event_type: string;
  translated_event_type: string;
  actor_id: string;
  actor_name: string;
  object_id: string;
  object_name: string;
  object_type: string;
  extra_data?: any;
  application_id?: string;
  application_name?: string;
}

export interface FetchActivitiesParams {
  accountId: string;
  accessToken: string;
  since?: string;
  until?: string;
  category?: string;
  limit?: number;
  after?: string;
}

export async function fetchAccountActivities(params: FetchActivitiesParams): Promise<{ activities: MetaActivity[]; nextPage?: string }> {
  const {
    accountId,
    accessToken,
    since,
    until,
    category,
    limit = 100,
    after
  } = params;

  const path = `act_${accountId}/activities`;
  const url = new URL(`${DEFAULT_BASE_URL}/${path}`);
  url.searchParams.append('access_token', accessToken);
  url.searchParams.append('limit', String(limit));
  if (since) url.searchParams.append('since', since);
  if (until) url.searchParams.append('until', until);
  if (category) url.searchParams.append('category', category);
  if (after) url.searchParams.append('after', after);

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt++) {
    try {
      logger.info({ msg: 'Buscando atividades da Meta API', url: url.toString(), attempt });
      const response = await fetch(url.toString());
      const data = await response.json();
      if (!response.ok) {
        logger.error({ msg: 'Erro ao buscar atividades da Meta API', error: data.error });
        throw new Error(data.error?.message || 'Erro desconhecido na Meta API');
      }
      const activities: MetaActivity[] = (data.data || []).map((item: any) => ({
        event_time: item.event_time,
        event_type: item.event_type,
        translated_event_type: item.translated_event_type,
        actor_id: item.actor_id,
        actor_name: item.actor_name,
        object_id: item.object_id,
        object_name: item.object_name,
        object_type: item.object_type,
        extra_data: item.extra_data,
        application_id: item.application_id,
        application_name: item.application_name
      }));
      const nextPage = data.paging?.cursors?.after;
      return { activities, nextPage };
    } catch (error) {
      lastError = error as Error;
      logger.warn({ msg: 'Erro temporário ao buscar atividades, tentando novamente', attempt, error: error instanceof Error ? error.message : error });
      if (attempt < DEFAULT_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_DELAY * attempt));
      }
    }
  }
  throw lastError;
}

// Utilitário para filtrar apenas eventos relevantes
export function filterRelevantActivities(activities: MetaActivity[]): MetaActivity[] {
  const relevantTypes = [
    // Budget
    'update_campaign_budget', 'update_ad_set_budget', 'update_ad_set_spend_cap',
    // Status
    'update_campaign_run_status', 'update_ad_set_run_status',
    // Criação/remoção
    'create_campaign', 'delete_campaign', 'create_ad_set', 'delete_ad_set', 'create_ad', 'delete_ad',
    // Pausa/reativação
    'pause_campaign', 'activate_campaign', 'pause_ad_set', 'activate_ad_set', 'pause_ad', 'activate_ad',
    // Outros relevantes
    'update_ad_set_bidding', 'update_ad_set_bid_strategy', 'update_ad_set_target_spec', 'update_ad_set_optimization_goal',
    'ad_account_update_spend_limit', 'ad_account_reset_spend_limit',
    'ad_account_add_user_to_role', 'ad_account_remove_user_from_role',
    'ad_account_billing_charge', 'ad_account_billing_decline',
    'update_ad_creative', 'edit_and_update_ad_creative',
    'ad_review_approved', 'ad_review_declined', 'first_delivery_event'
  ];
  return activities.filter(a => relevantTypes.includes(a.event_type));
} 