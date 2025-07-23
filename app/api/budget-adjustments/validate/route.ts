// API Route: budget-adjustments/validate
// PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes

import { NextRequest, NextResponse } from 'next/server';
import { validateBudgetAdjustmentFrequency } from '@/services/budgetAdjustmentLogService';
import { ValidateBudgetAdjustmentRequest } from '@/types/budgetAdjustmentLogs';

export async function POST(request: NextRequest) {
  try {
    const body: ValidateBudgetAdjustmentRequest = await request.json();
    
    if (!body.adset_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'adset_id é obrigatório',
          can_adjust: false,
          adjustments_in_last_hour: 0,
          remaining_adjustments: 0
        },
        { status: 400 }
      );
    }

    const result = await validateBudgetAdjustmentFrequency(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in budget adjustment validation API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        can_adjust: false,
        adjustments_in_last_hour: 0,
        remaining_adjustments: 0,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 