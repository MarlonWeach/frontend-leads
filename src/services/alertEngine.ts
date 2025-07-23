// Service: alertEngine.ts
// PBI 25 - Task 25-10: Sistema de Alertas Inteligentes

import { supabase } from '@/lib/supabaseClient';
import {
  AlertRule,
  AlertType,
  AlertSeverity,
  Alert,
  AlertContext,
  CreateAlertRequest,
  CreateAlertResponse,
  AlertCheckResult,
  AlertEngineRunResult,
  AlertEngineConfig,
  AlertThresholds
} from '@/types/alertSystem';

const DEFAULT_CONFIG: AlertEngineConfig = {
  monitoring_interval_minutes: 60,
  max_alerts_per_run: 100,
  notification_retry_attempts: 3,
  notification_retry_delay_ms: 5000,
  enable_email_notifications: true,
  enable_webhook_notifications: true,
  default_notification_template: 'default'
};

class AlertEngine {
  private config: AlertEngineConfig;
  private isRunning: boolean = false;

  constructor(config: Partial<AlertEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Executa uma verificação completa de todos os adsets
   */
  async runMonitoringCycle(): Promise<AlertEngineRunResult> {
    if (this.isRunning) {
      return {
        success: false,
        adsets_checked: 0,
        total_alerts_generated: 0,
        total_alerts_suppressed: 0,
        notifications_sent: 0,
        errors: ['Monitoring cycle already running'],
        execution_time_ms: 0
      };
    }

    const startTime = Date.now();
    this.isRunning = true;

    try {
      console.log('[Alert Engine] Starting monitoring cycle...');

      // 1. Buscar todas as regras ativas
      const { data: rules, error: rulesError } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) {
        throw new Error(`Error fetching alert rules: ${rulesError.message}`);
      }

      if (!rules || rules.length === 0) {
        console.log('[Alert Engine] No active alert rules found');
        return {
          success: true,
          adsets_checked: 0,
          total_alerts_generated: 0,
          total_alerts_suppressed: 0,
          notifications_sent: 0,
          errors: [],
          execution_time_ms: Date.now() - startTime
        };
      }

      // 2. Buscar adsets com metas configuradas
      const { data: adsetGoals, error: goalsError } = await supabase
        .from('adset_goals')
        .select('*, adsets(adset_id, name, campaign_id)');

      if (goalsError) {
        throw new Error(`Error fetching adset goals: ${goalsError.message}`);
      }

      const adsets = adsetGoals || [];
      console.log(`[Alert Engine] Checking ${adsets.length} adsets against ${rules.length} rules`);

      // 3. Verificar cada adset
      const checkResults: AlertCheckResult[] = [];
      let totalAlertsGenerated = 0;
      let totalAlertsSuppressed = 0;
      let totalNotificationsSent = 0;

      for (const adsetGoal of adsets) {
        if (checkResults.length >= this.config.max_alerts_per_run) {
          console.log('[Alert Engine] Max alerts per run reached, stopping');
          break;
        }

        const result = await this.checkAdsetForAlerts(adsetGoal, rules);
        checkResults.push(result);
        
        totalAlertsGenerated += result.alerts_generated;
        totalAlertsSuppressed += result.alerts_suppressed;
      }

      // 4. Processar notificações pendentes
      totalNotificationsSent = await this.processNotifications();

      const executionTime = Date.now() - startTime;
      console.log(`[Alert Engine] Cycle completed in ${executionTime}ms. Generated: ${totalAlertsGenerated}, Suppressed: ${totalAlertsSuppressed}, Notifications: ${totalNotificationsSent}`);

      return {
        success: true,
        adsets_checked: checkResults.length,
        total_alerts_generated: totalAlertsGenerated,
        total_alerts_suppressed: totalAlertsSuppressed,
        notifications_sent: totalNotificationsSent,
        errors: checkResults.flatMap(r => r.errors),
        execution_time_ms: executionTime
      };

    } catch (error) {
      console.error('[Alert Engine] Error during monitoring cycle:', error);
      return {
        success: false,
        adsets_checked: 0,
        total_alerts_generated: 0,
        total_alerts_suppressed: 0,
        notifications_sent: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        execution_time_ms: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Verifica um adset específico contra todas as regras aplicáveis
   */
  async checkAdsetForAlerts(adsetGoal: any, rules: AlertRule[]): Promise<AlertCheckResult> {
    const startTime = Date.now();
    const adset_id = adsetGoal.adset_id;
    const campaign_id = adsetGoal.campaign_id;
    
    let checksPerformed = 0;
    let alertsGenerated = 0;
    let alertsSuppressed = 0;
    const errors: string[] = [];

    try {
      // Buscar dados de progresso atual
      const { data: progress } = await supabase
        .from('adset_progress_tracking')
        .select('*')
        .eq('adset_id', adset_id)
        .single();

      if (!progress) {
        console.log(`[Alert Engine] No progress data for adset ${adset_id}`);
        return {
          adset_id,
          campaign_id,
          checks_performed: 0,
          alerts_generated: 0,
          alerts_suppressed: 0,
          errors: ['No progress data available'],
          processing_time_ms: Date.now() - startTime
        };
      }

      // Filtrar regras aplicáveis a este adset
      const applicableRules = rules.filter(rule => 
        !rule.adset_id || rule.adset_id === adset_id ||
        (!rule.adset_id && rule.campaign_id === campaign_id) ||
        (!rule.adset_id && !rule.campaign_id) // Regra global
      );

      console.log(`[Alert Engine] Checking adset ${adset_id} against ${applicableRules.length} applicable rules`);

      // Verificar cada regra
      for (const rule of applicableRules) {
        checksPerformed++;
        
        try {
          const shouldAlert = await this.evaluateRule(rule, adsetGoal, progress);
          
          if (shouldAlert.shouldGenerate) {
            // Verificar se deve suprimir por cooldown
            const { data: suppressCheck } = await supabase
              .rpc('should_suppress_alert', {
                p_rule_id: rule.id,
                p_adset_id: adset_id,
                p_alert_type: rule.alert_type
              });

            if (suppressCheck) {
              alertsSuppressed++;
              console.log(`[Alert Engine] Alert suppressed for adset ${adset_id}, rule ${rule.id} (cooldown)`);
            } else {
              // Gerar alerta
              const alertResponse = await this.createAlert({
                rule_id: rule.id,
                adset_id,
                campaign_id,
                alert_type: rule.alert_type,
                severity: rule.severity,
                title: shouldAlert.title,
                message: shouldAlert.message,
                context: shouldAlert.context,
                suggested_actions: shouldAlert.suggestedActions
              });

              if (alertResponse.success) {
                alertsGenerated++;
                console.log(`[Alert Engine] Alert generated for adset ${adset_id}: ${shouldAlert.title}`);
              } else {
                errors.push(`Failed to create alert: ${alertResponse.error}`);
              }
            }
          }
        } catch (ruleError) {
          errors.push(`Error evaluating rule ${rule.id}: ${ruleError instanceof Error ? ruleError.message : String(ruleError)}`);
        }
      }

    } catch (error) {
      errors.push(`Error checking adset ${adset_id}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      adset_id,
      campaign_id,
      checks_performed: checksPerformed,
      alerts_generated: alertsGenerated,
      alerts_suppressed: alertsSuppressed,
      errors,
      processing_time_ms: Date.now() - startTime
    };
  }

  /**
   * Avalia se uma regra deve gerar um alerta
   */
  private async evaluateRule(
    rule: AlertRule, 
    adsetGoal: any, 
    progress: any
  ): Promise<{
    shouldGenerate: boolean;
    title: string;
    message: string;
    context: AlertContext;
    suggestedActions: string[];
  }> {
    const { alert_type, thresholds } = rule;
    const adset_name = adsetGoal.adsets?.name || `Adset ${adsetGoal.adset_id}`;

    switch (alert_type) {
      case 'goal_deviation':
        return this.checkGoalDeviation(adsetGoal, progress, thresholds, adset_name);
      
      case 'high_cpl':
        return this.checkHighCPL(adsetGoal, progress, thresholds, adset_name);
      
      case 'budget_depletion':
        return this.checkBudgetDepletion(adsetGoal, progress, thresholds, adset_name);
      
      case 'quality_drop':
        return this.checkQualityDrop(adsetGoal, progress, thresholds, adset_name);
      
      case 'performance_anomaly':
        return this.checkPerformanceAnomaly(adsetGoal, progress, thresholds, adset_name);
      
      default:
        return {
          shouldGenerate: false,
          title: '',
          message: '',
          context: {},
          suggestedActions: []
        };
    }
  }

  /**
   * Verifica desvio de meta
   */
  private checkGoalDeviation(adsetGoal: any, progress: any, thresholds: AlertThresholds, adset_name: string) {
    const startDate = new Date(adsetGoal.data_inicio);
    const endDate = new Date(adsetGoal.data_fim);
    const today = new Date();
    
    const daysTotal = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const timeProgressPercentage = (daysElapsed / daysTotal) * 100;
    const leadsProgressPercentage = (progress.leads_generated / adsetGoal.volume_contratado) * 100;
    const deviation = leadsProgressPercentage - timeProgressPercentage;

    const minDaysElapsed = thresholds.min_days_elapsed || 2;
    const deviationThreshold = thresholds.deviation_threshold || 15;

    if (daysElapsed < minDaysElapsed) {
      return {
        shouldGenerate: false,
        title: '',
        message: '',
        context: {},
        suggestedActions: []
      };
    }

    if (deviation < -deviationThreshold) {
      return {
        shouldGenerate: true,
        title: `Meta em Risco - ${adset_name}`,
        message: `Adset está ${Math.abs(deviation).toFixed(1)}% atrás da meta. ${progress.leads_generated} leads gerados de ${adsetGoal.volume_contratado} necessários (${leadsProgressPercentage.toFixed(1)}% vs ${timeProgressPercentage.toFixed(1)}% do tempo decorrido).`,
        context: {
          current_metrics: {
            progress_percentage: leadsProgressPercentage,
            leads_generated: progress.leads_generated
          },
          targets: {
            volume_target: adsetGoal.volume_contratado
          },
          comparison: {
            deviation_percentage: deviation
          }
        },
        suggestedActions: [
          'Aumentar budget diário para acelerar entrega',
          'Revisar segmentação de audiência',
          'Otimizar criativos para melhor performance'
        ]
      };
    }

    return {
      shouldGenerate: false,
      title: '',
      message: '',
      context: {},
      suggestedActions: []
    };
  }

  /**
   * Verifica CPL elevado
   */
  private checkHighCPL(adsetGoal: any, progress: any, thresholds: AlertThresholds, adset_name: string) {
    const cplThresholdPercentage = thresholds.cpl_threshold_percentage || 20;
    const minLeads = thresholds.min_leads || 3;

    if (progress.leads_generated < minLeads) {
      return {
        shouldGenerate: false,
        title: '',
        message: '',
        context: {},
        suggestedActions: []
      };
    }

    const cplIncrease = ((progress.current_cpl - adsetGoal.cpl_alvo) / adsetGoal.cpl_alvo) * 100;

    if (cplIncrease > cplThresholdPercentage) {
      return {
        shouldGenerate: true,
        title: `CPL Elevado - ${adset_name}`,
        message: `CPL atual (R$${progress.current_cpl.toFixed(2)}) está ${cplIncrease.toFixed(1)}% acima da meta (R$${adsetGoal.cpl_alvo.toFixed(2)}).`,
        context: {
          current_metrics: {
            cpl: progress.current_cpl,
            leads_generated: progress.leads_generated
          },
          targets: {
            cpl_target: adsetGoal.cpl_alvo
          }
        },
        suggestedActions: [
          'Revisar audiência para melhor qualidade',
          'Testar novos criativos',
          'Considerar reduzir budget temporariamente'
        ]
      };
    }

    return {
      shouldGenerate: false,
      title: '',
      message: '',
      context: {},
      suggestedActions: []
    };
  }

  /**
   * Verifica esgotamento de budget
   */
  private checkBudgetDepletion(adsetGoal: any, progress: any, thresholds: AlertThresholds, adset_name: string) {
    const budgetUsedThreshold = thresholds.budget_used_threshold || 90;
    const goalProgressThreshold = thresholds.goal_progress_threshold || 70;

    const budgetUsedPercentage = (progress.budget_spent / adsetGoal.budget_maximo) * 100;
    const goalProgressPercentage = (progress.leads_generated / adsetGoal.volume_contratado) * 100;

    if (budgetUsedPercentage > budgetUsedThreshold && goalProgressPercentage < goalProgressThreshold) {
      return {
        shouldGenerate: true,
        title: `Budget Esgotando - ${adset_name}`,
        message: `${budgetUsedPercentage.toFixed(1)}% do budget usado mas apenas ${goalProgressPercentage.toFixed(1)}% da meta atingida.`,
        context: {
          current_metrics: {
            budget_used_percentage: budgetUsedPercentage,
            progress_percentage: goalProgressPercentage
          },
          targets: {
            budget_target: adsetGoal.budget_maximo,
            volume_target: adsetGoal.volume_contratado
          }
        },
        suggestedActions: [
          'Avaliar se deve aumentar budget',
          'Otimizar para melhor eficiência',
          'Revisar metas do período'
        ]
      };
    }

    return {
      shouldGenerate: false,
      title: '',
      message: '',
      context: {},
      suggestedActions: []
    };
  }

  /**
   * Verifica queda de qualidade (placeholder - requer implementação de scoring)
   */
  private checkQualityDrop(adsetGoal: any, progress: any, thresholds: AlertThresholds, adset_name: string) {
    // TODO: Implementar quando sistema de qualidade de leads estiver completo
    return {
      shouldGenerate: false,
      title: '',
      message: '',
      context: {},
      suggestedActions: []
    };
  }

  /**
   * Verifica anomalias de performance (placeholder)
   */
  private checkPerformanceAnomaly(adsetGoal: any, progress: any, thresholds: AlertThresholds, adset_name: string) {
    // TODO: Implementar detecção de anomalias baseada em histórico
    return {
      shouldGenerate: false,
      title: '',
      message: '',
      context: {},
      suggestedActions: []
    };
  }

  /**
   * Cria um novo alerta
   */
  async createAlert(request: CreateAlertRequest): Promise<CreateAlertResponse> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          rule_id: request.rule_id,
          adset_id: request.adset_id,
          campaign_id: request.campaign_id,
          alert_type: request.alert_type,
          severity: request.severity,
          title: request.title,
          message: request.message,
          context: request.context,
          suggested_actions: request.suggested_actions || [],
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Agendar notificações
      const notificationsSent = await this.scheduleNotifications(data);

      return {
        success: true,
        alert: data,
        notifications_sent: notificationsSent
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Agenda notificações para um alerta
   */
  private async scheduleNotifications(alert: Alert): Promise<number> {
    try {
      // Buscar regra para saber quais canais notificar
      const { data: rule } = await supabase
        .from('alert_rules')
        .select('notification_channels, notification_template')
        .eq('id', alert.rule_id)
        .single();

      if (!rule || !rule.notification_channels) {
        return 0;
      }

      let notificationsScheduled = 0;

      for (const channel of rule.notification_channels) {
        const notificationData = {
          alert_id: alert.id,
          rule_id: alert.rule_id,
          channel,
          content: this.generateNotificationContent(alert, channel),
          template_used: rule.notification_template || 'default',
          status: 'pending'
        };

        if (channel === 'email') {
          // TODO: Adicionar recipient baseado na configuração
          notificationData['subject'] = alert.title;
        }

        const { error } = await supabase
          .from('alert_notifications')
          .insert(notificationData);

        if (!error) {
          notificationsScheduled++;
        }
      }

      return notificationsScheduled;
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      return 0;
    }
  }

  /**
   * Gera conteúdo da notificação
   */
  private generateNotificationContent(alert: Alert, channel: string): string {
    if (channel === 'email') {
      return `
        <h3>${alert.title}</h3>
        <p>${alert.message}</p>
        ${alert.suggested_actions.length > 0 ? `
        <h4>Ações Sugeridas:</h4>
        <ul>
          ${alert.suggested_actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
        ` : ''}
        <p><small>Gerado em: ${new Date(alert.created_at).toLocaleString('pt-BR')}</small></p>
      `;
    }

    // Para webhook e outros canais, retornar JSON
    return JSON.stringify({
      alert_id: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      adset_id: alert.adset_id,
      suggested_actions: alert.suggested_actions,
      created_at: alert.created_at
    });
  }

  /**
   * Processa notificações pendentes
   */
  private async processNotifications(): Promise<number> {
    // TODO: Implementar processamento real de notificações
    // Por enquanto, marcar como enviadas
    
    const { data: notifications } = await supabase
      .from('alert_notifications')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (!notifications) return 0;

    let sent = 0;
    for (const notification of notifications) {
      // Simular envio
      const { error } = await supabase
        .from('alert_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (!error) sent++;
    }

    return sent;
  }
}

// Singleton instance
export const alertEngine = new AlertEngine();
export default alertEngine; 