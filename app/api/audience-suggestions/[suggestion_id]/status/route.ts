// API Route: audience-suggestions/[suggestion_id]/status
// PBI 25 - Task 25-6: Audience Suggestions System

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { updateAudienceSuggestionStatus } from '../../../../../src/services/audienceSuggestionService';

export async function POST(
  request: NextRequest,
  { params }: { params: { suggestion_id: string } }
) {
  try {
    const body = await request.json();
    const { status, user_id, reason } = body;
    const suggestion_id = params.suggestion_id;

    if (!status || !['aceita', 'rejeitada'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status deve ser "aceita" ou "rejeitada"' },
        { status: 400 }
      );
    }

    const result = await updateAudienceSuggestionStatus({
      suggestion_id,
      status,
      user_id,
      reason
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: result.updated
    });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status da sugestão' },
      { status: 500 }
    );
  }
} 