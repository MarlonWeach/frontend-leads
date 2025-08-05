// API Route: audience-suggestions
// PBI 25 - Task 25-6: Audience Suggestions System

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateAudienceSuggestions, 
  getAudienceSuggestions 
} from '../../../src/services/audienceSuggestionService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adset_id = searchParams.get('adset_id');
    const campaign_id = searchParams.get('campaign_id');

    const suggestions = await getAudienceSuggestions(
      adset_id || undefined,
      campaign_id || undefined
    );

    return NextResponse.json({
      success: true,
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching audience suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar sugestões de audiência' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adset_id, campaign_id } = body;

    if (!adset_id && !campaign_id) {
      return NextResponse.json(
        { success: false, error: 'adset_id ou campaign_id obrigatório' },
        { status: 400 }
      );
    }

    const suggestions = await generateAudienceSuggestions(adset_id, campaign_id);

    return NextResponse.json({
      success: true,
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('Error generating audience suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar sugestões de audiência' },
      { status: 500 }
    );
  }
} 