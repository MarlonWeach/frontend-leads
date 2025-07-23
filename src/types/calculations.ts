// Types for PBI 25 - Task 25-2: Calculation System
// Purpose: Types for leads calculation algorithms and projections

import { AdsetGoal } from './goals';

// Basic calculation results
export interface LeadsDistribution {
  daily_target: number;
  total_remaining: number;
  days_remaining: number;
  distribution_type: 'uniform' | 'accelerated' | 'decelerated' | 'catch_up';
  weekend_factor?: number;
  holiday_adjustments?: HolidayAdjustment[];
}

export interface HolidayAdjustment {
  date: string;
  name: string;
  impact_factor: number; // 0.0 = no leads, 1.0 = normal, >1.0 = higher than normal
}

// Historical analysis
export interface HistoricalPerformance {
  adset_id: string;
  period_days: number;
  total_leads: number;
  avg_daily_leads: number;
  max_daily_leads: number;
  min_daily_leads: number;
  std_deviation: number;
  trend_direction: 'improving' | 'stable' | 'declining';
  seasonality_factor?: number;
  weekend_performance_ratio: number; // weekend leads / weekday leads
}

export interface PerformanceWindow {
  start_date: string;
  end_date: string;
  daily_leads: number[];
  daily_spend: number[];
  daily_cpl: number[];
  total_leads: number;
  avg_cpl: number;
  trend_analysis: TrendAnalysis;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number; // 0-1
  projected_next_7_days: number[];
}

// Current metrics for adjustments
export interface CurrentMetrics {
  current_cpl: number;
  recent_daily_leads: number[];
  recent_daily_spend: number[];
  quality_score?: number;
  last_updated: string;
}

// Advanced calculation results
export interface AdjustedDistribution extends LeadsDistribution {
  adjusted_daily_target: number;
  performance_factor: number;
  capacity_factor: number;
  quality_factor?: number;
  is_realistic: boolean;
  confidence_level: number; // 0-1
  risk_assessment: RiskLevel;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Catch-up analysis
export interface CatchUpPlan {
  needs_catch_up: boolean;
  deficit_percentage?: number;
  extra_leads_needed?: number;
  daily_boost?: number;
  recommended_daily?: number;
  catch_up_duration_days?: number;
  feasibility: 'easy' | 'challenging' | 'difficult' | 'impossible';
  required_budget_increase?: number;
}

// Progress tracking
export interface ProgressMetrics {
  days_elapsed: number;
  days_remaining: number;
  days_total: number;
  actual_progress_percentage: number;
  ideal_progress_percentage: number;
  deviation_percentage: number;
  status: ProgressStatus;
}

export enum ProgressStatus {
  ON_TRACK = 'on_track',
  SLIGHTLY_BEHIND = 'slightly_behind',
  SIGNIFICANTLY_BEHIND = 'significantly_behind',
  AHEAD_OF_SCHEDULE = 'ahead_of_schedule',
  CRITICAL_DELAY = 'critical_delay'
}

// Projections
export interface LeadsProjection {
  projection_date: string;
  projected_daily_leads: number[];
  projected_cumulative_leads: number[];
  confidence_intervals: ConfidenceInterval[];
  scenario: ProjectionScenario;
  assumptions: string[];
}

export interface ConfidenceInterval {
  date: string;
  lower_bound: number;
  upper_bound: number;
  confidence_level: number;
}

export enum ProjectionScenario {
  OPTIMISTIC = 'optimistic',
  REALISTIC = 'realistic',
  PESSIMISTIC = 'pessimistic',
  CURRENT_TREND = 'current_trend'
}

// Capacity analysis
export interface CapacityAnalysis {
  adset_id: string;
  max_theoretical_daily: number;
  max_realistic_daily: number;
  current_utilization_percentage: number;
  bottleneck_factors: BottleneckFactor[];
  scaling_recommendations: ScalingRecommendation[];
}

export interface BottleneckFactor {
  factor: 'budget' | 'audience_size' | 'creative_fatigue' | 'competition' | 'seasonality';
  impact_level: 'low' | 'medium' | 'high';
  description: string;
  recommended_action?: string;
}

export interface ScalingRecommendation {
  action: string;
  expected_impact: string;
  effort_required: 'low' | 'medium' | 'high';
  timeline_days: number;
  cost_estimate?: number;
}

// Alert system
export interface CalculationAlert {
  id: string;
  adset_id: string;
  alert_type: AlertType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  suggested_actions: string[];
  created_at: string;
  acknowledged: boolean;
}

export enum AlertType {
  IMPOSSIBLE_TARGET = 'impossible_target',
  BEHIND_SCHEDULE = 'behind_schedule',
  CAPACITY_EXCEEDED = 'capacity_exceeded',
  PERFORMANCE_DEGRADED = 'performance_degraded',
  BUDGET_INSUFFICIENT = 'budget_insufficient'
}

// API request/response types
export interface CalculationRequest {
  adset_id: string;
  include_projections?: boolean;
  include_historical?: boolean;
  projection_days?: number;
  scenario?: ProjectionScenario;
}

export interface CalculationResponse {
  success: boolean;
  data?: CalculationResult;
  error?: string;
  cached?: boolean;
  calculation_time_ms?: number;
}

export interface CalculationResult {
  adset_goal: AdsetGoal;
  basic_distribution: LeadsDistribution;
  adjusted_distribution: AdjustedDistribution;
  historical_performance: HistoricalPerformance;
  current_metrics: CurrentMetrics;
  progress_metrics: ProgressMetrics;
  catch_up_plan?: CatchUpPlan;
  capacity_analysis: CapacityAnalysis;
  projections?: LeadsProjection[];
  alerts: CalculationAlert[];
  calculated_at: string;
}

// Service configuration
export interface CalculationConfig {
  cache_duration_hours: number;
  min_historical_days: number;
  max_capacity_multiplier: number;
  catch_up_threshold_percentage: number;
  confidence_threshold: number;
  holiday_calendar: 'brazil' | 'custom';
  weekend_factor_default: number;
}

// Constants for calculations
export const CALCULATION_CONSTANTS = {
  DEFAULT_HISTORICAL_DAYS: 60,
  MIN_HISTORICAL_DAYS: 14,
  MAX_CAPACITY_MULTIPLIER: 2.0,
  CATCH_UP_THRESHOLD: 15.0, // percentage
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  WEEKEND_FACTOR: 0.6, // weekends typically generate 60% of weekday leads
  HOLIDAY_FACTOR: 0.3, // holidays typically generate 30% of normal leads
  CACHE_DURATION_HOURS: 2,
  MAX_PROJECTION_DAYS: 90
} as const;

// Utility types
export type CalculationPeriod = '7d' | '14d' | '30d' | '60d' | '90d';

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface WeightedAverage {
  value: number;
  weight: number;
  period: DateRange;
}

// Lead quality integration (if available)
export interface LeadQualityMetrics {
  quality_score: number; // 0-100
  conversion_rate: number;
  avg_value_per_lead: number;
  time_to_conversion_days: number;
  quality_trend: 'improving' | 'stable' | 'declining';
}

// Advanced algorithms results
export interface SeasonalityPattern {
  day_of_week_factors: number[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  month_factors: number[]; // [Jan, Feb, ..., Dec]
  holiday_periods: HolidayPeriod[];
  special_events: SpecialEvent[];
}

export interface HolidayPeriod {
  name: string;
  start_date: string;
  end_date: string;
  impact_factor: number;
  description: string;
}

export interface SpecialEvent {
  name: string;
  date: string;
  expected_impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
}

// Machine learning predictions (future enhancement)
export interface MLPrediction {
  model_version: string;
  prediction_confidence: number;
  feature_importance: FeatureImportance[];
  predicted_values: number[];
  prediction_interval: ConfidenceInterval[];
}

export interface FeatureImportance {
  feature_name: string;
  importance_score: number;
  description: string;
} 