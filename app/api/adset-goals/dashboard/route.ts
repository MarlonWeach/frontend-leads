// API Route: adset-goals/dashboard
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { startOfMonth, endOfMonth } from 'date-fns';
import { AdsetGoalDashboardItem } from '@/types/adsetGoalsDashboard';

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
    const items: AdsetGoalDashboardItem[] = filtered.map(i => {
      const goal = goalsMap[i.adset_id] || null;
      return {
        adset_id: i.adset_id,
        adset_name: i.adset_name,
        campaign_id: i.campaign_id,
        campaign_name: '',
        goal: goal,
        progress: null,
        metrics: null,
        status: goal ? 'no_prazo' : 'incompleto',
        alerts: goal ? [] : [{ type: 'budget', severity: 'critical', message: 'Informações de meta incompletas para este adset', created_at: new Date().toISOString() }]
      };
    });

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