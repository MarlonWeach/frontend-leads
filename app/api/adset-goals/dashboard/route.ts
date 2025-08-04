// API Route: adset-goals/dashboard
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { startOfMonth, endOfMonth } from 'date-fns';
import { AdsetGoalDashboardItem, AdsetGoalStatus } from '@/types/adsetGoalsDashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort_by') || 'progress_percentage';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // NOVO: Filtro de data/timeframe
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // 1. Definir período
    let startDate: string, endDate: string;
    if (dateFrom && dateTo) {
      startDate = dateFrom;
      endDate = dateTo;
    } else {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      startDate = monthStart.toISOString().slice(0, 10);
      endDate = monthEnd.toISOString().slice(0, 10);
    }

    // 2. Buscar todos os registros de adset_insights do período selecionado
    const { data: insights, error: insightsError } = await supabase
      .from('adset_insights')
      .select('adset_id, adset_name, campaign_id, impressions, leads, spend')
      .gte('date', startDate)
      .lte('date', endDate);

    if (insightsError) {
      return NextResponse.json({ data: [], error: 'Erro ao buscar insights: ' + insightsError.message }, { status: 200 });
    }

    // 3. Agregar dados por adset_id em memória
    const adsetMap: Record<string, {
      adset_id: string;
      adset_name: string;
      campaign_id: string;
      total_impressions: number;
      total_leads: number;
      total_spend: number;
    }> = {};
    for (const row of insights || []) {
      if (!row.adset_id) continue;
      if (!adsetMap[row.adset_id]) {
        adsetMap[row.adset_id] = {
          adset_id: row.adset_id,
          adset_name: row.adset_name,
          campaign_id: row.campaign_id,
          total_impressions: 0,
          total_leads: 0,
          total_spend: 0
        };
      }
      adsetMap[row.adset_id].total_impressions += Number(row.impressions) || 0;
      adsetMap[row.adset_id].total_leads += Number(row.leads) || 0;
      adsetMap[row.adset_id].total_spend += Number(row.spend) || 0;
    }

    // 4. Filtrar adsets com > 50 impressões
    const filtered = Object.values(adsetMap).filter(i => i.total_impressions > 50);
    if (!filtered.length) {
      return NextResponse.json({ data: [], error: null }, { status: 200 });
    }

    // 5. Buscar metas para esses adsets
    const adsetIds = filtered.map(i => i.adset_id);
    const { data: goals, error: goalsError } = await supabase
      .from('adset_goals')
      .select('*')
      .in('adset_id', adsetIds);
    const goalsMap: Record<string, any> = {};
    for (const goal of goals || []) {
      if (goal.adset_id) goalsMap[goal.adset_id] = goal;
    }

    // 6. Montar resposta final
    const items: AdsetGoalDashboardItem[] = await Promise.all(filtered.map(async i => {
      const goal = goalsMap[i.adset_id] || null;
      const cpl = i.total_leads > 0 ? i.total_spend / i.total_leads : null;
      let metrics: any = {
        days_total: null,
        days_elapsed: null,
        days_remaining: null,
        progress_percentage: null,
        daily_average_leads: null,
        leads_needed_daily: null,
        budget_utilization_percentage: null,
        current_cpl: cpl,
        projected_final_leads: null,
        projected_final_cpl: null,
        total_impressions: i.total_impressions,
        total_leads: i.total_leads,
        total_spend: i.total_spend,
        leads_in_goal_period: null,
        leads_ontem: null
      };
      let status: AdsetGoalStatus = 'critico';
      const alerts: any[] = [];
      if (goal) {
        // Buscar soma de leads do adset no período da meta
        const { data: leadsRows, error: leadsError } = await supabase
          .from('adset_insights')
          .select('leads, date')
          .eq('adset_id', i.adset_id)
          .gte('date', goal.contract_start_date)
          .lte('date', goal.contract_end_date);
        let leadsInGoalPeriod = 0;
        let leadsOntem = 0;
        if (!leadsError && Array.isArray(leadsRows)) {
          leadsInGoalPeriod = leadsRows.reduce((sum, row) => sum + (Number(row.leads) || 0), 0);
          // Buscar leads de ontem
          const ontem = new Date();
          ontem.setDate(ontem.getDate() - 1);
          const ontemStr = ontem.toISOString().slice(0, 10);
          leadsOntem = leadsRows.filter(row => row.date === ontemStr).reduce((sum, row) => sum + (Number(row.leads) || 0), 0);
        }
        const today = new Date();
        const start = new Date(goal.contract_start_date);
        const end = new Date(goal.contract_end_date);
        const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        const leadsNeededTotal = goal.volume_contracted - leadsInGoalPeriod;
        const leadsNeededDaily = daysRemaining > 0 ? leadsNeededTotal / daysRemaining : 0;
        const dailyAverageLeads = daysElapsed > 0 ? leadsInGoalPeriod / daysElapsed : 0;
        const progressPercentage = goal.volume_contracted > 0 ? (leadsInGoalPeriod / goal.volume_contracted) * 100 : null;
        const budgetUtilization = goal.budget_total > 0 ? (i.total_spend / goal.budget_total) * 100 : null;
        const projectedFinalLeads = daysRemaining > 0 ? leadsInGoalPeriod + (dailyAverageLeads * daysRemaining) : leadsInGoalPeriod;
        const projectedFinalCpl = projectedFinalLeads > 0 ? i.total_spend / projectedFinalLeads : null;
        metrics = {
          ...metrics,
          days_total: daysTotal,
          days_elapsed: daysElapsed,
          days_remaining: daysRemaining,
          progress_percentage: progressPercentage,
          daily_average_leads: dailyAverageLeads,
          leads_needed_daily: leadsNeededDaily,
          budget_utilization_percentage: budgetUtilization,
          projected_final_leads: projectedFinalLeads,
          projected_final_cpl: projectedFinalCpl,
          leads_in_goal_period: leadsInGoalPeriod,
          leads_ontem: leadsOntem
        };
        // Status inteligente
        if (
          typeof leadsNeededDaily === 'number' &&
          typeof leadsOntem === 'number' &&
          leadsNeededDaily > 0
        ) {
          if (leadsOntem < leadsNeededDaily * 0.9) {
            status = 'atrasado';
          } else if (leadsOntem < leadsNeededDaily) {
            status = 'atencao';
          } else {
            status = 'no_prazo';
          }
        } else {
          status = 'no_prazo';
        }
        // Alerta só se faltar campo essencial
        const missingFields = [goal.budget_total, goal.cpl_target, goal.volume_contracted, goal.contract_start_date, goal.contract_end_date].some(v => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v)));
        if (missingFields) {
          alerts.push({ type: 'budget', severity: 'critical', message: 'Informações de meta incompletas para este adset', created_at: new Date().toISOString() });
        }
      }
      return {
        adset_id: i.adset_id,
        adset_name: i.adset_name,
        campaign_id: i.campaign_id,
        campaign_name: '',
        goal: goal,
        progress: null,
        metrics: metrics,
        status: goal ? status : 'critico',
        alerts: goal ? alerts : [{ type: 'budget', severity: 'critical', message: 'Informações de meta incompletas para este adset', created_at: new Date().toISOString() }]
      };
    }));

    // 7. Ordenação simples (por enquanto)
    items.sort((a, b) => {
      if (sortOrder === 'desc') {
        return (b.metrics?.progress_percentage || 0) - (a.metrics?.progress_percentage || 0);
      } else {
        return (a.metrics?.progress_percentage || 0) - (b.metrics?.progress_percentage || 0);
      }
    });

    return NextResponse.json({ data: items, error: null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ data: [], error: err?.message || 'Erro desconhecido' }, { status: 200 });
  }
} 