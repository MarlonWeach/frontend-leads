// API Route: /api/goals/[adset_id]
// PBI 25 - Task 25-1: Interface de configuração de metas por adset
// Purpose: CRUD operations for specific adset goal

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { 
  AdsetGoalInput, 
  GoalApiResponse,
  GOAL_CONSTANTS 
} from '@/types/goals';

// GET /api/goals/[adset_id] - Get specific goal
export async function GET(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    const { searchParams } = new URL(request.url);
    const includeCalculations = searchParams.get('calculations') === 'true';

    const { data, error } = await supabase
      .from('adset_goals')
      .select('*')
      .eq('adset_id', adset_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return NextResponse.json({
          success: false,
          error: 'Goal not found'
        }, { status: 404 });
      }

      console.error('Error fetching goal:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch goal'
      }, { status: 500 });
    }

    let calculations;
    if (includeCalculations) {
      calculations = calculateGoalMetrics(data);
    }

    const response: GoalApiResponse = {
      success: true,
      data,
      calculations
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/goals/[adset_id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/goals/[adset_id] - Update specific goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    const body: Partial<AdsetGoalInput> = await request.json();

    // Ensure adset_id matches
    if (body.adset_id && body.adset_id !== adset_id) {
      return NextResponse.json({
        success: false,
        error: 'Adset ID mismatch'
      }, { status: 400 });
    }

    // Check if goal exists
    const { data: existingGoal, error: fetchError } = await supabase
      .from('adset_goals')
      .select('*')
      .eq('adset_id', adset_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Goal not found'
        }, { status: 404 });
      }

      console.error('Error fetching existing goal:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch existing goal'
      }, { status: 500 });
    }

    // Merge with existing data
    const updatedData = {
      ...existingGoal,
      ...body,
      adset_id, // Ensure adset_id is preserved
      updated_at: new Date().toISOString()
    };

    // Validate merged data
    const validation = validateGoalInput(updatedData);
    if (!validation.is_valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validation
      }, { status: 400 });
    }

    // Update goal
    const { data, error } = await supabase
      .from('adset_goals')
      .update(updatedData)
      .eq('adset_id', adset_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update goal'
      }, { status: 500 });
    }

    const calculations = calculateGoalMetrics(data);

    const response: GoalApiResponse = {
      success: true,
      data,
      calculations,
      validation
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PUT /api/goals/[adset_id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/goals/[adset_id] - Delete specific goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;

    // Check if goal exists
    const { data: existingGoal, error: fetchError } = await supabase
      .from('adset_goals')
      .select('id')
      .eq('adset_id', adset_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Goal not found'
        }, { status: 404 });
      }

      console.error('Error fetching goal for deletion:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch goal'
      }, { status: 500 });
    }

    // Delete goal
    const { error } = await supabase
      .from('adset_goals')
      .delete()
      .eq('adset_id', adset_id);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete goal'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/goals/[adset_id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper functions (shared with main route)
function validateGoalInput(input: any) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!input.adset_id) {
    errors.push({
      field: 'adset_id',
      message: 'Adset ID é obrigatório',
      code: 'REQUIRED'
    });
  }

  // Budget validation
  if (!input.budget_total || input.budget_total <= 0) {
    errors.push({
      field: 'budget_total',
      message: 'Budget deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  } else if (input.budget_total < GOAL_CONSTANTS.MIN_BUDGET) {
    warnings.push({
      field: 'budget_total',
      message: `Budget muito baixo. Mínimo recomendado: R$ ${GOAL_CONSTANTS.MIN_BUDGET}`,
      code: 'LOW_BUDGET',
      severity: 'medium'
    });
  }

  // CPL validation
  if (!input.cpl_target || input.cpl_target <= 0) {
    errors.push({
      field: 'cpl_target',
      message: 'CPL alvo deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  } else if (input.cpl_target < GOAL_CONSTANTS.MIN_CPL) {
    warnings.push({
      field: 'cpl_target',
      message: `CPL muito baixo. Pode ser impossível de atingir.`,
      code: 'UNREALISTIC_CPL',
      severity: 'high'
    });
  }

  // Volume validation
  if (!input.volume_contracted || input.volume_contracted <= 0) {
    errors.push({
      field: 'volume_contracted',
      message: 'Volume contratado deve ser maior que zero',
      code: 'INVALID_VALUE'
    });
  }

  if (input.volume_captured < 0) {
    errors.push({
      field: 'volume_captured',
      message: 'Volume captado não pode ser negativo',
      code: 'INVALID_VALUE'
    });
  }

  if (input.volume_captured > input.volume_contracted) {
    errors.push({
      field: 'volume_captured',
      message: 'Volume captado não pode ser maior que o contratado',
      code: 'INVALID_VALUE'
    });
  }

  // Date validation
  const startDate = new Date(input.contract_start_date);
  const endDate = new Date(input.contract_end_date);

  if (isNaN(startDate.getTime())) {
    errors.push({
      field: 'contract_start_date',
      message: 'Data de início inválida',
      code: 'INVALID_DATE'
    });
  }

  if (isNaN(endDate.getTime())) {
    errors.push({
      field: 'contract_end_date',
      message: 'Data de fim inválida',
      code: 'INVALID_DATE'
    });
  }

  if (startDate >= endDate) {
    errors.push({
      field: 'contract_end_date',
      message: 'Data de fim deve ser posterior à data de início',
      code: 'INVALID_DATE_RANGE'
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

function calculateGoalMetrics(goal: any) {
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
  const isOnTrack = progressPercentage >= (timeProgressPercentage - 10);

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