import { NextRequest, NextResponse } from 'next/server';
import { endOfMonth, startOfMonth } from 'date-fns';
import { supabaseServer as supabase } from '../../../../src/lib/supabaseServer';
import { GoalOptimizationContextItem, GoalOptimizationContextResponse } from '../../../../src/types/goals';

export const dynamic = 'force-dynamic';

function getCompetenceStart(input?: string | null): Date {
  if (!input) return startOfMonth(new Date());
  const parsed = new Date(`${input}-01`);
  if (Number.isNaN(parsed.getTime())) return startOfMonth(new Date());
  return startOfMonth(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metaAccountId = searchParams.get('meta_account_id') || '256925527';
    const competenceParam = searchParams.get('competence_month'); // YYYY-MM
    const competenceStart = getCompetenceStart(competenceParam);
    const competenceStartStr = competenceStart.toISOString().slice(0, 10);

    const { data: goals, error: goalsError } = await supabase
      .from('adset_goals')
      .select('*')
      .gte('contract_start_date', competenceStartStr)
      .lt('contract_start_date', startOfMonth(new Date(competenceStart.getFullYear(), competenceStart.getMonth() + 1, 1)).toISOString().slice(0, 10));

    if (goalsError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch goals: ${goalsError.message}` } satisfies GoalOptimizationContextResponse,
        { status: 500 }
      );
    }

    const adsetIds = (goals || []).map(goal => goal.adset_id).filter(Boolean);
    if (!adsetIds.length) {
      return NextResponse.json({ success: true, data: [], total: 0 } satisfies GoalOptimizationContextResponse);
    }

    const dateRanges = (goals || []).map(goal => {
      const start = new Date(goal.contract_start_date);
      const end = endOfMonth(start);
      return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      };
    });

    const minStart = dateRanges.reduce((min, item) => (item.start < min ? item.start : min), dateRanges[0].start);
    const maxEnd = dateRanges.reduce((max, item) => (item.end > max ? item.end : max), dateRanges[0].end);

    const { data: insights, error: insightsError } = await supabase
      .from('adset_insights')
      .select('adset_id, date, leads, spend')
      .in('adset_id', adsetIds)
      .gte('date', minStart)
      .lte('date', maxEnd);

    if (insightsError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch insights: ${insightsError.message}` } satisfies GoalOptimizationContextResponse,
        { status: 500 }
      );
    }

    const today = new Date();
    const context: GoalOptimizationContextItem[] = (goals || []).map(goal => {
      const goalStart = new Date(goal.contract_start_date);
      const competenceEnd = endOfMonth(goalStart);
      const goalStartStr = goalStart.toISOString().slice(0, 10);
      const competenceEndStr = competenceEnd.toISOString().slice(0, 10);

      const filteredInsights = (insights || []).filter(row =>
        row.adset_id === goal.adset_id &&
        row.date >= goalStartStr &&
        row.date <= competenceEndStr
      );

      const historicalLeads = filteredInsights.reduce((sum, row) => sum + (Number(row.leads) || 0), 0);
      const spendToDate = filteredInsights.reduce((sum, row) => sum + (Number(row.spend) || 0), 0);

      const manualCaptured = goal.volume_captured;
      const hasManualDelivery = typeof manualCaptured === 'number' && Number.isFinite(manualCaptured);
      const deliveredReference = hasManualDelivery ? manualCaptured : historicalLeads;
      const deliveredSource: GoalOptimizationContextItem['delivered_source'] = hasManualDelivery
        ? 'manual_client'
        : 'historical_fallback';

      const volumeRemaining = Math.max(0, Number(goal.volume_contracted) - deliveredReference);
      const daysRemaining = Math.max(0, Math.ceil((competenceEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const leadsNeededDaily = daysRemaining > 0 ? volumeRemaining / daysRemaining : 0;
      const currentCpl = deliveredReference > 0 ? spendToDate / deliveredReference : null;

      return {
        meta_account_id: metaAccountId,
        adset_id: goal.adset_id,
        adset_name: goal.adset_name || undefined,
        competence_month: goalStart.toISOString().slice(0, 7),
        contract_start_date: goalStartStr,
        competence_end_date: competenceEndStr,
        volume_contracted: Number(goal.volume_contracted) || 0,
        delivered_reference: deliveredReference,
        delivered_source: deliveredSource,
        volume_remaining: volumeRemaining,
        days_remaining: daysRemaining,
        leads_needed_daily: leadsNeededDaily,
        cpl_target: Number(goal.cpl_target) || 0,
        current_cpl: currentCpl,
        budget_total: Number(goal.budget_total) || 0,
        spend_to_date: spendToDate,
        has_manual_delivery: hasManualDelivery,
      };
    });

    return NextResponse.json({
      success: true,
      data: context,
      total: context.length,
    } satisfies GoalOptimizationContextResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } satisfies GoalOptimizationContextResponse,
      { status: 500 }
    );
  }
}
