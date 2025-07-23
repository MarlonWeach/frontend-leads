// Service: budgetAdjustmentEngine.ts
// PBI 25 - Task 25-9: Integração Meta API para Ajustes de Budget

import metaBudgetService from './meta/budgetAdjustment';
import {
  createBudgetAdjustmentLog,
  updateBudgetAdjustmentLog,
  validateBudgetAdjustmentFrequency,
  createAdjustmentContext
} from './budgetAdjustmentLogService';
import {
  ApplyBudgetAdjustmentRequest,
  ApplyBudgetAdjustmentResponse,
  BatchBudgetAdjustmentRequest,
  BatchBudgetAdjustmentResponse,
  RollbackBudgetAdjustmentRequest,
  RollbackBudgetAdjustmentResponse,
  BudgetAdjustmentEngineOptions,
  DEFAULT_BUDGET_RULES,
  BudgetAdjustmentContext
} from '@/types/metaBudgetAdjustment';

class BudgetAdjustmentEngine {
  private options: BudgetAdjustmentEngineOptions;

  constructor(options: BudgetAdjustmentEngineOptions = {}) {
    this.options = {
      rules: { ...DEFAULT_BUDGET_RULES, ...options.rules },
      dry_run: options.dry_run || false,
      bypass_frequency_check: options.bypass_frequency_check || false,
      auto_rollback_on_error: options.auto_rollback_on_error || true,
      notification_webhook: options.notification_webhook
    };
  }

  /**
   * Aplica ajuste de budget em um adset
   */
  async applyBudgetAdjustment(
    request: ApplyBudgetAdjustmentRequest
  ): Promise<ApplyBudgetAdjustmentResponse> {
    const { adset_id, new_budget, budget_type, reason, user_id, force } = request;

    try {
      console.log(`[Budget Engine] Starting adjustment for adset ${adset_id}: ${new_budget}`);

      // 1. Validar frequência (a menos que force seja true)
      if (!force && !this.options.bypass_frequency_check) {
        const validation = await validateBudgetAdjustmentFrequency({ adset_id });
        
        if (!validation.success || !validation.can_adjust) {
          return {
            success: false,
            validation_result: {
              can_adjust: validation.can_adjust,
              adjustments_in_last_hour: validation.adjustments_in_last_hour,
              remaining_adjustments: validation.remaining_adjustments,
              next_available_time: validation.next_available_time
            },
            error: `Limite de frequência excedido: ${validation.adjustments_in_last_hour}/4 ajustes na última hora`
          };
        }
      }

      // 2. Validar adset via Meta API
      const adsetValidation = await metaBudgetService.validateAdset(adset_id);
      if (!adsetValidation.is_valid) {
        return {
          success: false,
          error: `Adset inválido: ${adsetValidation.errors.join(', ')}`
        };
      }

      const adsetInfo = adsetValidation.adset_info!;
      const currentBudget = budget_type === 'daily' 
        ? parseFloat(adsetInfo.daily_budget || '0') / 100 // Meta API retorna em centavos
        : parseFloat(adsetInfo.lifetime_budget || '0') / 100;

      // 3. Validar regras de negócio
      const ruleValidation = this.validateBudgetRules(currentBudget, new_budget);
      if (!ruleValidation.valid) {
        return {
          success: false,
          error: `Regra violada: ${ruleValidation.reason}`
        };
      }

      // 4. Criar contexto do ajuste
      const context = createAdjustmentContext({
        additional_data: {
          old_budget: currentBudget,
          budget_type,
          adset_name: adsetInfo.name,
          campaign_id: adsetInfo.campaign_id
        }
      });

      // 5. Criar log pendente
      const logResult = await createBudgetAdjustmentLog({
        adset_id,
        campaign_id: adsetInfo.campaign_id,
        old_budget: currentBudget,
        new_budget,
        reason,
        trigger_type: user_id ? 'manual' : 'automatic',
        context,
        user_id,
        applied_by: user_id || 'system'
      });

      if (!logResult.success || !logResult.log_id) {
        return {
          success: false,
          error: `Falha ao criar log: ${logResult.error}`
        };
      }

      const logId = logResult.log_id;

      // 6. Aplicar ajuste via Meta API (se não for dry run)
      let metaResponse;
      let rollbackNeeded = false;

      if (!this.options.dry_run) {
        try {
          metaResponse = await metaBudgetService.adjustAdsetBudget(adset_id, {
            adset_id,
            [budget_type === 'daily' ? 'daily_budget' : 'lifetime_budget']: new_budget
          });

          if (!metaResponse.success) {
            rollbackNeeded = this.options.auto_rollback_on_error || false;
            
            // Atualizar log como failed
            await updateBudgetAdjustmentLog({
              log_id: logId,
              status: 'failed',
              error_message: metaResponse.error?.message || 'Erro da Meta API',
              meta_response: metaResponse
            });

            return {
              success: false,
              log_id: logId,
              meta_response: metaResponse,
              error: `Meta API falhou: ${metaResponse.error?.message}`,
              rolled_back: rollbackNeeded
            };
          }

          // Sucesso - atualizar log
          await updateBudgetAdjustmentLog({
            log_id: logId,
            status: 'applied',
            meta_response: metaResponse
          });

          console.log(`[Budget Engine] Successfully adjusted budget for adset ${adset_id}`);

        } catch (error) {
          rollbackNeeded = this.options.auto_rollback_on_error || false;
          
          await updateBudgetAdjustmentLog({
            log_id: logId,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          });

          return {
            success: false,
            log_id: logId,
            error: `Erro na aplicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            rolled_back: rollbackNeeded
          };
        }
      } else {
        // Dry run - simular sucesso
        await updateBudgetAdjustmentLog({
          log_id: logId,
          status: 'applied',
          meta_response: {
            success: true,
            data: {
              adset_id,
              [budget_type === 'daily' ? 'daily_budget' : 'lifetime_budget']: (new_budget * 100).toString(),
              updated_time: new Date().toISOString()
            }
          }
        });

        console.log(`[Budget Engine] DRY RUN: Would adjust budget for adset ${adset_id} to ${new_budget}`);
      }

      // 7. Notificar webhook se configurado
      if (this.options.notification_webhook) {
        await this.notifyWebhook({
          event: 'budget_adjusted',
          adset_id,
          old_budget: currentBudget,
          new_budget,
          log_id: logId,
          success: true
        });
      }

      return {
        success: true,
        log_id: logId,
        meta_response: metaResponse,
        validation_result: {
          can_adjust: true,
          adjustments_in_last_hour: 0,
          remaining_adjustments: 0
        }
      };

    } catch (error) {
      console.error('[Budget Engine] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado'
      };
    }
  }

  /**
   * Aplica múltiplos ajustes em lote
   */
  async applyBatchBudgetAdjustments(
    request: BatchBudgetAdjustmentRequest
  ): Promise<BatchBudgetAdjustmentResponse> {
    const { adjustments, user_id, max_concurrent = 3, stop_on_error = false } = request;
    
    const results: BatchBudgetAdjustmentResponse['results'] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`[Budget Engine] Starting batch adjustment of ${adjustments.length} adsets`);

    // Processar em lotes para evitar sobrecarga
    const batches = this.chunkArray(adjustments, max_concurrent);

    for (const batch of batches) {
      const promises = batch.map(async (adjustment) => {
        try {
          const result = await this.applyBudgetAdjustment({
            adset_id: adjustment.adset_id,
            new_budget: adjustment.new_budget,
            budget_type: adjustment.budget_type,
            reason: adjustment.reason,
            user_id
          });

          if (result.success) {
            successful++;
            return {
              adset_id: adjustment.adset_id,
              status: 'success' as const,
              log_id: result.log_id,
              meta_response: result.meta_response
            };
          } else {
            if (result.validation_result && !result.validation_result.can_adjust) {
              skipped++;
              return {
                adset_id: adjustment.adset_id,
                status: 'skipped' as const,
                error: result.error
              };
            } else {
              failed++;
              return {
                adset_id: adjustment.adset_id,
                status: 'failed' as const,
                log_id: result.log_id,
                error: result.error
              };
            }
          }
        } catch (error) {
          failed++;
          return {
            adset_id: adjustment.adset_id,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Erro inesperado'
          };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Parar se houver erro e stop_on_error for true
      if (stop_on_error && batchResults.some(r => r.status === 'failed')) {
        console.log('[Budget Engine] Stopping batch due to error');
        break;
      }

      // Pequeno delay entre lotes para não sobrecarregar
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const rateLimitInfo = metaBudgetService.getRateLimitInfo();

    return {
      success: failed === 0,
      total_requested: adjustments.length,
      successful,
      failed,
      skipped,
      results,
      rate_limit_info: rateLimitInfo || undefined
    };
  }

  /**
   * Reverte um ajuste de budget
   */
  async rollbackBudgetAdjustment(
    request: RollbackBudgetAdjustmentRequest
  ): Promise<RollbackBudgetAdjustmentResponse> {
    // Implementação de rollback será feita em uma task futura
    // Por enquanto, retornar não implementado
    return {
      success: false,
      original_log_id: request.log_id,
      error: 'Rollback não implementado ainda'
    };
  }

  /**
   * Valida regras de negócio para ajustes de budget
   */
  private validateBudgetRules(
    currentBudget: number,
    newBudget: number
  ): { valid: boolean; reason?: string } {
    const rules = this.options.rules!;
    
    // Validar budget mínimo
    if (newBudget < rules.min_budget_amount!) {
      return {
        valid: false,
        reason: `Budget mínimo é R$ ${rules.min_budget_amount}`
      };
    }

    // Validar budget máximo
    if (newBudget > rules.max_budget_amount!) {
      return {
        valid: false,
        reason: `Budget máximo é R$ ${rules.max_budget_amount}`
      };
    }

    if (currentBudget > 0) {
      const changePercentage = ((newBudget - currentBudget) / currentBudget) * 100;

      // Validar aumento máximo
      if (changePercentage > rules.max_increase_percentage!) {
        return {
          valid: false,
          reason: `Aumento máximo é ${rules.max_increase_percentage}%`
        };
      }

      // Validar redução máxima
      if (changePercentage < -rules.max_decrease_percentage!) {
        return {
          valid: false,
          reason: `Redução máxima é ${rules.max_decrease_percentage}%`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Divide array em chunks menores
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Notifica webhook sobre eventos
   */
  private async notifyWebhook(data: any): Promise<void> {
    if (!this.options.notification_webhook) return;

    try {
      await fetch(this.options.notification_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...data
        })
      });
    } catch (error) {
      console.error('[Budget Engine] Webhook notification failed:', error);
    }
  }
}

// Factory function para criar instâncias
export function createBudgetAdjustmentEngine(
  options?: BudgetAdjustmentEngineOptions
): BudgetAdjustmentEngine {
  return new BudgetAdjustmentEngine(options);
}

// Instância padrão
export const budgetAdjustmentEngine = new BudgetAdjustmentEngine();
export default budgetAdjustmentEngine; 