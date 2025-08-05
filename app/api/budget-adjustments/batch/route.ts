// API Route: budget-adjustments/batch
// PBI 25 - Task 25-9: Integração Meta API para Ajustes de Budget

import { NextRequest, NextResponse } from 'next/server';
import budgetAdjustmentEngine from '../../../../src/services/budgetAdjustmentEngine';
import { BatchBudgetAdjustmentRequest } from '../../../../src/types/metaBudgetAdjustment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: BatchBudgetAdjustmentRequest = await request.json();
    
    // Validações básicas
    if (!body.adjustments || !Array.isArray(body.adjustments) || body.adjustments.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          total_requested: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          results: [],
          error: 'adjustments deve ser um array não vazio'
        },
        { status: 400 }
      );
    }

    // Validar cada ajuste no lote
    const validationErrors: string[] = [];
    body.adjustments.forEach((adjustment, index) => {
      if (!adjustment.adset_id) {
        validationErrors.push(`Ajuste ${index + 1}: adset_id é obrigatório`);
      }
      
      if (typeof adjustment.new_budget !== 'number' || adjustment.new_budget <= 0) {
        validationErrors.push(`Ajuste ${index + 1}: new_budget deve ser um número positivo`);
      }
      
      if (!adjustment.budget_type || !['daily', 'lifetime'].includes(adjustment.budget_type)) {
        validationErrors.push(`Ajuste ${index + 1}: budget_type deve ser "daily" ou "lifetime"`);
      }
      
      if (!adjustment.reason || adjustment.reason.trim().length === 0) {
        validationErrors.push(`Ajuste ${index + 1}: reason é obrigatório`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          total_requested: body.adjustments.length,
          successful: 0,
          failed: 0,
          skipped: 0,
          results: [],
          error: `Erros de validação: ${validationErrors.join('; ')}`
        },
        { status: 400 }
      );
    }

    // Validar limites
    if (body.adjustments.length > 50) {
      return NextResponse.json(
        { 
          success: false,
          total_requested: body.adjustments.length,
          successful: 0,
          failed: 0,
          skipped: 0,
          results: [],
          error: 'Máximo de 50 ajustes por lote'
        },
        { status: 400 }
      );
    }

    if (body.max_concurrent && (body.max_concurrent < 1 || body.max_concurrent > 10)) {
      return NextResponse.json(
        { 
          success: false,
          total_requested: body.adjustments.length,
          successful: 0,
          failed: 0,
          skipped: 0,
          results: [],
          error: 'max_concurrent deve estar entre 1 e 10'
        },
        { status: 400 }
      );
    }

    console.log(`[Batch API] Processing ${body.adjustments.length} budget adjustments`);

    // Aplicar ajustes em lote usando o motor
    const result = await budgetAdjustmentEngine.applyBatchBudgetAdjustments(body);
    
    // Status baseado no resultado geral
    const statusCode = result.successful > 0 ? 200 : 
                      result.failed > 0 ? 207 : // Multi-Status
                      400; // Bad Request

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Error in budget adjustment batch API:', error);
    return NextResponse.json(
      { 
        success: false,
        total_requested: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET para consultar status de lotes em andamento (futuro)
export async function GET(request: NextRequest) {
  try {
    // Por enquanto, retornar não implementado
    return NextResponse.json(
      { 
        success: false,
        error: 'Consulta de status de lotes não implementada ainda'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error in budget adjustment batch GET API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
} 