// API Route: /api/goals/[adset_id]/calculations
// PBI 25 - Task 25-2: Sistema de cálculo de leads necessários por dia
// Purpose: Detailed calculations endpoint for specific adset

import { NextRequest, NextResponse } from 'next/server';
import { LeadsCalculationService } from '@/services/LeadsCalculationService';
import { 
  CalculationRequest, 
  CalculationResponse,
  ProjectionScenario 
} from '@/types/calculations';

// GET /api/goals/[adset_id]/calculations - Get detailed calculations
export async function GET(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const includeProjections = searchParams.get('projections') === 'true';
    const includeHistorical = searchParams.get('historical') !== 'false'; // Default true
    const projectionDays = parseInt(searchParams.get('projection_days') || '30');
    const scenario = (searchParams.get('scenario') as ProjectionScenario) || 'realistic';

    // Validate parameters
    if (!adset_id) {
      return NextResponse.json({
        success: false,
        error: 'Adset ID is required'
      }, { status: 400 });
    }

    if (projectionDays < 1 || projectionDays > 90) {
      return NextResponse.json({
        success: false,
        error: 'Projection days must be between 1 and 90'
      }, { status: 400 });
    }

    // Build calculation request
    const calculationRequest: CalculationRequest = {
      adset_id,
      include_projections: includeProjections,
      include_historical: includeHistorical,
      projection_days: projectionDays,
      scenario
    };

    // Perform calculation
    const startTime = Date.now();
    const result = await LeadsCalculationService.calculateLeadsRequirement(calculationRequest);
    const calculationTime = Date.now() - startTime;

    // Build response
    const response: CalculationResponse = {
      success: true,
      data: result,
      calculation_time_ms: calculationTime,
      cached: false // TODO: Implement cache detection
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/goals/[adset_id]/calculations error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const response: CalculationResponse = {
      success: false,
      error: errorMessage
    };

    // Return appropriate status code based on error type
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    return NextResponse.json(response, { status: statusCode });
  }
}

// POST /api/goals/[adset_id]/calculations - Force recalculation (bypass cache)
export async function POST(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    const body = await request.json().catch(() => ({}));
    
    // Parse request body
    const includeProjections = body.include_projections ?? false;
    const includeHistorical = body.include_historical ?? true;
    const projectionDays = body.projection_days ?? 30;
    const scenario = body.scenario ?? 'realistic';

    // Validate parameters
    if (!adset_id) {
      return NextResponse.json({
        success: false,
        error: 'Adset ID is required'
      }, { status: 400 });
    }

    // Build calculation request
    const calculationRequest: CalculationRequest = {
      adset_id,
      include_projections: includeProjections,
      include_historical: includeHistorical,
      projection_days: projectionDays,
      scenario
    };

    // Force fresh calculation (clear cache first if needed)
    // TODO: Implement cache invalidation method
    
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

  } catch (error) {
    console.error('POST /api/goals/[adset_id]/calculations error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const response: CalculationResponse = {
      success: false,
      error: errorMessage
    };

    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    return NextResponse.json(response, { status: statusCode });
  }
}

// PUT /api/goals/[adset_id]/calculations - Update calculation parameters
export async function PUT(
  request: NextRequest,
  { params }: { params: { adset_id: string } }
) {
  try {
    const { adset_id } = params;
    const body = await request.json();
    
    // This endpoint could be used to update calculation parameters
    // or trigger specific types of calculations with custom settings
    
    // For now, redirect to POST (recalculate)
    return POST(request, { params });

  } catch (error) {
    console.error('PUT /api/goals/[adset_id]/calculations error:', error);
    
    const response: CalculationResponse = {
      success: false,
      error: 'Failed to update calculations'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
} 