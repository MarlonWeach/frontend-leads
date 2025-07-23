// Types: alertSystem.ts
// PBI 25 - Task 25-10: Sistema de Alertas Inteligentes

export type AlertType = 
  | 'goal_deviation'      // Desvio de meta
  | 'high_cpl'           // CPL elevado
  | 'budget_depletion'   // Esgotamento de budget
  | 'quality_drop'       // Queda de qualidade
  | 'performance_anomaly'; // Anomalia de performance

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';

export type NotificationChannel = 'email' | 'webhook' | 'dashboard' | 'sms';

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  adset_id?: string; // null = regra global
  campaign_id?: string;
  user_id?: string;
  
  // Configuração
  alert_type: AlertType;
  severity: AlertSeverity;
  is_active: boolean;
  
  // Thresholds específicos por tipo
  thresholds: AlertThresholds;
  
  // Notificações
  notification_channels: NotificationChannel[];
  notification_template?: string;
  
  // Rate limiting
  cooldown_minutes: number;
  max_notifications_per_hour: number;
  
  // Metadados
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AlertThresholds {
  // Para goal_deviation
  deviation_threshold?: number; // % de desvio
  min_days_elapsed?: number; // Dias mínimos para considerar
  
  // Para high_cpl
  cpl_threshold_percentage?: number; // % acima da meta
  min_leads?: number; // Leads mínimos para considerar
  
  // Para budget_depletion
  budget_used_threshold?: number; // % do budget usado
  goal_progress_threshold?: number; // % de progresso da meta
  
  // Para quality_drop
  quality_score_threshold?: number; // Score mínimo de qualidade
  quality_drop_percentage?: number; // % de queda
  
  // Para performance_anomaly
  performance_drop_threshold?: number; // % de queda na performance
  comparison_period_days?: number; // Período de comparação
  
  // Configurações gerais
  min_sample_size?: number; // Tamanho mínimo da amostra
  confidence_level?: number; // Nível de confiança
}

export interface Alert {
  id: string;
  rule_id: string;
  adset_id: string;
  campaign_id?: string;
  
  // Dados do alerta
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  
  // Contexto
  context: AlertContext;
  suggested_actions: string[];
  
  // Status
  status: AlertStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  snoozed_until?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AlertContext {
  // Métricas que geraram o alerta
  current_metrics?: {
    cpl?: number;
    progress_percentage?: number;
    budget_used_percentage?: number;
    leads_generated?: number;
    quality_score?: number;
    performance_score?: number;
  };
  
  // Metas/targets
  targets?: {
    cpl_target?: number;
    volume_target?: number;
    budget_target?: number;
    quality_target?: number;
  };
  
  // Dados de comparação
  comparison?: {
    previous_period?: any;
    benchmark?: any;
    deviation_percentage?: number;
  };
  
  // Dados adicionais
  metadata?: Record<string, any>;
}

export interface AlertNotification {
  id: string;
  alert_id: string;
  rule_id: string;
  
  // Configuração
  channel: NotificationChannel;
  recipient?: string;
  
  // Conteúdo
  subject?: string;
  content: string;
  template_used?: string;
  
  // Status
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  
  created_at: string;
}

export interface AlertStats {
  date_period: string;
  hour_period?: number;
  adset_id?: string;
  campaign_id?: string;
  alert_type?: AlertType;
  
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  resolved_alerts: number;
  avg_resolution_time_minutes?: number;
  
  created_at: string;
  updated_at: string;
}

// Request/Response types

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  adset_id?: string;
  campaign_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  thresholds: AlertThresholds;
  notification_channels: NotificationChannel[];
  notification_template?: string;
  cooldown_minutes?: number;
  max_notifications_per_hour?: number;
}

export interface CreateAlertRuleResponse {
  success: boolean;
  rule?: AlertRule;
  error?: string;
}

export interface CreateAlertRequest {
  rule_id: string;
  adset_id: string;
  campaign_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  context: AlertContext;
  suggested_actions?: string[];
}

export interface CreateAlertResponse {
  success: boolean;
  alert?: Alert;
  notifications_sent?: number;
  suppressed?: boolean;
  suppression_reason?: string;
  error?: string;
}

export interface AlertsQuery {
  adset_id?: string;
  campaign_id?: string;
  alert_type?: AlertType[];
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'severity' | 'alert_type' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface AlertsResponse {
  success: boolean;
  count: number;
  total_count?: number;
  alerts: Alert[];
  stats?: {
    active: number;
    critical: number;
    warning: number;
    info: number;
  };
  error?: string;
}

export interface UpdateAlertStatusRequest {
  alert_id: string;
  status: AlertStatus;
  user_id?: string;
  snooze_until?: string; // Para status 'snoozed'
  resolution_note?: string; // Para status 'resolved'
}

export interface UpdateAlertStatusResponse {
  success: boolean;
  alert?: Alert;
  error?: string;
}

export interface AlertEngineConfig {
  monitoring_interval_minutes: number;
  max_alerts_per_run: number;
  notification_retry_attempts: number;
  notification_retry_delay_ms: number;
  enable_email_notifications: boolean;
  enable_webhook_notifications: boolean;
  default_notification_template: string;
}

export interface AlertCheckResult {
  adset_id: string;
  campaign_id?: string;
  checks_performed: number;
  alerts_generated: number;
  alerts_suppressed: number;
  errors: string[];
  processing_time_ms: number;
}

export interface AlertEngineRunResult {
  success: boolean;
  adsets_checked: number;
  total_alerts_generated: number;
  total_alerts_suppressed: number;
  notifications_sent: number;
  errors: string[];
  execution_time_ms: number;
  next_run_scheduled?: string;
}

// Template types for notifications

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  alert_type?: AlertType;
  severity?: AlertSeverity;
  
  // Template content
  subject_template?: string; // Para email
  body_template: string;
  
  // Variables available: {{adset_name}}, {{campaign_name}}, {{alert_title}}, {{alert_message}}, {{suggested_actions}}, etc.
  
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationContext {
  alert: Alert;
  rule: AlertRule;
  adset_name?: string;
  campaign_name?: string;
  user_name?: string;
  dashboard_url?: string;
  additional_vars?: Record<string, any>;
}

// Dashboard integration types

export interface AlertIndicator {
  adset_id: string;
  alert_count: number;
  highest_severity: AlertSeverity;
  latest_alert?: Alert;
  has_critical: boolean;
  has_unacknowledged: boolean;
}

export interface AlertCenterData {
  active_alerts: Alert[];
  alert_indicators: AlertIndicator[];
  stats: {
    total_active: number;
    critical_count: number;
    warning_count: number;
    info_count: number;
    unacknowledged_count: number;
  };
  recent_activity: Alert[];
}

export interface AlertActionRequest {
  action: 'acknowledge' | 'resolve' | 'snooze' | 'bulk_acknowledge' | 'bulk_resolve';
  alert_ids: string[];
  user_id?: string;
  snooze_duration_hours?: number;
  resolution_note?: string;
}

export interface AlertActionResponse {
  success: boolean;
  affected_count: number;
  errors: string[];
}

// Hook types

export interface UseAlertsReturn {
  alerts: Alert[];
  stats: AlertCenterData['stats'];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  markAsRead: (alertId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, note?: string) => Promise<void>;
  snoozeAlert: (alertId: string, hours: number) => Promise<void>;
}

export interface UseAlertRulesReturn {
  rules: AlertRule[];
  loading: boolean;
  error: string | null;
  createRule: (rule: CreateAlertRuleRequest) => Promise<CreateAlertRuleResponse>;
  updateRule: (id: string, updates: Partial<AlertRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string, active: boolean) => Promise<boolean>;
  refresh: () => void;
} 