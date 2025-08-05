// Service: leadQualityService.ts
// PBI 25 - Task 25-5: Lead Quality Scoring System

import { supabase } from '../lib/supabaseClient';
import {
  LeadQualityScore,
  LeadQualityLog,
  LeadQualityReason,
  LeadQualityRecalculateRequest,
  LeadQualityRecalculateResponse,
  LeadQualityReport
} from '../types/leadQuality';

const HIGH_QUALITY_THRESHOLD = 80;
const LOW_QUALITY_THRESHOLD = 50;

export async function calculateLeadQualityScore(lead: any): Promise<number> {
  // Score base: média histórica do adset/campanha
  let score = await getHistoricalBaseScore(lead.adset_id, lead.campaign_id);

  // Penalidades
  if (lead.is_duplicate) score -= 30;
  if (lead.is_rejected) score -= 40;
  if (!isLeadDataComplete(lead)) score -= 20;
  if (lead.conversion_time && lead.conversion_time < 2) score += 10; // Conversão rápida

  // Clamp score
  score = Math.max(0, Math.min(100, score));
  return score;
}

export async function getHistoricalBaseScore(adset_id?: string, campaign_id?: string): Promise<number> {
  // Média histórica: se não houver dados, retorna 70
  let avg = 70;
  if (adset_id) {
    const { data, error } = await supabase
      .from('leads')
      .select('quality_score')
      .eq('adset_id', adset_id)
      .not('quality_score', 'is', null);
    if (data && data.length > 0) {
      const scores = data.map((l: any) => Number(l.quality_score)).filter((n) => !isNaN(n));
      if (scores.length > 0) avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }
  return avg;
}

export function isLeadDataComplete(lead: any): boolean {
  // Exemplo: checa se campos obrigatórios estão preenchidos
  return !!(lead.name && lead.email && lead.phone);
}

export async function recalculateLeadQualityScore(
  req: LeadQualityRecalculateRequest
): Promise<LeadQualityRecalculateResponse> {
  // Buscar lead
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', req.lead_id)
    .single();
  if (error || !lead) {
    return { success: false, error: 'Lead não encontrado' };
  }
  const old_score = lead.quality_score || null;
  const new_score = await calculateLeadQualityScore(lead);
  // Atualizar score
  await supabase
    .from('leads')
    .update({ quality_score: new_score })
    .eq('id', req.lead_id);
  // Logar alteração
  const { data: log, error: logError } = await supabase
    .from('lead_quality_logs')
    .insert({
      lead_id: req.lead_id,
      adset_id: lead.adset_id,
      old_score,
      new_score,
      reason: req.reason || 'update',
      details: req.details || '',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (logError) {
    return { success: false, error: 'Erro ao registrar log de score' };
  }
  return { success: true, new_score, log };
}

export async function getLeadQualityScore(lead_id: string): Promise<LeadQualityScore | null> {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single();
  if (error || !lead) return null;
  // Buscar logs
  const { data: logs } = await supabase
    .from('lead_quality_logs')
    .select('*')
    .eq('lead_id', lead_id)
    .order('timestamp', { ascending: false });
  return {
    lead_id,
    adset_id: lead.adset_id,
    campaign_id: lead.campaign_id,
    quality_score: lead.quality_score,
    last_updated: lead.updated_at || lead.created_at,
    logs: logs || []
  };
}

export async function getLeadQualityReport(
  adset_id?: string,
  campaign_id?: string
): Promise<LeadQualityReport> {
  let query = supabase.from('leads').select('quality_score');
  if (adset_id) query = query.eq('adset_id', adset_id);
  if (campaign_id) query = query.eq('campaign_id', campaign_id);
  const { data, error } = await query.not('quality_score', 'is', null);
  const scores = (data || []).map((l: any) => Number(l.quality_score)).filter((n) => !isNaN(n));
  const total = scores.length;
  const avg = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const high = scores.filter((s) => s >= HIGH_QUALITY_THRESHOLD).length / (total || 1);
  const low = scores.filter((s) => s < LOW_QUALITY_THRESHOLD).length / (total || 1);
  // Distribuição em faixas de 10
  const distribution = Array(10).fill(0);
  scores.forEach((s) => {
    const idx = Math.min(9, Math.floor(s / 10));
    distribution[idx]++;
  });
  return {
    adset_id,
    campaign_id,
    avg_score: avg,
    total_leads: total,
    high_quality_pct: Math.round(high * 100),
    low_quality_pct: Math.round(low * 100),
    score_distribution: distribution
  };
} 