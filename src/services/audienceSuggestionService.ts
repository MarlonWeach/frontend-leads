// Service: audienceSuggestionService.ts
// PBI 25 - Task 25-6: Audience Suggestions System

import { supabase } from '../lib/supabaseClient';
import {
  AudienceSuggestion,
  AudienceSuggestionLog,
  AudienceSuggestionType,
  AudienceSuggestionStatus,
  UpdateAudienceSuggestionStatusRequest,
  UpdateAudienceSuggestionStatusResponse
} from '../types/audienceSuggestions';

// Função principal: analisar performance e gerar sugestões
export async function generateAudienceSuggestions(adset_id?: string, campaign_id?: string): Promise<AudienceSuggestion[]> {
  // Exemplo simplificado: busca segmentos de alta/baixa performance e gera sugestões
  // (No real: análise de dados históricos, segmentações, sobreposição, etc)
  const suggestions: AudienceSuggestion[] = [];
  // Buscar dados de performance (mock/simples)
  // Exemplo: segmentos fictícios
  const segments = [
    { segment: '18-24', leads: 120, cpl: 20 },
    { segment: '25-34', leads: 80, cpl: 35 },
    { segment: '35-44', leads: 30, cpl: 60 },
    { segment: 'Lookalike 1%', leads: 200, cpl: 18 },
    { segment: 'Retargeting', leads: 10, cpl: 90 }
  ];
  for (const s of segments) {
    if (s.leads > 100 && s.cpl < 25) {
      suggestions.push({
        id: '',
        adset_id,
        campaign_id,
        type: 'expansao',
        segment: s.segment,
        suggestion: `Expandir público ${s.segment} (alta performance)`,
        justification: `Segmento gerou ${s.leads} leads com CPL R$${s.cpl}`,
        impact: '+15% leads',
        status: 'pendente',
        created_at: new Date().toISOString()
      });
    } else if (s.cpl > 50) {
      suggestions.push({
        id: '',
        adset_id,
        campaign_id,
        type: 'reducao',
        segment: s.segment,
        suggestion: `Reduzir investimento no público ${s.segment} (baixa performance)`,
        justification: `Segmento CPL elevado: R$${s.cpl}`,
        impact: '-10% CPL',
        status: 'pendente',
        created_at: new Date().toISOString()
      });
    }
  }
  // Registrar sugestões no banco
  for (const sug of suggestions) {
    const { data, error } = await supabase
      .from('audience_suggestions_logs')
      .insert({
        adset_id,
        campaign_id,
        type: sug.type,
        segment: sug.segment,
        suggestion: sug.suggestion,
        justification: sug.justification,
        impact: sug.impact,
        status: 'pendente',
        created_at: sug.created_at
      })
      .select()
      .single();
    if (data) {
      sug.id = data.id;
    }
  }
  return suggestions;
}

export async function getAudienceSuggestions(adset_id?: string, campaign_id?: string): Promise<AudienceSuggestion[]> {
  let query = supabase.from('audience_suggestions_logs').select('*');
  if (adset_id) query = query.eq('adset_id', adset_id);
  if (campaign_id) query = query.eq('campaign_id', campaign_id);
  const { data, error } = await query.eq('status', 'pendente');
  return (data as AudienceSuggestion[]) || [];
}

export async function getAudienceSuggestionLogs(adset_id?: string, campaign_id?: string): Promise<AudienceSuggestionLog[]> {
  let query = supabase.from('audience_suggestions_logs').select('*');
  if (adset_id) query = query.eq('adset_id', adset_id);
  if (campaign_id) query = query.eq('campaign_id', campaign_id);
  const { data, error } = await query;
  return (data as AudienceSuggestionLog[]) || [];
}

export async function updateAudienceSuggestionStatus(
  req: UpdateAudienceSuggestionStatusRequest
): Promise<UpdateAudienceSuggestionStatusResponse> {
  const { suggestion_id, status, user_id, reason } = req;
  const { data, error } = await supabase
    .from('audience_suggestions_logs')
    .update({ status, justification: reason ? reason : undefined })
    .eq('id', suggestion_id)
    .select()
    .single();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, updated: data as AudienceSuggestionLog };
} 