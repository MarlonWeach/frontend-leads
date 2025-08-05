// Service: budgetAdjustmentService.ts
// PBI 25 - Task 25-4: Sistema de ajuste de budget com regras de 20%

import { supabase } from '../lib/supabaseClient';
import {
  BudgetAdjustmentRequest,
  BudgetAdjustmentResponse,
  BudgetAdjustmentLog,
  BudgetAdjustmentValidation,
  BudgetAdjustmentReason,
  BudgetAdjustmentStatus
} from '../types/budget';

const MAX_PERCENT = 20;
const MAX_ADJUSTMENTS_PER_HOUR = 4;
const ALLOWED_REASONS: BudgetAdjustmentReason[] = ['atraso_meta', 'estrategia', 'correcao_erro', 'manual'];

export async function validateBudgetAdjustment(
  req: BudgetAdjustmentRequest
): Promise<BudgetAdjustmentValidation> {
  const errors: string[] = [];
  if (!ALLOWED_REASONS.includes(req.reason)) {
    errors.push('Motivo não permitido');
  }
  if (!req.user_id) {
    errors.push('Usuário não autenticado');
  }
  if (req.suggested_budget <= 0) {
    errors.push('Novo budget deve ser maior que zero');
  }
  const maxAllowed = req.current_budget * 1.2;
  if (req.suggested_budget > maxAllowed) {
    errors.push('Ajuste acima do limite de 20%');
  }
  // Verificar frequência
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await supabase
    .from('adset_budget_adjustments')
    .select('id')
    .eq('adset_id', req.adset_id)
    .gte('timestamp', since);
  const adjustmentsLastHour = recent ? recent.length : 0;
  if (adjustmentsLastHour >= MAX_ADJUSTMENTS_PER_HOUR) {
    errors.push('Limite de 4 ajustes por hora atingido');
  }
  return {
    is_valid: errors.length === 0,
    blocked: adjustmentsLastHour >= MAX_ADJUSTMENTS_PER_HOUR || req.suggested_budget > maxAllowed,
    reason: errors.join('; '),
    max_allowed_budget: maxAllowed,
    adjustments_last_hour: adjustmentsLastHour,
    errors
  };
}

export async function applyBudgetAdjustment(
  req: BudgetAdjustmentRequest
): Promise<BudgetAdjustmentResponse> {
  const validation = await validateBudgetAdjustment(req);
  if (!validation.is_valid) {
    return {
      success: false,
      blocked: validation.blocked,
      error: validation.reason
    };
  }
  const percentChange = ((req.suggested_budget - req.current_budget) / req.current_budget) * 100;
  // Registrar ajuste
  const { data, error } = await supabase
    .from('adset_budget_adjustments')
    .insert({
      adset_id: req.adset_id,
      old_budget: req.current_budget,
      new_budget: req.suggested_budget,
      percent_change: percentChange,
      user_id: req.user_id,
      reason: req.reason,
      status: 'success',
      message: '',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) {
    return { success: false, error: error.message };
  }
  return {
    success: true,
    log: data as BudgetAdjustmentLog
  };
}

export async function getBudgetAdjustmentLogs(
  adset_id: string
): Promise<BudgetAdjustmentLog[]> {
  const { data, error } = await supabase
    .from('adset_budget_adjustments')
    .select('*')
    .eq('adset_id', adset_id)
    .order('timestamp', { ascending: false });
  if (error) return [];
  return data || [];
} 