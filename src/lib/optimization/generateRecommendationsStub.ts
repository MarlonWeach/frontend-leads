import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildOptimizationContextItems } from '@/lib/goals/optimizationContext';
import { aggregateAdsetInsightsWindow7d, type AdsetInsightDailyRow } from '@/lib/optimization/adsetInsightsWindow7d';
import type { GoalOptimizationContextItem } from '@/types/goals';
import type {
  OptimizationConfidenceLevel,
  OptimizationContextSnapshotV1,
  OptimizationRecommendationType,
} from '@/types/optimizationRecommendations';

const MIN_VALID_DAYS_FOR_RECOMMENDATION = 5;
const RECOMMENDATION_TTL_HOURS = 24;
/** Abaixo disso, CPL custo começa a comer a margem vs CPL receita (contrato). */
const COST_VS_REVENUE_TIGHT_RATIO = 0.95;
/** Margem mínima (receita − custo) para sugerir escala quando há gap de entrega. */
const MIN_MARGIN_PER_LEAD_FOR_SCALE = 15;
/** Tolerância: entregues < esperado linear × fator ⇒ “atrás do ritmo”. */
const BEHIND_PACE_FACTOR = 0.92;

function fmtPt(n: number, maxFrac = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  }).format(n);
}

/** Margem sobre o valor recebido por lead (0–100). */
function marginOverRevenuePercent(marginPerLead: number, cplReceita: number): number {
  if (cplReceita <= 0) return 0;
  return (marginPerLead / cplReceita) * 100;
}

/** Nome amigável: prioriza `adsets.name` (Meta), depois `adset_goals.adset_name`. */
async function mergeAdsetNamesIntoGoals(
  supabase: SupabaseClient,
  goals: GoalOptimizationContextItem[]
): Promise<void> {
  const ids = [...new Set(goals.map((g) => g.adset_id).filter(Boolean))];
  if (!ids.length) return;

  const { data: adsetRows } = await supabase.from('adsets').select('id, name').in('id', ids);
  const byAdset = new Map<string, string>();
  for (const row of adsetRows || []) {
    const id = String((row as { id: string }).id);
    const raw = (row as { name?: string | null }).name;
    const n = raw != null ? String(raw).trim() : '';
    if (n) byAdset.set(id, n);
  }

  const { data: goalRows } = await supabase
    .from('adset_goals')
    .select('adset_id, adset_name')
    .in('adset_id', ids);
  const byGoal = new Map<string, string>();
  for (const row of goalRows || []) {
    const id = String((row as { adset_id: string }).adset_id);
    const raw = (row as { adset_name?: string | null }).adset_name;
    const n = raw != null ? String(raw).trim() : '';
    if (n) byGoal.set(id, n);
  }

  for (const g of goals) {
    const n = byAdset.get(g.adset_id) || byGoal.get(g.adset_id);
    if (n && !g.adset_name?.trim()) {
      g.adset_name = n;
    }
  }
}

function addHours(d: Date, h: number): Date {
  const out = new Date(d);
  out.setHours(out.getHours() + h);
  return out;
}

function buildSnapshot(
  goal: GoalOptimizationContextItem,
  window7d: ReturnType<typeof aggregateAdsetInsightsWindow7d>
): OptimizationContextSnapshotV1 {
  const passed = window7d.days_with_valid_data >= MIN_VALID_DAYS_FOR_RECOMMENDATION;
  return {
    snapshot_schema_version: 1,
    goal_context: goal,
    window_7d: window7d,
    eligibility: {
      passed_minimum_sample: passed,
      flags: passed ? [] : ['insufficient_valid_days_in_window'],
    },
  };
}

/**
 * cpl_target na meta = valor recebido por lead no contrato (CPL receita).
 * current_cpl = spend / leads entregues no período da meta = CPL custo.
 * Objetivo de mídia: CPL custo baixo; escala só faz sentido com margem e gap de entrega.
 */
function pickRecommendation(
  goal: GoalOptimizationContextItem
): { type: OptimizationRecommendationType; confidence: OptimizationConfidenceLevel; payload: Record<string, unknown>; evidence: string; scores: Record<string, unknown> } | null {
  const cplReceita = goal.cpl_target;
  const costCpl = goal.current_cpl;
  if (costCpl == null || cplReceita <= 0) return null;

  const marginPerLead = cplReceita - costCpl;
  const weights = { w_cpl: 0.5, w_eff: 0.3, w_leads: 0.2 };

  const contractStart = parseISO(goal.contract_start_date);
  const competenceEnd = parseISO(goal.competence_end_date);
  const today = new Date();
  const totalDaysInCompetence = Math.max(
    1,
    differenceInCalendarDays(competenceEnd, contractStart) + 1
  );
  const daysElapsed = Math.min(
    totalDaysInCompetence,
    Math.max(0, differenceInCalendarDays(today, contractStart) + 1)
  );
  const expectedLinearLeads = goal.volume_contracted * (daysElapsed / totalDaysInCompetence);
  const delivered = goal.delivered_reference;
  const behindLinearPace = delivered < expectedLinearLeads * BEHIND_PACE_FACTOR;

  // Reduzir: custo por lead inviabiliza ou aperta demais a margem vs o que o contrato paga por lead
  if (costCpl >= cplReceita * COST_VS_REVENUE_TIGHT_RATIO || marginPerLead <= 0) {
    const scoreCpl = Math.max(0, Math.min(1, costCpl / cplReceita));
    return {
      type: 'budget_decrease',
      confidence: marginPerLead <= 0 ? 'high' : 'medium',
      payload: {
        suggested_budget_delta_percent: -15,
        currency: 'BRL',
      },
      evidence: `CPL custo ${fmtPt(costCpl, 2)} vs receita ${fmtPt(cplReceita, 2)}/lead. Margem ${fmtPt(marginPerLead, 2)}. Avaliar redução de orçamento.`,
      scores: {
        score_cpl: scoreCpl,
        score_eff: 0.45,
        score_leads: 0.35,
        weights,
        score_total: 0.5 * scoreCpl + 0.2,
      },
    };
  }

  // Aumentar só se há leads faltando no contrato E ritmo abaixo do linear E margem confortável
  if (goal.volume_remaining > 0 && behindLinearPace && marginPerLead >= MIN_MARGIN_PER_LEAD_FOR_SCALE) {
    const scoreLeads = Math.max(0, Math.min(1, goal.volume_remaining / Math.max(1, goal.volume_contracted)));
    return {
      type: 'budget_increase',
      confidence: 'medium',
      payload: {
        suggested_budget_delta_percent: 10,
        max_delta_percent: 20,
        currency: 'BRL',
      },
      evidence: `Abaixo do pacing — ${fmtPt(goal.leads_needed_daily)} leads/dia necessários. Margem saudável de ${fmtPt(marginOverRevenuePercent(marginPerLead, cplReceita))}%.`,
      scores: {
        score_cpl: 0.4,
        score_eff: 0.5,
        score_leads: scoreLeads,
        weights,
        score_total: 0.45 + 0.2 * scoreLeads,
      },
    };
  }

  return null;
}

/**
 * Motor v1 (stub): gera recomendações por adset com meta na competência, usando janela 7d e contexto de meta.
 */
export async function generateRecommendationsStub(
  supabase: SupabaseClient,
  metaAccountId: string,
  competenceMonth: string | null,
  overwriteActive = false
): Promise<{ created: number; batch_id: string; error: string | null }> {
  if (overwriteActive) {
    let clearQuery = supabase
      .from('optimization_recommendations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('meta_account_id', metaAccountId)
      .eq('status', 'active');

    if (competenceMonth) {
      clearQuery = clearQuery.eq('competence_month', competenceMonth);
    }

    const { error: clearError } = await clearQuery;
    if (clearError) {
      return { created: 0, batch_id: '', error: clearError.message };
    }
  }

  const { data: goalsContext, error: ctxError } = await buildOptimizationContextItems(
    supabase,
    metaAccountId,
    competenceMonth
  );
  if (ctxError) {
    return { created: 0, batch_id: '', error: ctxError };
  }

  const asOf = format(new Date(), 'yyyy-MM-dd');
  const windowStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const adsetIds = goalsContext.map((g) => g.adset_id).filter(Boolean);
  if (!adsetIds.length) {
    return { created: 0, batch_id: crypto.randomUUID(), error: null };
  }

  await mergeAdsetNamesIntoGoals(supabase, goalsContext);

  const { data: insightRows, error: insError } = await supabase
    .from('adset_insights')
    .select('adset_id, date, spend, leads, impressions, clicks')
    .in('adset_id', adsetIds)
    .gte('date', windowStart)
    .lte('date', asOf);

  if (insError) {
    return { created: 0, batch_id: '', error: insError.message };
  }

  const byAdset = new Map<string, AdsetInsightDailyRow[]>();
  for (const row of insightRows || []) {
    const id = String(row.adset_id);
    const list = byAdset.get(id) || [];
    list.push({
      date: String(row.date).slice(0, 10),
      spend: row.spend,
      leads: row.leads,
      impressions: row.impressions,
      clicks: row.clicks,
    });
    byAdset.set(id, list);
  }

  const batchId = crypto.randomUUID();
  const now = new Date();
  let created = 0;

  for (const goal of goalsContext) {
    const rows = byAdset.get(goal.adset_id) || [];
    const window7d = aggregateAdsetInsightsWindow7d(rows, asOf);
    const snapshot = buildSnapshot(goal, window7d);
    if (!snapshot.eligibility.passed_minimum_sample) {
      continue;
    }

    const picked = pickRecommendation(goal);
    if (!picked) continue;

    const { data: existing } = await supabase
      .from('optimization_recommendations')
      .select('id')
      .eq('meta_account_id', metaAccountId)
      .eq('entity_id', goal.adset_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing?.id) continue;

    const expiresAt = addHours(now, RECOMMENDATION_TTL_HOURS).toISOString();

    const { error: insertError } = await supabase.from('optimization_recommendations').insert({
      meta_account_id: metaAccountId,
      scope: 'adset',
      entity_id: goal.adset_id,
      competence_month: goal.competence_month,
      recommendation_type: picked.type,
      confidence_level: picked.confidence,
      status: 'active',
      generated_at: now.toISOString(),
      expires_at: expiresAt,
      action_payload: picked.payload,
      score_breakdown: picked.scores,
      evidence_summary: picked.evidence,
      risk_flags: [],
      context_snapshot: snapshot,
      batch_id: batchId,
    });

    if (!insertError) {
      created += 1;
    }
  }

  return { created, batch_id: batchId, error: null };
}
