// API Route: /api/goals/calculate
// PBI 25 - Task 25-2: Sistema de cálculo de leads necessários por dia
// Purpose: Generic calculations endpoint for on-demand calculations

import { NextRequest, NextResponse } from 'next/server';
import { LeadsCalculationService } from '../../../../src/services/LeadsCalculationService';
import { 
  CalculationRequest, 
  CalculationResponse,
  ProjectionScenario 
} from '../../../../src/types/calculations';

export const dynamic = 'force-dynamic';

// POST /api/goals/calculate - Perform calculations on demand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle single adset calculation
    if (body.adset_id) {
      return await calculateSingleAdset(body);
    }
    
    // Handle multiple adsets calculation
    if (body.adset_ids && Array.isArray(body.adset_ids)) {
      return await calculateMultipleAdsets(body);
    }
    
    // Handle batch calculation with filters
    if (body.batch_criteria) {
      return await calculateBatch(body);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid request format. Provide adset_id, adset_ids array, or batch_criteria'
    }, { status: 400 });

  } catch (error) {
    console.error('POST /api/goals/calculate error:', error);
    
    const response: CalculationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Calculate for single adset
 */
async function calculateSingleAdset(body: any): Promise<NextResponse> {
  const {
    adset_id,
    include_projections = false,
    include_historical = true,
    projection_days = 30,
    scenario = 'realistic'
  } = body;

  if (!adset_id) {
    return NextResponse.json({
      success: false,
      error: 'adset_id is required'
    }, { status: 400 });
  }

  const calculationRequest: CalculationRequest = {
    adset_id,
    include_projections,
    include_historical,
    projection_days,
    scenario: scenario as ProjectionScenario
  };

  const startTime = Date.now();
  const result = await LeadsCalculationService.calculateLeadsRequirement(calculationRequest);
  const calculationTime = Date.now() - startTime;

  const response: CalculationResponse = {
    success: true,
    data: result,
    calculation_time_ms: calculationTime,
    cached: false
  };

  return NextResponse.json(response);
}

/**
 * Calculate for multiple adsets
 */
async function calculateMultipleAdsets(body: any): Promise<NextResponse> {
  const {
    adset_ids,
    include_projections = false,
    include_historical = true,
    projection_days = 30,
    scenario = 'realistic',
    parallel = true
  } = body;

  if (!Array.isArray(adset_ids) || adset_ids.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'adset_ids must be a non-empty array'
    }, { status: 400 });
  }

  if (adset_ids.length > 50) {
    return NextResponse.json({
      success: false,
      error: 'Maximum 50 adsets per batch calculation'
    }, { status: 400 });
  }

  const startTime = Date.now();
  const results = [];
  const errors = [];

  if (parallel) {
    // Parallel calculation for better performance
    const promises = adset_ids.map(async (adsetId: string) => {
      try {
        const calculationRequest: CalculationRequest = {
          adset_id: adsetId,
          include_projections,
          include_historical,
          projection_days,
          scenario: scenario as ProjectionScenario
        };

        const result = await LeadsCalculationService.calculateLeadsRequirement(calculationRequest);
        return { adset_id: adsetId, result, error: null };
      } catch (error) {
        return { 
          adset_id: adsetId, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ adset_id, result, error }) => {
      if (error) {
        errors.push({ adset_id, error });
      } else {
        results.push({ adset_id, result });
      }
    });

  } else {
    // Sequential calculation (safer but slower)
    for (const adsetId of adset_ids) {
      try {
        const calculationRequest: CalculationRequest = {
          adset_id: adsetId,
          include_projections,
          include_historical,
          projection_days,
          scenario: scenario as ProjectionScenario
        };

        const result = await LeadsCalculationService.calculateLeadsRequirement(calculationRequest);
        results.push({ adset_id: adsetId, result });
      } catch (error) {
        errors.push({ 
          adset_id: adsetId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  const calculationTime = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    data: {
      results,
      errors,
      summary: {
        total_requested: adset_ids.length,
        successful: results.length,
        failed: errors.length,
        calculation_time_ms: calculationTime
      }
    }
  });
}

/**
 * Calculate batch with criteria filters
 */
async function calculateBatch(body: any): Promise<NextResponse> {
  const {
    batch_criteria,
    include_projections = false,
    include_historical = true,
    projection_days = 30,
    scenario = 'realistic'
  } = body;

  // This would be used to calculate for adsets matching certain criteria
  // For example: all adsets with goals, active adsets, adsets behind schedule, etc.
  
  try {
    // TODO: Implement batch criteria filtering
    // For now, return error as this feature is not yet implemented
    
    return NextResponse.json({
      success: false,
      error: 'Batch calculation with criteria is not yet implemented'
    }, { status: 501 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch calculation'
    }, { status: 500 });
  }
}

// GET /api/goals/calculate - Get available calculation options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'options';

    if (format === 'options') {
      // Return available calculation options and parameters
      return NextResponse.json({
        success: true,
        data: {
          endpoints: {
            single_adset: {
              method: 'POST',
              required_fields: ['adset_id'],
              optional_fields: ['include_projections', 'include_historical', 'projection_days', 'scenario']
            },
            multiple_adsets: {
              method: 'POST',
              required_fields: ['adset_ids'],
              optional_fields: ['include_projections', 'include_historical', 'projection_days', 'scenario', 'parallel'],
              limits: {
                max_adsets: 50
              }
            },
            batch_criteria: {
              method: 'POST',
              required_fields: ['batch_criteria'],
              optional_fields: ['include_projections', 'include_historical', 'projection_days', 'scenario'],
              status: 'not_implemented'
            }
          },
          parameters: {
            include_projections: {
              type: 'boolean',
              default: false,
              description: 'Include future projections in calculations'
            },
            include_historical: {
              type: 'boolean',
              default: true,
              description: 'Include historical performance analysis'
            },
            projection_days: {
              type: 'number',
              default: 30,
              min: 1,
              max: 90,
              description: 'Number of days to project into future'
            },
            scenario: {
              type: 'string',
              default: 'realistic',
              options: ['optimistic', 'realistic', 'pessimistic', 'current_trend'],
              description: 'Projection scenario type'
            }
          }
        }
      });
    }

    if (format === 'stats') {
      // Return calculation statistics
      // TODO: Implement calculation statistics
      return NextResponse.json({
        success: true,
        data: {
          total_calculations: 0,
          avg_calculation_time_ms: 0,
          cache_hit_rate: 0,
          error_rate: 0
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid format parameter. Use "options" or "stats"'
    }, { status: 400 });

  } catch (error) {
    console.error('GET /api/goals/calculate error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get calculation information'
    }, { status: 500 });
  }
} 