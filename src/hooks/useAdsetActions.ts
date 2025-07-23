// Hook: useAdsetActions.ts
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import { useState, useCallback } from 'react';
import { ApplyBudgetAdjustmentRequest, ApplyBudgetAdjustmentResponse } from '@/types/metaBudgetAdjustment';

interface AdsetActionResult {
  success: boolean;
  message: string;
  details?: any;
}

interface UseAdsetActionsOptions {
  onSuccess?: (action: string, adset_id: string) => void;
  onError?: (action: string, error: string) => void;
}

interface UseAdsetActionsReturn {
  loading: boolean;
  adjustBudget: (adset_id: string, new_budget: number, reason: string) => Promise<AdsetActionResult>;
  pauseAdset: (adset_id: string, reason?: string) => Promise<AdsetActionResult>;
  resumeAdset: (adset_id: string, reason?: string) => Promise<AdsetActionResult>;
  testConnection: () => Promise<AdsetActionResult>;
}

export function useAdsetActions(options: UseAdsetActionsOptions = {}): UseAdsetActionsReturn {
  const [loading, setLoading] = useState(false);
  const { onSuccess, onError } = options;

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    // TODO: Integrar com sistema de toast quando implementado
    if (type === 'success') {
      console.log('✅ Success:', message);
    } else {
      console.error('❌ Error:', message);
    }
  }, []);

  const adjustBudget = useCallback(async (
    adset_id: string, 
    new_budget: number, 
    reason: string
  ): Promise<AdsetActionResult> => {
    if (loading) {
      return { success: false, message: 'Operação em andamento' };
    }

    try {
      setLoading(true);

      // Validações básicas
      if (!adset_id) {
        throw new Error('Adset ID é obrigatório');
      }

      if (!new_budget || new_budget <= 0) {
        throw new Error('Novo budget deve ser maior que zero');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Motivo do ajuste é obrigatório');
      }

      const requestData: ApplyBudgetAdjustmentRequest = {
        adset_id,
        new_budget,
        budget_type: 'daily', // Por padrão usar daily budget
        reason,
        user_id: 'dashboard-user' // TODO: Usar ID real do usuário
      };

      console.log('[useAdsetActions] Adjusting budget:', requestData);

      const response = await fetch('/api/budget-adjustments/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result: ApplyBudgetAdjustmentResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Falha ao ajustar budget');
      }

      const message = `Budget ajustado para R$ ${new_budget.toFixed(2)}`;
      showToast(message, 'success');
      onSuccess?.('adjust_budget', adset_id);

      return {
        success: true,
        message,
        details: {
          log_id: result.log_id,
          meta_response: result.meta_response,
          validation: result.validation_result
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[useAdsetActions] Budget adjustment failed:', error);
      
      showToast(`Erro ao ajustar budget: ${errorMessage}`, 'error');
      onError?.('adjust_budget', errorMessage);

      return {
        success: false,
        message: errorMessage,
        details: error
      };
    } finally {
      setLoading(false);
    }
  }, [loading, showToast, onSuccess, onError]);

  const pauseAdset = useCallback(async (
    adset_id: string, 
    reason = 'Pausado via dashboard'
  ): Promise<AdsetActionResult> => {
    if (loading) {
      return { success: false, message: 'Operação em andamento' };
    }

    try {
      setLoading(true);

      if (!adset_id) {
        throw new Error('Adset ID é obrigatório');
      }

      // TODO: Implementar pause via Meta API
      // Por enquanto, simular a operação
      console.log('[useAdsetActions] Pausing adset:', adset_id, 'Reason:', reason);

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simular sucesso
      const message = 'Adset pausado com sucesso';
      showToast(message, 'success');
      onSuccess?.('pause', adset_id);

      return {
        success: true,
        message,
        details: { adset_id, action: 'pause', reason }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[useAdsetActions] Pause failed:', error);
      
      showToast(`Erro ao pausar adset: ${errorMessage}`, 'error');
      onError?.('pause', errorMessage);

      return {
        success: false,
        message: errorMessage,
        details: error
      };
    } finally {
      setLoading(false);
    }
  }, [loading, showToast, onSuccess, onError]);

  const resumeAdset = useCallback(async (
    adset_id: string, 
    reason = 'Reativado via dashboard'
  ): Promise<AdsetActionResult> => {
    if (loading) {
      return { success: false, message: 'Operação em andamento' };
    }

    try {
      setLoading(true);

      if (!adset_id) {
        throw new Error('Adset ID é obrigatório');
      }

      // TODO: Implementar resume via Meta API
      // Por enquanto, simular a operação
      console.log('[useAdsetActions] Resuming adset:', adset_id, 'Reason:', reason);

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simular sucesso
      const message = 'Adset reativado com sucesso';
      showToast(message, 'success');
      onSuccess?.('resume', adset_id);

      return {
        success: true,
        message,
        details: { adset_id, action: 'resume', reason }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[useAdsetActions] Resume failed:', error);
      
      showToast(`Erro ao reativar adset: ${errorMessage}`, 'error');
      onError?.('resume', errorMessage);

      return {
        success: false,
        message: errorMessage,
        details: error
      };
    } finally {
      setLoading(false);
    }
  }, [loading, showToast, onSuccess, onError]);

  const testConnection = useCallback(async (): Promise<AdsetActionResult> => {
    try {
      setLoading(true);

      console.log('[useAdsetActions] Testing Meta API connection...');

      // Testar conexão com Meta API via endpoint de validação
      const response = await fetch('/api/budget-adjustments/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adset_id: 'test_connection' // Adset fictício para teste
        })
      });

      if (response.ok) {
        const message = 'Conexão com Meta API funcionando';
        showToast(message, 'success');
        return { success: true, message };
      } else {
        throw new Error('Falha na conexão com Meta API');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conectividade';
      console.error('[useAdsetActions] Connection test failed:', error);
      
      showToast(`Erro na conexão: ${errorMessage}`, 'error');
      
      return {
        success: false,
        message: errorMessage,
        details: error
      };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    adjustBudget,
    pauseAdset,
    resumeAdset,
    testConnection
  };
} 