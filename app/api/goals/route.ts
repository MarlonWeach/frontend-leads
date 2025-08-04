// API Route: /api/goals
// PBI 25 - Task 25-1: Interface de configuração de metas por adset
// Purpose: CRUD operations for adset goals

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '../../lib/supabaseServer';
import { 
  AdsetGoal, 
  AdsetGoalInput, 
  GoalCalculations, 
  GoalValidation,
  GoalApiResponse,
  GoalsListResponse,
  GOAL_CONSTANTS 
} from '@/types/goals';

// GET /api/goals - List all goals or filter by adset_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adsetId = searchParams.get('adset_id');
    const includeCalculations = searchParams.get('calculations') === 'true';

    let query = supabase
      .from('adset_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (adsetId) {
      query = query.eq('adset_id', adsetId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch goals'
      }, { status: 500 });
    }

    // Add calculations if requested
    let goalsWithCalculations = data;
    if (includeCalculations && data) {
      goalsWithCalculations = data.map(goal => ({
        ...goal,
        calculations: calculateGoalMetrics(goal)
      }));
    }

    const response: GoalsListResponse = {
      success: true,
      data: goalsWithCalculations,
      total: data?.length || 0
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/goals - Create or update goal
export async function POST(request: NextRequest) {
  try {
    const body: AdsetGoalInput = await request.json();

    // Validate input
    const validation = validateGoalInput(body);
    if (!validation.is_valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validation
      }, { status: 400 });
    }

    // Check if goal already exists for this adset
    const { data: existingGoal } = await supabase
      .from('adset_goals')
      .select('id')
      .eq('adset_id', body.adset_id)
      .single();

    let result;
    if (existingGoal) {
      // Update existing goal
      const { data, error } = await supabase
        .from('adset_goals')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('adset_id', body.adset_id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new goal
      const { data, error } = await supabase
        .from('adset_goals')
        .insert([body])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving goal:', result.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save goal'
      }, { status: 500 });
    }

    const calculations = calculateGoalMetrics(result.data);
    
    const response: GoalApiResponse = {
      success: true,
      data: result.data,
      calculations,
      validation
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('POST /api/goals error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function to validate goal input
function validateGoalInput(input: AdsetGoalInput): GoalValidation {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!input.adset_id) {
    errors.push({
      field: 'adset_id' as keyof AdsetGoalInput,
      message: 'Adset ID é obrigatório',
      code: 'REQUIRED'
    });
  }

  // Budget validation
  if (!input.budget_total || input.budget_total <= 0) {
    errors.push({
      field: 'budget_total' as keyof AdsetGoalInput,
      message: 'Budget deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  } else if (input.budget_total < GOAL_CONSTANTS.MIN_BUDGET) {
    warnings.push({
      field: 'budget_total' as keyof AdsetGoalInput,
      message: `Budget muito baixo. Mínimo recomendado: R$ ${GOAL_CONSTANTS.MIN_BUDGET}`,
      code: 'LOW_BUDGET',
      severity: 'medium' as const
    });
  } else if (input.budget_total > GOAL_CONSTANTS.MAX_BUDGET) {
    warnings.push({
      field: 'budget_total' as keyof AdsetGoalInput,
      message: `Budget muito alto. Máximo recomendado: R$ ${GOAL_CONSTANTS.MAX_BUDGET}`,
      code: 'HIGH_BUDGET',
      severity: 'low' as const
    });
  }

  // CPL validation
  if (!input.cpl_target || input.cpl_target <= 0) {
    errors.push({
      field: 'cpl_target' as keyof AdsetGoalInput,
      message: 'CPL alvo deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  } else if (input.cpl_target < GOAL_CONSTANTS.MIN_CPL) {
    warnings.push({
      field: 'cpl_target' as keyof AdsetGoalInput,
      message: `CPL muito baixo. Pode ser impossível de atingir.`,
      code: 'UNREALISTIC_CPL',
      severity: 'high' as const
    });
  }

  // Volume validation
  if (!input.volume_contracted || input.volume_contracted <= 0) {
    errors.push({
      field: 'volume_contracted' as keyof AdsetGoalInput,
      message: 'Volume contratado deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  }

  if (input.volume_captured < 0) {
    errors.push({
      field: 'volume_captured' as keyof AdsetGoalInput,
      message: 'Volume captado não pode ser negativo',
      code: 'INVALID_VALUE'
    });
  }

  if (input.volume_captured > input.volume_contracted) {
    errors.push({
      field: 'volume_captured' as keyof AdsetGoalInput,
      message: 'Volume captado não pode ser maior que o contratado',
      code: 'INVALID_VALUE'
    });
  }

  // Date validation
  const startDate = new Date(input.contract_start_date);
  const endDate = new Date(input.contract_end_date);
  const today = new Date();

  if (isNaN(startDate.getTime())) {
    errors.push({
      field: 'contract_start_date' as keyof AdsetGoalInput,
      message: 'Data de início inválida',
      code: 'INVALID_DATE'
    });
  }

  if (isNaN(endDate.getTime())) {
    errors.push({
      field: 'contract_end_date' as keyof AdsetGoalInput,
      message: 'Data de fim inválida',
      code: 'INVALID_DATE'
    });
  }

  if (startDate >= endDate) {
    errors.push({
      field: 'contract_end_date' as keyof AdsetGoalInput,
      message: 'Data de fim deve ser posterior à data de início',
      code: 'INVALID_DATE_RANGE'
    });
  }

  // Business logic validation
  if (errors.length === 0) {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays < GOAL_CONSTANTS.MIN_CONTRACT_DAYS) {
      warnings.push({
        field: 'general' as const,
        message: `Período muito curto (${totalDays} dias). Mínimo recomendado: ${GOAL_CONSTANTS.MIN_CONTRACT_DAYS} dias`,
        code: 'SHORT_PERIOD',
        severity: 'medium' as const
      });
    }

    // Check if target is realistic
    const leadsPerDay = (input.volume_contracted - input.volume_captured) / totalDays;
    const budgetPerDay = input.budget_total / totalDays;
    const impliedCPL = budgetPerDay / leadsPerDay;

    if (impliedCPL > input.cpl_target * 1.5) {
      warnings.push({
        field: 'general' as const,
        message: `Meta pode ser impossível: CPL implícito (R$ ${impliedCPL.toFixed(2)}) muito acima do alvo`,
        code: 'IMPOSSIBLE_TARGET',
        severity: 'high' as const
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

// Helper function to calculate goal metrics
function calculateGoalMetrics(goal: AdsetGoal): GoalCalculations {
  const today = new Date();
  const startDate = new Date(goal.contract_start_date);
  const endDate = new Date(goal.contract_end_date);

  const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const leadsNeededTotal = goal.volume_contracted - goal.volume_captured;
  const leadsNeededDaily = daysRemaining > 0 ? leadsNeededTotal / daysRemaining : 0;

  const budgetDaily = goal.budget_total / daysTotal;
  const budgetSpentEstimated = budgetDaily * daysElapsed;
  const budgetRemaining = goal.budget_total - budgetSpentEstimated;

  const progressPercentage = (goal.volume_captured / goal.volume_contracted) * 100;
  const timeProgressPercentage = (daysElapsed / daysTotal) * 100;
  const isOnTrack = progressPercentage >= (timeProgressPercentage - 10); // 10% tolerance

  const projectedFinalVolume = daysRemaining > 0 
    ? goal.volume_captured + (leadsNeededDaily * daysRemaining)
    : goal.volume_captured;

  const cplCurrentEstimated = goal.volume_captured > 0 
    ? budgetSpentEstimated / goal.volume_captured 
    : goal.cpl_target;

  return {
    days_total: daysTotal,
    days_remaining: daysRemaining,
    days_elapsed: daysElapsed,
    leads_needed_total: leadsNeededTotal,
    leads_needed_daily: leadsNeededDaily,
    budget_daily: budgetDaily,
    budget_remaining: budgetRemaining,
    budget_spent_estimated: budgetSpentEstimated,
    progress_percentage: progressPercentage,
    is_on_track: isOnTrack,
    projected_final_volume: projectedFinalVolume,
    cpl_current_estimated: cplCurrentEstimated
  };
} 