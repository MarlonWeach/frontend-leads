// API Route: budget-adjustments/apply
// PBI 25 - Task 25-9: Integração Meta API para Ajustes de Budget

import { NextRequest, NextResponse } from 'next/server';
import budgetAdjustmentEngine from '@/services/budgetAdjustmentEngine';
import { ApplyBudgetAdjustmentRequest } from '@/types/metaBudgetAdjustment';

export async function POST(request: NextRequest) {
  try {
    const body: ApplyBudgetAdjustmentRequest = await request.json();
    
    // Validações básicas
    if (!body.adset_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'adset_id é obrigatório'
        },
        { status: 400 }
      );
    }

    if (typeof body.new_budget !== 'number' || body.new_budget <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'new_budget deve ser um número positivo'
        },
        { status: 400 }
      );
    }

    if (!body.budget_type || !['daily', 'lifetime'].includes(body.budget_type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'budget_type deve ser "daily" ou "lifetime"'
        },
        { status: 400 }
      );
    }

    if (!body.reason || body.reason.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'reason é obrigatório'
        },
        { status: 400 }
      );
    }

    console.log(`[Apply API] Processing budget adjustment request for adset ${body.adset_id}`);

    // Aplicar ajuste usando o motor
    const result = await budgetAdjustmentEngine.applyBudgetAdjustment(body);
    
    // Determinar status HTTP baseado no resultado
    const statusCode = result.success ? 200 : 
                      result.validation_result && !result.validation_result.can_adjust ? 429 : // Too Many Requests
                      400; // Bad Request

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Error in budget adjustment apply API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 