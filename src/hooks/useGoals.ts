// Hook: useGoals
// PBI 25 - Task 25-1: Interface de configuração de metas por adset
// Purpose: Manage adset goals state and operations

import { useState, useEffect, useCallback } from 'react';
import { 
  AdsetGoal, 
  AdsetGoalInput,
  GoalFormData,
  GoalFormErrors,
  GoalCalculations,
  GoalValidation,
  GoalApiResponse,
  GoalsListResponse,
  GOAL_CONSTANTS 
} from '../types/goals';

interface UseGoalsOptions {
  adsetId?: string;
  includeCalculations?: boolean;
  autoFetch?: boolean;
}

interface UseGoalsReturn {
  // State
  goals: AdsetGoal[];
  currentGoal: AdsetGoal | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Calculations
  calculations: GoalCalculations | null;
  validation: GoalValidation | null;
  
  // Actions
  fetchGoals: () => Promise<void>;
  fetchGoal: (adsetId: string) => Promise<void>;
  saveGoal: (goal: AdsetGoalInput) => Promise<boolean>;
  updateGoal: (adsetId: string, updates: Partial<AdsetGoalInput>) => Promise<boolean>;
  deleteGoal: (adsetId: string) => Promise<boolean>;
  
  // Form helpers
  validateForm: (formData: GoalFormData) => GoalFormErrors;
  calculateMetrics: (goal: AdsetGoal) => GoalCalculations;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useGoals(options: UseGoalsOptions = {}): UseGoalsReturn {
  const { adsetId, includeCalculations = true, autoFetch = true } = options;
  
  // State
  const [goals, setGoals] = useState<AdsetGoal[]>([]);
  const [currentGoal, setCurrentGoal] = useState<AdsetGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculations, setCalculations] = useState<GoalCalculations | null>(null);
  const [validation, setValidation] = useState<GoalValidation | null>(null);

  // Fetch all goals
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeCalculations) {
        params.append('calculations', 'true');
      }

      const response = await fetch(`/api/goals?${params.toString()}`);
      const data: GoalsListResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch goals');
      }

      setGoals(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }, [includeCalculations]);

  // Fetch specific goal
  const fetchGoal = useCallback(async (targetAdsetId: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeCalculations) {
        params.append('calculations', 'true');
      }

      const response = await fetch(`/api/goals/${targetAdsetId}?${params.toString()}`);
      const data: GoalApiResponse = await response.json();

      if (!data.success) {
        if (response.status === 404) {
          setCurrentGoal(null);
          setCalculations(null);
          return;
        }
        throw new Error(data.error || 'Failed to fetch goal');
      }

      setCurrentGoal(data.data || null);
      setCalculations(data.calculations || null);
      setValidation(data.validation || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching goal:', err);
    } finally {
      setLoading(false);
    }
  }, [includeCalculations]);

  // Save goal (create or update)
  const saveGoal = useCallback(async (goal: AdsetGoalInput): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal),
      });

      const data: GoalApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save goal');
      }

      // Update state
      if (data.data) {
        setCurrentGoal(data.data);
        setCalculations(data.calculations || null);
        setValidation(data.validation || null);

        // Update goals list if we have it
        setGoals(prev => {
          const filtered = prev.filter(g => g.adset_id !== data.data!.adset_id);
          return [data.data!, ...filtered];
        });
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error saving goal:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Update goal
  const updateGoal = useCallback(async (
    targetAdsetId: string, 
    updates: Partial<AdsetGoalInput>
  ): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/goals/${targetAdsetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data: GoalApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update goal');
      }

      // Update state
      if (data.data) {
        setCurrentGoal(data.data);
        setCalculations(data.calculations || null);
        setValidation(data.validation || null);

        // Update goals list
        setGoals(prev => prev.map(g => 
          g.adset_id === targetAdsetId ? data.data! : g
        ));
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating goal:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Delete goal
  const deleteGoal = useCallback(async (targetAdsetId: string): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/goals/${targetAdsetId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete goal');
      }

      // Update state
      setCurrentGoal(prev => prev?.adset_id === targetAdsetId ? null : prev);
      setCalculations(null);
      setValidation(null);
      setGoals(prev => prev.filter(g => g.adset_id !== targetAdsetId));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting goal:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Form validation
  const validateForm = useCallback((formData: GoalFormData): GoalFormErrors => {
    const errors: GoalFormErrors = {};

    // Required fields
    if (!formData.adset_id?.trim()) {
      errors.adset_id = 'Adset é obrigatório';
    }

    // Budget validation
    const budget = parseFloat(formData.budget_total);
    if (!formData.budget_total || isNaN(budget) || budget <= 0) {
      errors.budget_total = 'Budget deve ser maior que zero';
    } else if (budget < GOAL_CONSTANTS.MIN_BUDGET) {
      errors.budget_total = `Budget mínimo: R$ ${GOAL_CONSTANTS.MIN_BUDGET}`;
    } else if (budget > GOAL_CONSTANTS.MAX_BUDGET) {
      errors.budget_total = `Budget máximo: R$ ${GOAL_CONSTANTS.MAX_BUDGET}`;
    }

    // CPL validation
    const cpl = parseFloat(formData.cpl_target);
    if (!formData.cpl_target || isNaN(cpl) || cpl <= 0) {
      errors.cpl_target = 'CPL alvo deve ser maior que zero';
    } else if (cpl < GOAL_CONSTANTS.MIN_CPL) {
      errors.cpl_target = `CPL muito baixo (mín: R$ ${GOAL_CONSTANTS.MIN_CPL})`;
    } else if (cpl > GOAL_CONSTANTS.MAX_CPL) {
      errors.cpl_target = `CPL muito alto (máx: R$ ${GOAL_CONSTANTS.MAX_CPL})`;
    }

    // Volume validation
    const volumeContracted = parseInt(formData.volume_contracted);
    if (!formData.volume_contracted || isNaN(volumeContracted) || volumeContracted <= 0) {
      errors.volume_contracted = 'Volume contratado deve ser maior que zero';
    } else if (volumeContracted > GOAL_CONSTANTS.MAX_VOLUME) {
      errors.volume_contracted = `Volume máximo: ${GOAL_CONSTANTS.MAX_VOLUME}`;
    }

    const volumeCaptured = parseInt(formData.volume_captured);
    if (!formData.volume_captured || isNaN(volumeCaptured) || volumeCaptured < 0) {
      errors.volume_captured = 'Volume captado deve ser zero ou maior';
    } else if (volumeCaptured > volumeContracted) {
      errors.volume_captured = 'Volume captado não pode ser maior que o contratado';
    }

    // Date validation
    if (!formData.contract_start_date) {
      errors.contract_start_date = 'Data de início é obrigatória';
    }

    if (!formData.contract_end_date) {
      errors.contract_end_date = 'Data de fim é obrigatória';
    }

    if (formData.contract_start_date && formData.contract_end_date) {
      const startDate = new Date(formData.contract_start_date);
      const endDate = new Date(formData.contract_end_date);

      if (startDate >= endDate) {
        errors.contract_end_date = 'Data de fim deve ser posterior à data de início';
      } else {
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (totalDays < GOAL_CONSTANTS.MIN_CONTRACT_DAYS) {
          errors.general = `Período muito curto (mín: ${GOAL_CONSTANTS.MIN_CONTRACT_DAYS} dias)`;
        } else if (totalDays > GOAL_CONSTANTS.MAX_CONTRACT_DAYS) {
          errors.general = `Período muito longo (máx: ${GOAL_CONSTANTS.MAX_CONTRACT_DAYS} dias)`;
        }
      }
    }

    return errors;
  }, []);

  // Calculate metrics for a goal
  const calculateMetrics = useCallback((goal: AdsetGoal): GoalCalculations => {
    const today = new Date();
    const startDate = new Date(goal.contract_start_date);
    const endDate = new Date(goal.contract_end_date);

    const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const leadsNeededTotal = goal.volume_contracted - goal.volume_captured;
    const leadsNeededDaily = daysRemaining > 0 ? leadsNeededTotal / daysRemaining : 0;

    const budgetDaily = goal.budget_total / daysTotal;
    const budgetSpentEstimated = budgetDaily * daysElapsed;
    const budgetRemaining = goal.budget_total - budgetSpentEstimated;

    const progressPercentage = (goal.volume_captured / goal.volume_contracted) * 100;
    const timeProgressPercentage = (daysElapsed / daysTotal) * 100;
    const isOnTrack = progressPercentage >= (timeProgressPercentage - 10);

    const projectedFinalVolume = daysRemaining > 0 
      ? goal.volume_captured + (leadsNeededDaily * daysRemaining)
      : goal.volume_captured;

    const cplCurrentEstimated = goal.volume_captured > 0 
      ? budgetSpentEstimated / goal.volume_captured 
      : goal.cpl_target;

    return {
      days_total: daysTotal,
      days_remaining: daysRemaining,
      days_elapsed: daysElapsed,
      leads_needed_total: leadsNeededTotal,
      leads_needed_daily: leadsNeededDaily,
      budget_daily: budgetDaily,
      budget_remaining: budgetRemaining,
      budget_spent_estimated: budgetSpentEstimated,
      progress_percentage: progressPercentage,
      is_on_track: isOnTrack,
      projected_final_volume: projectedFinalVolume,
      cpl_current_estimated: cplCurrentEstimated
    };
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setGoals([]);
    setCurrentGoal(null);
    setCalculations(null);
    setValidation(null);
    setError(null);
  }, []);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      if (adsetId) {
        fetchGoal(adsetId);
      } else {
        fetchGoals();
      }
    }
  }, [autoFetch, adsetId, fetchGoal, fetchGoals]);

  return {
    // State
    goals,
    currentGoal,
    loading,
    saving,
    error,
    calculations,
    validation,
    
    // Actions
    fetchGoals,
    fetchGoal,
    saveGoal,
    updateGoal,
    deleteGoal,
    
    // Form helpers
    validateForm,
    calculateMetrics,
    
    // Utilities
    clearError,
    reset
  };
} 