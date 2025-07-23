// API Route: /api/goals/[adset_id]/budget/adjust
// PBI 25 - Task 25-4: Aplicação manual de ajuste de budget (máx 20%)

import { NextRequest, NextResponse } from 'next/server';
import { applyBudgetAdjustment } from '@/services/budgetAdjustmentService';
import { BudgetAdjustmentRequest } from '@/types/budget';

// POST /api/goals/[adset_id]/budget/adjust
export async function POST(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    if (!adset_id) {
      return NextResponse.json({ success: false, error: 'adset_id is required' }, { status: 400 });
    }
    const body = await request.json();
    const { current_budget, suggested_budget, user_id, reason } = body;
    if (!current_budget || !suggested_budget || !user_id || !reason) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios: current_budget, suggested_budget, user_id, reason' }, { status: 400 });
    }
    const req: BudgetAdjustmentRequest = {
      adset_id,
      current_budget: Number(current_budget),
      suggested_budget: Number(suggested_budget),
      user_id: String(user_id),
      reason
    };
    const result = await applyBudgetAdjustment(req);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, blocked: result.blocked }, { status: result.blocked ? 429 : 400 });
    }
    return NextResponse.json({ success: true, log: result.log });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 