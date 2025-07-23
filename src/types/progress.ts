// Types for PBI 25 - Task 25-3: Progress Tracking & Alerts

export type ProgressStatus = 'on_track' | 'behind' | 'ahead' | 'at_risk' | 'completed';
export type ProgressAlertType = 'behind' | 'ahead' | 'at_risk' | 'completed';
export type ProgressAlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AdsetProgressTracking {
  id: string;
  adset_id: string;
  date: string; // YYYY-MM-DD
  leads_captured: number;
  daily_target: number;
  status: ProgressStatus;
  deviation_pct: number;
  alert_id?: string;
  created_at: string;
}

export interface AdsetProgressAlert {
  id: string;
  adset_id: string;
  date: string; // YYYY-MM-DD
  type: ProgressAlertType;
  severity: ProgressAlertSeverity;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface ProgressHistory {
  adset_id: string;
  history: AdsetProgressTracking[];
}

export interface ProgressAlertHistory {
  adset_id: string;
  alerts: AdsetProgressAlert[];
}

export interface ProgressSummary {
  adset_id: string;
  current_status: ProgressStatus;
  last_tracking: AdsetProgressTracking;
  active_alert?: AdsetProgressAlert;
}

export interface ProgressBatchSummary {
  date: string;
  summaries: ProgressSummary[];
} 