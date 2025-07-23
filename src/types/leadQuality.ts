// Types for PBI 25 - Task 25-5: Lead Quality Scoring System

export type LeadQualityReason =
  | 'conversion'
  | 'update'
  | 'penalty_duplicate'
  | 'penalty_rejected'
  | 'penalty_incomplete'
  | 'manual'
  | 'import';

export interface LeadQualityLog {
  id: string;
  lead_id: string;
  adset_id?: string;
  old_score?: number;
  new_score: number;
  reason: LeadQualityReason;
  details?: string;
  timestamp: string;
  created_at: string;
}

export interface LeadQualityScore {
  lead_id: string;
  adset_id?: string;
  campaign_id?: string;
  quality_score: number;
  last_updated: string;
  logs?: LeadQualityLog[];
}

export interface LeadQualityReport {
  adset_id?: string;
  campaign_id?: string;
  avg_score: number;
  total_leads: number;
  high_quality_pct: number;
  low_quality_pct: number;
  score_distribution: number[]; // [0-10, 10-20, ..., 90-100]
}

export interface LeadQualityRecalculateRequest {
  lead_id: string;
  force?: boolean;
  reason?: LeadQualityReason;
  details?: string;
}

export interface LeadQualityRecalculateResponse {
  success: boolean;
  new_score?: number;
  log?: LeadQualityLog;
  error?: string;
} 