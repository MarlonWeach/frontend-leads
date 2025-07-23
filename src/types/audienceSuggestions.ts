// Types for PBI 25 - Task 25-6: Audience Suggestions System

export type AudienceSuggestionType = 'ajuste' | 'exclusao' | 'expansao' | 'reducao';
export type AudienceSuggestionStatus = 'pendente' | 'aceita' | 'rejeitada';

export interface AudienceSuggestionLog {
  id: string;
  adset_id?: string;
  campaign_id?: string;
  type: AudienceSuggestionType;
  segment?: string;
  suggestion: string;
  justification?: string;
  impact?: string;
  status: AudienceSuggestionStatus;
  created_at: string;
}

export interface AudienceSuggestion {
  id: string;
  adset_id?: string;
  campaign_id?: string;
  type: AudienceSuggestionType;
  segment?: string;
  suggestion: string;
  justification?: string;
  impact?: string;
  status: AudienceSuggestionStatus;
  created_at: string;
}

export interface AudienceSuggestionAPIResponse {
  success: boolean;
  data?: AudienceSuggestion[];
  error?: string;
}

export interface AudienceSuggestionLogAPIResponse {
  success: boolean;
  data?: AudienceSuggestionLog[];
  error?: string;
}

export interface UpdateAudienceSuggestionStatusRequest {
  suggestion_id: string;
  status: AudienceSuggestionStatus;
  user_id?: string;
  reason?: string;
}

export interface UpdateAudienceSuggestionStatusResponse {
  success: boolean;
  updated?: AudienceSuggestionLog;
  error?: string;
} 