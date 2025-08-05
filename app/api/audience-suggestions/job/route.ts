// API Route: audience-suggestions/job
// PBI 25 - Task 25-6: Sugestões de Otimização de Audiência

import { NextRequest, NextResponse } from 'next/server';
import { generateAudienceSuggestions } from '../../../../src/services/audienceSuggestionService';
import { supabaseServer as supabase } from '../../../../src/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[Audience Suggestions Job] Starting daily analysis...');
    
    // Buscar todos os adsets ativos dos últimos 7 dias
    const { data: adsets, error } = await supabase
      .from('adsets')
      .select('adset_id, campaign_id, name')
      .eq('status', 'ACTIVE')
      .gte('updated_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[Audience Suggestions Job] Error fetching adsets:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar adsets ativos' },
        { status: 500 }
      );
    }

    let totalSuggestions = 0;
    const results = [];

    // Processar cada adset
    for (const adset of adsets || []) {
      try {
        console.log(`[Audience Suggestions Job] Processing adset: ${adset.name}`);
        
        const suggestions = await generateAudienceSuggestions(
          adset.adset_id, 
          adset.campaign_id
        );
        
        totalSuggestions += suggestions.length;
        results.push({
          adset_id: adset.adset_id,
          adset_name: adset.name,
          suggestions_count: suggestions.length
        });
        
        // Delay para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[Audience Suggestions Job] Error processing adset ${adset.adset_id}:`, error);
        results.push({
          adset_id: adset.adset_id,
          adset_name: adset.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`[Audience Suggestions Job] Completed. Total suggestions: ${totalSuggestions}`);

    return NextResponse.json({
      success: true,
      message: 'Job de análise de audiências concluído',
      processed_adsets: adsets?.length || 0,
      total_suggestions: totalSuggestions,
      results
    });
  } catch (error) {
    console.error('[Audience Suggestions Job] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro fatal no job de análise de audiências',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 