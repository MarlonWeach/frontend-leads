// Service: LeadsCalculationService
// PBI 25 - Task 25-2: Sistema de cálculo de leads necessários por dia
// Purpose: Core service for leads calculation algorithms

import { supabase } from '../lib/supabaseClient';
import { AdsetGoal } from '../types/goals';
import {
  CalculationResult,
  CalculationRequest,
  LeadsDistribution,
  AdjustedDistribution,
  HistoricalPerformance,
  CurrentMetrics,
  ProgressMetrics,
  CatchUpPlan,
  CapacityAnalysis,
  CalculationAlert,
  ProgressStatus,
  AlertType,
  CALCULATION_CONSTANTS,
  RiskLevel
} from '../types/calculations';
import { addDays, differenceInDays, format, isWeekend } from 'date-fns';

export class LeadsCalculationService {
  private static cache = new Map<string, { data: CalculationResult; expires: number }>();

  /**
   * Main calculation method - performs complete analysis
   */
  static async calculateLeadsRequirement(request: CalculationRequest): Promise<CalculationResult> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    try {
      // 1. Get adset goal
      const adsetGoal = await this.getAdsetGoal(request.adset_id);
      if (!adsetGoal) {
        throw new Error('Adset goal not found');
      }

      // 2. Calculate basic distribution
      const basicDistribution = this.calculateBasicDistribution(adsetGoal);

      // 3. Analyze historical performance
      const historicalPerformance = await this.analyzeHistoricalPerformance(request.adset_id);

      // 4. Get current metrics
      const currentMetrics = await this.getCurrentMetrics(request.adset_id);

      // 5. Calculate progress metrics
      const progressMetrics = this.calculateProgressMetrics(adsetGoal);

      // 6. Adjust distribution based on performance
      const adjustedDistribution = this.adjustDistributionForPerformance(
        basicDistribution,
        historicalPerformance,
        currentMetrics,
        progressMetrics
      );

      // 7. Generate catch-up plan if needed
      const catchUpPlan = this.generateCatchUpPlan(adsetGoal, progressMetrics, adjustedDistribution);

      // 8. Analyze capacity
      const capacityAnalysis = this.analyzeCapacity(adsetGoal, historicalPerformance, adjustedDistribution);

      // 9. Generate alerts
      const alerts = this.generateAlerts(
        adsetGoal,
        adjustedDistribution,
        progressMetrics,
        catchUpPlan,
        capacityAnalysis
      );

      const result: CalculationResult = {
        adset_goal: adsetGoal,
        basic_distribution: basicDistribution,
        adjusted_distribution: adjustedDistribution,
        historical_performance: historicalPerformance,
        current_metrics: currentMetrics,
        progress_metrics: progressMetrics,
        catch_up_plan: catchUpPlan,
        capacity_analysis: capacityAnalysis,
        projections: [], // TODO: Implement projections in next phase
        alerts,
        calculated_at: new Date().toISOString()
      };

      // Cache result
      this.setCache(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error in calculateLeadsRequirement:', error);
      throw error;
    }
  }

  /**
   * Calculate basic uniform distribution
   */
  private static calculateBasicDistribution(goal: AdsetGoal): LeadsDistribution {
    const today = new Date();
    const startDate = new Date(goal.contract_start_date);
    const endDate = new Date(goal.contract_end_date);

    const daysTotal = differenceInDays(endDate, startDate);
    const daysElapsed = Math.max(0, differenceInDays(today, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));
    
    const leadsRemaining = Math.max(0, goal.volume_contracted - goal.volume_captured);
    const basicDaily = daysRemaining > 0 ? leadsRemaining / daysRemaining : 0;

    // Calculate weekend factor
    const weekendDays = this.countWeekendDays(today, endDate);
    const weekdayDays = daysRemaining - weekendDays;
    const weekendFactor = CALCULATION_CONSTANTS.WEEKEND_FACTOR;

    return {
      daily_target: basicDaily,
      total_remaining: leadsRemaining,
      days_remaining: daysRemaining,
      distribution_type: 'uniform',
      weekend_factor: weekendFactor,
      holiday_adjustments: [] // TODO: Implement holiday calendar
    };
  }

  /**
   * Analyze historical performance
   */
  private static async analyzeHistoricalPerformance(adsetId: string): Promise<HistoricalPerformance> {
    const daysBack = CALCULATION_CONSTANTS.DEFAULT_HISTORICAL_DAYS;
    const startDate = addDays(new Date(), -daysBack);
    
    try {
      // Query meta_leads for historical data
      const { data: leads, error } = await supabase
        .from('meta_leads')
        .select('created_time')
        .eq('adset_id', adsetId)
        .gte('created_time', startDate.toISOString())
        .order('created_time', { ascending: true });

      if (error) {
        console.error('Error fetching historical leads:', error);
        // Return default values
        return this.getDefaultHistoricalPerformance(adsetId);
      }

      if (!leads || leads.length === 0) {
        return this.getDefaultHistoricalPerformance(adsetId);
      }

      // Group leads by day
      const dailyLeads = this.groupLeadsByDay(leads);
      const leadCounts = Object.values(dailyLeads);

      const totalLeads = leads.length;
      const avgDaily = totalLeads / daysBack;
      const maxDaily = Math.max(...leadCounts, 0);
      const minDaily = Math.min(...leadCounts, 0);
      
      // Calculate standard deviation
      const variance = leadCounts.reduce((acc, count) => acc + Math.pow(count - avgDaily, 2), 0) / leadCounts.length;
      const stdDeviation = Math.sqrt(variance);

      // Calculate weekend performance ratio
      const weekendRatio = this.calculateWeekendRatio(dailyLeads);

      // Determine trend
      const trendDirection = this.calculateTrend(leadCounts);

      return {
        adset_id: adsetId,
        period_days: daysBack,
        total_leads: totalLeads,
        avg_daily_leads: avgDaily,
        max_daily_leads: maxDaily,
        min_daily_leads: minDaily,
        std_deviation: stdDeviation,
        trend_direction: trendDirection,
        weekend_performance_ratio: weekendRatio
      };

    } catch (error) {
      console.error('Error in analyzeHistoricalPerformance:', error);
      return this.getDefaultHistoricalPerformance(adsetId);
    }
  }

  /**
   * Get current metrics for adjustments
   */
  private static async getCurrentMetrics(adsetId: string): Promise<CurrentMetrics> {
    const recent7Days = addDays(new Date(), -7);
    
    try {
      // Get recent adset insights
      const { data: insights, error } = await supabase
        .from('adset_insights')
        .select('date_start, spend, actions')
        .eq('adset_id', adsetId)
        .gte('date_start', format(recent7Days, 'yyyy-MM-dd'))
        .order('date_start', { ascending: false });

      if (error || !insights || insights.length === 0) {
        return {
          current_cpl: 50, // Default reasonable CPL
          recent_daily_leads: [0, 0, 0, 0, 0, 0, 0],
          recent_daily_spend: [0, 0, 0, 0, 0, 0, 0],
          last_updated: new Date().toISOString()
        };
      }

      // Process insights data
      const recentLeads: number[] = [];
      const recentSpend: number[] = [];
      let totalSpend = 0;
      let totalLeads = 0;

      insights.forEach(insight => {
        const leads = this.extractLeadsFromActions(insight.actions);
        const spend = parseFloat(insight.spend) || 0;
        
        recentLeads.push(leads);
        recentSpend.push(spend);
        totalSpend += spend;
        totalLeads += leads;
      });

      const currentCPL = totalLeads > 0 ? totalSpend / totalLeads : 50;

      return {
        current_cpl: currentCPL,
        recent_daily_leads: recentLeads.slice(0, 7),
        recent_daily_spend: recentSpend.slice(0, 7),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in getCurrentMetrics:', error);
      return {
        current_cpl: 50,
        recent_daily_leads: [0, 0, 0, 0, 0, 0, 0],
        recent_daily_spend: [0, 0, 0, 0, 0, 0, 0],
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate progress metrics
   */
  private static calculateProgressMetrics(goal: AdsetGoal): ProgressMetrics {
    const today = new Date();
    const startDate = new Date(goal.contract_start_date);
    const endDate = new Date(goal.contract_end_date);

    const daysTotal = differenceInDays(endDate, startDate);
    const daysElapsed = Math.max(0, differenceInDays(today, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));

    const actualProgress = (goal.volume_captured / goal.volume_contracted) * 100;
    const idealProgress = daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 0;
    const deviation = actualProgress - idealProgress;

    // Determine status
    let status: ProgressStatus;
    if (deviation >= 10) {
      status = ProgressStatus.AHEAD_OF_SCHEDULE;
    } else if (deviation >= -5) {
      status = ProgressStatus.ON_TRACK;
    } else if (deviation >= -15) {
      status = ProgressStatus.SLIGHTLY_BEHIND;
    } else if (deviation >= -30) {
      status = ProgressStatus.SIGNIFICANTLY_BEHIND;
    } else {
      status = ProgressStatus.CRITICAL_DELAY;
    }

    return {
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      days_total: daysTotal,
      actual_progress_percentage: actualProgress,
      ideal_progress_percentage: idealProgress,
      deviation_percentage: deviation,
      status
    };
  }

  /**
   * Adjust distribution based on performance data
   */
  private static adjustDistributionForPerformance(
    basic: LeadsDistribution,
    historical: HistoricalPerformance,
    current: CurrentMetrics,
    progress: ProgressMetrics
  ): AdjustedDistribution {
    
    // Calculate performance factor based on CPL
    const performanceFactor = historical.avg_daily_leads > 0 ? 
      Math.max(0.5, Math.min(2.0, current.current_cpl / 30)) : 1.0; // Assume 30 as baseline CPL

    // Calculate capacity factor
    const capacityFactor = historical.avg_daily_leads > 0 ?
      Math.min(basic.daily_target / historical.avg_daily_leads, CALCULATION_CONSTANTS.MAX_CAPACITY_MULTIPLIER) : 1.0;

    // Adjust daily target
    const adjustedDaily = basic.daily_target * performanceFactor;

    // Determine if realistic
    const maxRealistic = historical.avg_daily_leads * CALCULATION_CONSTANTS.MAX_CAPACITY_MULTIPLIER;
    const isRealistic = adjustedDaily <= maxRealistic || historical.avg_daily_leads === 0;

    // Calculate confidence level
    const confidence = this.calculateConfidenceLevel(historical, current, isRealistic);

    // Assess risk
    const risk = this.assessRisk(adjustedDaily, historical, progress);

    return {
      ...basic,
      adjusted_daily_target: adjustedDaily,
      performance_factor: performanceFactor,
      capacity_factor: capacityFactor,
      is_realistic: isRealistic,
      confidence_level: confidence,
      risk_assessment: risk
    };
  }

  /**
   * Generate catch-up plan if behind schedule
   */
  private static generateCatchUpPlan(
    goal: AdsetGoal,
    progress: ProgressMetrics,
    distribution: AdjustedDistribution
  ): CatchUpPlan | undefined {
    
    if (progress.deviation_percentage >= -CALCULATION_CONSTANTS.CATCH_UP_THRESHOLD) {
      return undefined; // No catch-up needed
    }

    const deficitPercentage = Math.abs(progress.deviation_percentage);
    const extraLeadsNeeded = (deficitPercentage / 100) * goal.volume_contracted;
    const dailyBoost = progress.days_remaining > 0 ? extraLeadsNeeded / progress.days_remaining : 0;
    const recommendedDaily = distribution.daily_target + dailyBoost;

    // Determine feasibility
    let feasibility: CatchUpPlan['feasibility'];
    if (deficitPercentage < 20) {
      feasibility = 'easy';
    } else if (deficitPercentage < 40) {
      feasibility = 'challenging';
    } else if (deficitPercentage < 60) {
      feasibility = 'difficult';
    } else {
      feasibility = 'impossible';
    }

    // Estimate required budget increase
    const currentDailyBudget = (goal.budget_total / progress.days_total);
    const requiredBudgetIncrease = (dailyBoost * goal.cpl_target) / currentDailyBudget * 100;

    return {
      needs_catch_up: true,
      deficit_percentage: deficitPercentage,
      extra_leads_needed: extraLeadsNeeded,
      daily_boost: dailyBoost,
      recommended_daily: recommendedDaily,
      catch_up_duration_days: progress.days_remaining,
      feasibility,
      required_budget_increase: requiredBudgetIncrease
    };
  }

  /**
   * Analyze adset capacity
   */
  private static analyzeCapacity(
    goal: AdsetGoal,
    historical: HistoricalPerformance,
    distribution: AdjustedDistribution
  ): CapacityAnalysis {
    
    const maxTheoretical = historical.max_daily_leads * 2; // Theoretical maximum
    const maxRealistic = historical.avg_daily_leads * CALCULATION_CONSTANTS.MAX_CAPACITY_MULTIPLIER;
    const currentUtilization = historical.avg_daily_leads > 0 ? 
      (distribution.adjusted_daily_target / maxRealistic) * 100 : 0;

    return {
      adset_id: goal.adset_id,
      max_theoretical_daily: maxTheoretical,
      max_realistic_daily: maxRealistic,
      current_utilization_percentage: Math.min(100, currentUtilization),
      bottleneck_factors: [], // TODO: Implement bottleneck analysis
      scaling_recommendations: [] // TODO: Implement scaling recommendations
    };
  }

  /**
   * Generate alerts based on analysis
   */
  private static generateAlerts(
    goal: AdsetGoal,
    distribution: AdjustedDistribution,
    progress: ProgressMetrics,
    catchUp: CatchUpPlan | undefined,
    capacity: CapacityAnalysis
  ): CalculationAlert[] {
    
    const alerts: CalculationAlert[] = [];

    // Behind schedule alert
    if (progress.status === ProgressStatus.SIGNIFICANTLY_BEHIND || progress.status === ProgressStatus.CRITICAL_DELAY) {
      alerts.push({
        id: `behind_${goal.adset_id}_${Date.now()}`,
        adset_id: goal.adset_id,
        alert_type: AlertType.BEHIND_SCHEDULE,
        severity: progress.status === ProgressStatus.CRITICAL_DELAY ? 'critical' : 'warning',
        message: `Adset está ${Math.abs(progress.deviation_percentage).toFixed(1)}% atrasado na meta`,
        suggested_actions: [
          'Aumentar orçamento diário',
          'Revisar segmentação de audiência',
          'Otimizar criativos'
        ],
        created_at: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Impossible target alert
    if (!distribution.is_realistic) {
      alerts.push({
        id: `impossible_${goal.adset_id}_${Date.now()}`,
        adset_id: goal.adset_id,
        alert_type: AlertType.IMPOSSIBLE_TARGET,
        severity: 'error',
        message: `Meta diária de ${distribution.adjusted_daily_target.toFixed(1)} leads é impossível`,
        suggested_actions: [
          'Revisar meta contratual',
          'Aumentar orçamento significativamente',
          'Estender prazo do contrato'
        ],
        created_at: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Capacity exceeded alert
    if (capacity.current_utilization_percentage > 90) {
      alerts.push({
        id: `capacity_${goal.adset_id}_${Date.now()}`,
        adset_id: goal.adset_id,
        alert_type: AlertType.CAPACITY_EXCEEDED,
        severity: 'warning',
        message: `Capacidade do adset está em ${capacity.current_utilization_percentage.toFixed(1)}%`,
        suggested_actions: [
          'Considerar duplicar adset',
          'Expandir audiência',
          'Aumentar orçamento gradualmente'
        ],
        created_at: new Date().toISOString(),
        acknowledged: false
      });
    }

    return alerts;
  }

  // Helper methods
  private static async getAdsetGoal(adsetId: string): Promise<AdsetGoal | null> {
    const { data, error } = await supabase
      .from('adset_goals')
      .select('*')
      .eq('adset_id', adsetId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private static countWeekendDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (isWeekend(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }

  private static groupLeadsByDay(leads: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    leads.forEach(lead => {
      const date = format(new Date(lead.created_time), 'yyyy-MM-dd');
      groups[date] = (groups[date] || 0) + 1;
    });
    
    return groups;
  }

  private static calculateWeekendRatio(dailyLeads: Record<string, number>): number {
    let weekendTotal = 0;
    let weekdayTotal = 0;
    let weekendDays = 0;
    let weekdayDays = 0;

    Object.entries(dailyLeads).forEach(([date, count]) => {
      const dateObj = new Date(date);
      if (isWeekend(dateObj)) {
        weekendTotal += count;
        weekendDays++;
      } else {
        weekdayTotal += count;
        weekdayDays++;
      }
    });

    const weekendAvg = weekendDays > 0 ? weekendTotal / weekendDays : 0;
    const weekdayAvg = weekdayDays > 0 ? weekdayTotal / weekdayDays : 0;

    return weekdayAvg > 0 ? weekendAvg / weekdayAvg : CALCULATION_CONSTANTS.WEEKEND_FACTOR;
  }

  private static calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = (secondAvg - firstAvg) / firstAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private static extractLeadsFromActions(actions: any): number {
    if (!actions || !Array.isArray(actions)) return 0;
    
    const leadAction = actions.find(action => 
      action.action_type === 'onsite_conversion.lead_grouped' ||
      action.action_type === 'lead'
    );
    
    return leadAction ? parseInt(leadAction.value) || 0 : 0;
  }

  private static calculateConfidenceLevel(
    historical: HistoricalPerformance,
    current: CurrentMetrics,
    isRealistic: boolean
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on historical data
    if (historical.total_leads > 50) confidence += 0.2;
    if (historical.std_deviation < historical.avg_daily_leads * 0.5) confidence += 0.1;
    if (historical.trend_direction === 'improving') confidence += 0.1;
    
    // Adjust based on realism
    if (isRealistic) confidence += 0.1;
    else confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }

  private static assessRisk(
    dailyTarget: number,
    historical: HistoricalPerformance,
    progress: ProgressMetrics
  ): RiskLevel {
    if (progress.status === ProgressStatus.CRITICAL_DELAY) return 'critical';
    if (dailyTarget > historical.max_daily_leads * 1.5) return 'high';
    if (progress.status === ProgressStatus.SIGNIFICANTLY_BEHIND) return 'medium';
    return 'low';
  }

  private static getDefaultHistoricalPerformance(adsetId: string): HistoricalPerformance {
    return {
      adset_id: adsetId,
      period_days: CALCULATION_CONSTANTS.DEFAULT_HISTORICAL_DAYS,
      total_leads: 0,
      avg_daily_leads: 0,
      max_daily_leads: 0,
      min_daily_leads: 0,
      std_deviation: 0,
      trend_direction: 'stable',
      weekend_performance_ratio: CALCULATION_CONSTANTS.WEEKEND_FACTOR
    };
  }

  // Cache methods
  private static getCacheKey(request: CalculationRequest): string {
    return `calc_${request.adset_id}_${request.include_projections}_${request.projection_days}`;
  }

  private static getFromCache(key: string): CalculationResult | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private static setCache(key: string, data: CalculationResult): void {
    const expires = Date.now() + (CALCULATION_CONSTANTS.CACHE_DURATION_HOURS * 60 * 60 * 1000);
    this.cache.set(key, { data, expires });
  }
} 