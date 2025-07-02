import { logger } from './logger';
import { captureError } from '../lib/sentry';

// Interface para configuração de alertas
export interface AlertConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  dashboard?: {
    enabled: boolean;
    maxAlerts: number;
  };
}

// Interface para alerta
export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notifications: {
    email: boolean;
    slack: boolean;
    dashboard: boolean;
  };
}

// Classe para gerenciamento de alertas
export class AlertManager {
  private alerts: Alert[] = [];
  private config: AlertConfig;

  constructor(config: AlertConfig = {}) {
    this.config = {
      email: { enabled: false, recipients: [], smtp: { host: '', port: 587, secure: false, auth: { user: '', pass: '' } } },
      slack: { enabled: false, webhookUrl: '', channel: '' },
      dashboard: { enabled: true, maxAlerts: 100 },
      ...config
    };
  }

  // Criar novo alerta
  async createAlert(
    level: Alert['level'],
    category: string,
    title: string,
    message: string,
    context?: Record<string, any>
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      context,
      acknowledged: false,
      notifications: {
        email: false,
        slack: false,
        dashboard: false
      }
    };

    this.alerts.push(alert);

    // Manter apenas os alertas mais recentes
    if (this.alerts.length > (this.config.dashboard?.maxAlerts || 100)) {
      this.alerts = this.alerts.slice(-(this.config.dashboard?.maxAlerts || 100));
    }

    // Enviar notificações
    await this.sendNotifications(alert);

    // Log do alerta
    logger.warn({
      msg: 'Alerta criado',
      alert: {
        id: alert.id,
        level: alert.level,
        category: alert.category,
        title: alert.title,
        message: alert.message
      },
      context
    });

    // Capturar no Sentry se for crítico
    if (alert.level === 'critical') {
      captureError(new Error(alert.message), { ...context, alertId: alert.id });
    }

    return alert;
  }

  // Enviar notificações
  private async sendNotifications(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Notificação por email
    if (this.config.email?.enabled && this.shouldSendEmail(alert)) {
      promises.push(this.sendEmailNotification(alert));
    }

    // Notificação por Slack
    if (this.config.slack?.enabled && this.shouldSendSlack(alert)) {
      promises.push(this.sendSlackNotification(alert));
    }

    // Notificação no dashboard
    if (this.config.dashboard?.enabled) {
      alert.notifications.dashboard = true;
    }

    // Executar notificações em paralelo
    await Promise.allSettled(promises);
  }

  // Verificar se deve enviar email
  private shouldSendEmail(alert: Alert): boolean {
    // Enviar emails apenas para alertas de warning, error e critical
    return ['warning', 'error', 'critical'].includes(alert.level);
  }

  // Verificar se deve enviar Slack
  private shouldSendSlack(alert: Alert): boolean {
    // Enviar Slack apenas para alertas de error e critical
    return ['error', 'critical'].includes(alert.level);
  }

  // Enviar notificação por email
  private async sendEmailNotification(alert: Alert): Promise<void> {
    try {
      // Implementar envio de email usando nodemailer ou similar
      // Por enquanto, apenas logar
      logger.info({
        msg: 'Notificação por email enviada',
        alertId: alert.id,
        recipients: this.config.email?.recipients,
        level: alert.level,
        title: alert.title
      });

      alert.notifications.email = true;
    } catch (error) {
      logger.error({
        msg: 'Erro ao enviar notificação por email',
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Enviar notificação por Slack
  private async sendSlackNotification(alert: Alert): Promise<void> {
    try {
      if (!this.config.slack?.webhookUrl) {
        throw new Error('Webhook URL do Slack não configurada');
      }

      const payload = {
        channel: this.config.slack.channel,
        text: `🚨 *${alert.title}*`,
        attachments: [
          {
            color: this.getSlackColor(alert.level),
            fields: [
              {
                title: 'Categoria',
                value: alert.category,
                short: true
              },
              {
                title: 'Nível',
                value: alert.level.toUpperCase(),
                short: true
              },
              {
                title: 'Mensagem',
                value: alert.message,
                short: false
              },
              {
                title: 'Timestamp',
                value: new Date(alert.timestamp).toLocaleString('pt-BR'),
                short: true
              }
            ],
            footer: 'Sistema de Alertas',
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
          }
        ]
      };

      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      logger.info({
        msg: 'Notificação por Slack enviada',
        alertId: alert.id,
        channel: this.config.slack.channel,
        level: alert.level
      });

      alert.notifications.slack = true;
    } catch (error) {
      logger.error({
        msg: 'Erro ao enviar notificação por Slack',
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Obter cor do Slack baseada no nível do alerta
  private getSlackColor(level: Alert['level']): string {
    switch (level) {
      case 'info':
        return '#36a64f'; // Verde
      case 'warning':
        return '#ffa500'; // Laranja
      case 'error':
        return '#ff0000'; // Vermelho
      case 'critical':
        return '#8b0000'; // Vermelho escuro
      default:
        return '#808080'; // Cinza
    }
  }

  // Obter alertas não reconhecidos
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Obter alertas por nível
  getAlertsByLevel(level: Alert['level']): Alert[] {
    return this.alerts.filter(alert => alert.level === level);
  }

  // Obter alertas por categoria
  getAlertsByCategory(category: string): Alert[] {
    return this.alerts.filter(alert => alert.category === category);
  }

  // Reconhecer alerta
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();

      logger.info({
        msg: 'Alerta reconhecido',
        alertId,
        acknowledgedBy
      });

      return true;
    }
    return false;
  }

  // Limpar alertas antigos
  cleanupOldAlerts(maxAge: number = 30 * 24 * 60 * 60 * 1000): void { // 30 dias
    const cutoff = Date.now() - maxAge;
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoff
    );

    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      logger.info({
        msg: 'Alertas antigos removidos',
        removedCount,
        remainingCount: this.alerts.length
      });
    }
  }

  // Obter estatísticas de alertas
  getAlertStats(): {
    total: number;
    unacknowledged: number;
    byLevel: Record<Alert['level'], number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<Alert['level'], number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    };

    const byCategory: Record<string, number> = {};

    this.alerts.forEach(alert => {
      byLevel[alert.level]++;
      byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
    });

    return {
      total: this.alerts.length,
      unacknowledged: this.getUnacknowledgedAlerts().length,
      byLevel,
      byCategory
    };
  }
}

// Instância global do gerenciador de alertas
export const alertManager = new AlertManager();

// Funções utilitárias para criar alertas específicos
export async function createSystemAlert(
  level: Alert['level'],
  title: string,
  message: string,
  context?: Record<string, any>
): Promise<Alert> {
  return alertManager.createAlert(level, 'system', title, message, context);
}

export async function createPerformanceAlert(
  level: Alert['level'],
  title: string,
  message: string,
  context?: Record<string, any>
): Promise<Alert> {
  return alertManager.createAlert(level, 'performance', title, message, context);
}

export async function createSecurityAlert(
  level: Alert['level'],
  title: string,
  message: string,
  context?: Record<string, any>
): Promise<Alert> {
  return alertManager.createAlert(level, 'security', title, message, context);
}

export async function createAPIALert(
  level: Alert['level'],
  title: string,
  message: string,
  context?: Record<string, any>
): Promise<Alert> {
  return alertManager.createAlert(level, 'api', title, message, context);
}

export async function createDatabaseAlert(
  level: Alert['level'],
  title: string,
  message: string,
  context?: Record<string, any>
): Promise<Alert> {
  return alertManager.createAlert(level, 'database', title, message, context);
}

// Função para monitorar erros e criar alertas automaticamente
export function setupErrorMonitoring(): void {
  process.on('uncaughtException', async (error) => {
    await createSystemAlert(
      'critical',
      'Exceção não capturada',
      error.message,
      { stack: error.stack }
    );
  });

  process.on('unhandledRejection', async (reason) => {
    await createSystemAlert(
      'critical',
      'Promise rejeitada não tratada',
      reason instanceof Error ? reason.message : String(reason),
      { reason }
    );
  });
}

// Função para configurar alertas de performance
export function setupPerformanceMonitoring(): void {
  // Monitorar uso de memória
  setInterval(() => {
    const used = process.memoryUsage();
    const usage = used.heapUsed / used.heapTotal;

    if (usage > 0.8) {
      createPerformanceAlert(
        'warning',
        'Uso de memória alto',
        `Uso de memória: ${(usage * 100).toFixed(2)}%`,
        { usage, memoryUsage: used }
      );
    }
  }, 5 * 60 * 1000); // Verificar a cada 5 minutos
} 