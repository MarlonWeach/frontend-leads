// API Route: budget-adjustments/stats
// PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes

import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { BudgetAdjustmentStatsQuery, BudgetAdjustmentStatsResponse } from '@/types/budgetAdjustmentLogs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: BudgetAdjustmentStatsQuery = {
      adset_id: searchParams.get('adset_id') || undefined,
      campaign_id: searchParams.get('campaign_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      period_hours: parseInt(searchParams.get('period_hours') || '24'),
      group_by: searchParams.get('group_by') as any || undefined
    };

    // Se adset_id específico, usar função otimizada
    if (query.adset_id) {
      const stats = await getBudgetAdjustmentStats(query.adset_id, query.period_hours);
      
      if (!stats) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao buscar estatísticas',
          stats: {
            total_adjustments: 0,
            successful_adjustments: 0,
            failed_adjustments: 0,
            avg_adjustment_percentage: 0,
            total_budget_change: 0,
            can_adjust_now: true
          }
        });
      }

      return NextResponse.json({
        success: true,
        stats
      });
    }

    // Query mais complexa para múltiplos adsets/campanhas
    let supabaseQuery = supabase
      .from('budget_adjustment_logs')
      .select('*');

    // Aplicar filtros
    if (query.campaign_id) {
      supabaseQuery = supabaseQuery.eq('campaign_id', query.campaign_id);
    }

    if (query.user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
    }

    // Filtro de período
    const startDate = new Date(Date.now() - (query.period_hours || 24) * 60 * 60 * 1000);
    supabaseQuery = supabaseQuery.gte('created_at', startDate.toISOString());

    const { data: logs, error } = await supabaseQuery;

    if (error) {
      console.error('Error fetching adjustment logs for stats:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar dados para estatísticas',
          stats: {
            total_adjustments: 0,
            successful_adjustments: 0,
            failed_adjustments: 0,
            avg_adjustment_percentage: 0,
            total_budget_change: 0,
            can_adjust_now: false
          }
        },
        { status: 500 }
      );
    }

    // Calcular estatísticas agregadas
    const totalAdjustments = logs?.length || 0;
    const successfulAdjustments = logs?.filter(log => log.status === 'applied').length || 0;
    const failedAdjustments = logs?.filter(log => log.status === 'failed').length || 0;
    
    const avgAdjustmentPercentage = totalAdjustments > 0 
      ? logs!.reduce((sum, log) => sum + (log.adjustment_percentage || 0), 0) / totalAdjustments
      : 0;
    
    const totalBudgetChange = logs?.filter(log => log.status === 'applied')
      .reduce((sum, log) => sum + (log.adjustment_amount || 0), 0) || 0;

    const stats = {
      total_adjustments: totalAdjustments,
      successful_adjustments: successfulAdjustments,
      failed_adjustments: failedAdjustments,
      avg_adjustment_percentage: Math.round(avgAdjustmentPercentage * 100) / 100,
      total_budget_change: totalBudgetChange,
      can_adjust_now: true // Para queries agregadas, assumir true
    };

    // Gerar timeline se solicitado
    let timeline = undefined;
    if (query.group_by && logs && logs.length > 0) {
      const groupedData = new Map();
      
      logs.forEach(log => {
        let period: string;
        const date = new Date(log.created_at);
        
        switch (query.group_by) {
          case 'hour':
            period = date.toISOString().substring(0, 13) + ':00:00.000Z';
            break;
          case 'day':
            period = date.toISOString().substring(0, 10);
            break;
          case 'week': {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            period = weekStart.toISOString().substring(0, 10);
            break;
          }
          case 'month':
            period = date.toISOString().substring(0, 7);
            break;
          default:
            period = date.toISOString().substring(0, 10);
        }
        
        if (!groupedData.has(period)) {
          groupedData.set(period, {
            period,
            adjustments: 0,
            total_percentage: 0,
            total_change: 0
          });
        }
        
        const group = groupedData.get(period);
        group.adjustments++;
        group.total_percentage += log.adjustment_percentage || 0;
        if (log.status === 'applied') {
          group.total_change += log.adjustment_amount || 0;
        }
      });
      
      timeline = Array.from(groupedData.values()).map(group => ({
        period: group.period,
        adjustments: group.adjustments,
        avg_percentage: Math.round((group.total_percentage / group.adjustments) * 100) / 100,
        total_change: group.total_change
      })).sort((a, b) => a.period.localeCompare(b.period));
    }

    const response: BudgetAdjustmentStatsResponse = {
      success: true,
      stats,
      timeline
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in budget adjustment stats API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        stats: {
          total_adjustments: 0,
          successful_adjustments: 0,
          failed_adjustments: 0,
          avg_adjustment_percentage: 0,
          total_budget_change: 0,
          can_adjust_now: false
        },
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 