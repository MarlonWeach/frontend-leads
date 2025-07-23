// Service: budgetAdjustmentLogService.ts
// PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes

import { supabase } from '@/lib/supabaseClient';
import {
  BudgetAdjustmentLog,
  BudgetAdjustmentStats,
  CreateBudgetAdjustmentLogRequest,
  CreateBudgetAdjustmentLogResponse,
  ValidateBudgetAdjustmentRequest,
  ValidateBudgetAdjustmentResponse,
  BudgetAdjustmentLogsQuery,
  BudgetAdjustmentLogsResponse,
  UpdateBudgetAdjustmentLogRequest,
  UpdateBudgetAdjustmentLogResponse,
  BudgetAdjustmentContext
} from '@/types/budgetAdjustmentLogs';

const MAX_ADJUSTMENTS_PER_HOUR = 4;

/**
 * Valida se um adset pode receber ajuste de budget considerando limite de frequência
 */
export async function validateBudgetAdjustmentFrequency(
  request: ValidateBudgetAdjustmentRequest
): Promise<ValidateBudgetAdjustmentResponse> {
  try {
    const { adset_id, exclude_log_id } = request;
    
    // Usar função do banco para validar frequência
    const { data, error } = await supabase
      .rpc('validate_budget_adjustment_frequency', {
        p_adset_id: adset_id,
        p_exclude_log_id: exclude_log_id || null
      });

    if (error) {
      console.error('Error validating adjustment frequency:', error);
      return {
        success: false,
        can_adjust: false,
        adjustments_in_last_hour: 0,
        remaining_adjustments: 0,
        error: error.message
      };
    }

    const canAdjust = data as boolean;

    // Buscar contagem atual para informações detalhadas
    const { data: logs, error: logsError } = await supabase
      .from('budget_adjustment_logs')
      .select('created_at')
      .eq('adset_id', adset_id)
      .eq('status', 'applied')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // última hora
      .neq('id', exclude_log_id || 'none');

    if (logsError) {
      console.error('Error fetching adjustment logs:', logsError);
    }

    const adjustmentsInLastHour = logs?.length || 0;
    const remainingAdjustments = Math.max(0, MAX_ADJUSTMENTS_PER_HOUR - adjustmentsInLastHour);

    // Calcular próximo horário disponível se não pode ajustar
    let nextAvailableTime: string | undefined;
    if (!canAdjust && logs && logs.length > 0) {
      const oldestAdjustment = logs.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      nextAvailableTime = new Date(
        new Date(oldestAdjustment.created_at).getTime() + 60 * 60 * 1000
      ).toISOString();
    }

    return {
      success: true,
      can_adjust: canAdjust,
      adjustments_in_last_hour: adjustmentsInLastHour,
      remaining_adjustments: remainingAdjustments,
      next_available_time: nextAvailableTime
    };
  } catch (error) {
    console.error('Error in validateBudgetAdjustmentFrequency:', error);
    return {
      success: false,
      can_adjust: false,
      adjustments_in_last_hour: 0,
      remaining_adjustments: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria um log de ajuste de budget
 */
export async function createBudgetAdjustmentLog(
  request: CreateBudgetAdjustmentLogRequest
): Promise<CreateBudgetAdjustmentLogResponse> {
  try {
    // Validar frequência primeiro
    const validation = await validateBudgetAdjustmentFrequency({
      adset_id: request.adset_id
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        can_proceed: false
      };
    }

    // Calcular valores derivados
    const adjustmentAmount = request.new_budget - request.old_budget;
    const adjustmentPercentage = request.old_budget > 0 
      ? (adjustmentAmount / request.old_budget) * 100 
      : 0;

    // Criar registro
    const logData = {
      adset_id: request.adset_id,
      campaign_id: request.campaign_id,
      old_budget: request.old_budget,
      new_budget: request.new_budget,
      adjustment_amount: adjustmentAmount,
      adjustment_percentage: adjustmentPercentage,
      reason: request.reason,
      trigger_type: request.trigger_type,
      context: request.context,
      user_id: request.user_id,
      applied_by: request.applied_by,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('budget_adjustment_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      console.error('Error creating budget adjustment log:', error);
      return {
        success: false,
        error: error.message,
        can_proceed: false
      };
    }

    return {
      success: true,
      log_id: data.id,
      can_proceed: validation.can_adjust
    };
  } catch (error) {
    console.error('Error in createBudgetAdjustmentLog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      can_proceed: false
    };
  }
}

/**
 * Atualiza status de um log de ajuste
 */
export async function updateBudgetAdjustmentLog(
  request: UpdateBudgetAdjustmentLogRequest
): Promise<UpdateBudgetAdjustmentLogResponse> {
  try {
    const updateData: any = {
      status: request.status
    };

    if (request.applied_at) {
      updateData.applied_at = request.applied_at;
    } else if (request.status === 'applied') {
      updateData.applied_at = new Date().toISOString();
    }

    if (request.error_message) {
      updateData.error_message = request.error_message;
    }

    if (request.meta_response) {
      updateData.meta_response = request.meta_response;
    }

    const { data, error } = await supabase
      .from('budget_adjustment_logs')
      .update(updateData)
      .eq('id', request.log_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget adjustment log:', error);
      return {
        success: false,
        error: error.message,
        updated: {} as BudgetAdjustmentLog
      };
    }

    return {
      success: true,
      updated: data as BudgetAdjustmentLog
    };
  } catch (error) {
    console.error('Error in updateBudgetAdjustmentLog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      updated: {} as BudgetAdjustmentLog
    };
  }
}

/**
 * Busca logs de ajustes com filtros
 */
export async function getBudgetAdjustmentLogs(
  query: BudgetAdjustmentLogsQuery
): Promise<BudgetAdjustmentLogsResponse> {
  try {
    let supabaseQuery = supabase.from('budget_adjustment_logs').select('*');

    // Aplicar filtros
    if (query.adset_id) {
      supabaseQuery = supabaseQuery.eq('adset_id', query.adset_id);
    }

    if (query.campaign_id) {
      supabaseQuery = supabaseQuery.eq('campaign_id', query.campaign_id);
    }

    if (query.user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
    }

    if (query.status && query.status.length > 0) {
      supabaseQuery = supabaseQuery.in('status', query.status);
    }

    if (query.trigger_type && query.trigger_type.length > 0) {
      supabaseQuery = supabaseQuery.in('trigger_type', query.trigger_type);
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('created_at', query.end_date);
    }

    // Ordenação
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginação
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching budget adjustment logs:', error);
      return {
        success: false,
        count: 0,
        logs: [],
        error: error.message
      };
    }

    return {
      success: true,
      count: data?.length || 0,
      total_count: count || undefined,
      logs: (data as BudgetAdjustmentLog[]) || []
    };
  } catch (error) {
    console.error('Error in getBudgetAdjustmentLogs:', error);
    return {
      success: false,
      count: 0,
      logs: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Busca estatísticas de ajustes para um adset
 */
export async function getBudgetAdjustmentStats(
  adset_id: string,
  period_hours: number = 24
): Promise<BudgetAdjustmentStats | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_budget_adjustment_stats', {
        p_adset_id: adset_id,
        p_period_hours: period_hours
      });

    if (error) {
      console.error('Error fetching budget adjustment stats:', error);
      return null;
    }

    return data as BudgetAdjustmentStats;
  } catch (error) {
    console.error('Error in getBudgetAdjustmentStats:', error);
    return null;
  }
}

/**
 * Função utilitária para criar contexto de ajuste
 */
export function createAdjustmentContext(data: {
  current_cpl?: number;
  target_cpl?: number;
  leads_generated?: number;
  progress_percentage?: number;
  days_remaining?: number;
  alerts?: string[];
  performance_metrics?: any;
  additional_data?: Record<string, any>;
}): BudgetAdjustmentContext {
  return {
    current_cpl: data.current_cpl,
    target_cpl: data.target_cpl,
    leads_generated: data.leads_generated,
    progress_percentage: data.progress_percentage,
    days_remaining: data.days_remaining,
    alerts: data.alerts,
    performance_metrics: data.performance_metrics,
    additional_data: data.additional_data
  };
}

/**
 * Função para criar log de ajuste automático
 */
export async function logAutomaticBudgetAdjustment(
  adset_id: string,
  campaign_id: string,
  old_budget: number,
  new_budget: number,
  reason: string,
  context: BudgetAdjustmentContext
): Promise<CreateBudgetAdjustmentLogResponse> {
  return createBudgetAdjustmentLog({
    adset_id,
    campaign_id,
    old_budget,
    new_budget,
    reason,
    trigger_type: 'automatic',
    context,
    applied_by: 'system'
  });
}

/**
 * Função para criar log de ajuste manual
 */
export async function logManualBudgetAdjustment(
  adset_id: string,
  campaign_id: string,
  old_budget: number,
  new_budget: number,
  reason: string,
  user_id: string,
  context?: BudgetAdjustmentContext
): Promise<CreateBudgetAdjustmentLogResponse> {
  return createBudgetAdjustmentLog({
    adset_id,
    campaign_id,
    old_budget,
    new_budget,
    reason,
    trigger_type: 'manual',
    context,
    user_id,
    applied_by: user_id
  });
} 