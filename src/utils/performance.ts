import { logger } from './logger';
import { captureError } from '../lib/sentry';

// Interface para métricas de performance
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
  context?: Record<string, any>;
}

// Interface para health check
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

// Interface para alerta
export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  acknowledged?: boolean;
}

// Classe para monitoramento de performance
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private thresholds: Record<string, number> = {
    slowQuery: 1000, // 1 segundo
    slowRequest: 5000, // 5 segundos
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
  };

  constructor(private maxMetrics: number = 1000) {}

  // Registrar métrica de performance
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Verificar se excede threshold
    this.checkThresholds(metric);

    // Log da métrica
    logger.info({
      msg: 'Métrica de performance registrada',
      ...metric
    });
  }

  // Verificar thresholds e criar alertas
  private checkThresholds(metric: PerformanceMetrics): void {
    const threshold = this.thresholds[metric.operation] || this.thresholds.slowRequest;
    
    if (metric.duration > threshold) {
      this.createAlert({
        level: 'warning',
        message: `Operação ${metric.operation} está lenta: ${metric.duration}ms`,
        context: {
          operation: metric.operation,
          duration: metric.duration,
          threshold,
          ...metric.context
        }
      });
    }

    if (!metric.success) {
      this.createAlert({
        level: 'error',
        message: `Operação ${metric.operation} falhou`,
        context: {
          operation: metric.operation,
          error: metric.error,
          ...metric.context
        }
      });
    }
  }

  // Criar alerta
  createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(newAlert);

    // Manter apenas os alertas mais recentes
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log do alerta
    logger.warn({
      msg: 'Alerta criado',
      ...newAlert
    });

    // Capturar no Sentry se for crítico
    if (alert.level === 'critical') {
      captureError(new Error(alert.message), alert.context);
    }
  }

  // Obter métricas por operação
  getMetricsByOperation(operation: string, limit: number = 100): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.operation === operation)
      .slice(-limit);
  }

  // Obter estatísticas de performance
  getPerformanceStats(operation?: string): {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    errorRate: number;
  } {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        errorRate: 0
      };
    }

    const successful = filteredMetrics.filter(m => m.success).length;
    const failed = filteredMetrics.filter(m => !m.success).length;
    const durations = filteredMetrics.map(m => m.duration);

    return {
      total: filteredMetrics.length,
      successful,
      failed,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      errorRate: failed / filteredMetrics.length
    };
  }

  // Obter alertas não reconhecidos
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Reconhecer alerta
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // Limpar métricas antigas
  cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 horas
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );
  }

  // Limpar alertas antigos
  cleanupOldAlerts(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 dias
    const cutoff = Date.now() - maxAge;
    this.alerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > cutoff
    );
  }
}

// Instância global do monitor
export const performanceMonitor = new PerformanceMonitor();

// Função para medir performance de operações
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  return fn()
    .then(result => {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        operation,
        duration,
        timestamp: new Date().toISOString(),
        success: true,
        context
      });
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        operation,
        duration,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context
      });
      
      throw error;
    });
}

// Função para health check de banco de dados
export async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Implementar verificação real do banco de dados
    // Por enquanto, simular uma verificação
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Função para health check de API externa
export async function checkExternalAPIHealth(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Verificar Meta API
    const response = await fetch('https://graph.facebook.com/v23.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name: 'meta-api',
        status: 'healthy',
        responseTime,
        details: {
          statusCode: response.status,
          responseTime
        }
      };
    } else {
      return {
        name: 'meta-api',
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}`,
        details: {
          statusCode: response.status,
          responseTime
        }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'meta-api',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Função para health check de memória
export function checkMemoryHealth(): HealthCheck {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const usage = used.heapUsed / total;
  
  // Definir threshold de memória (80% por padrão)
  const memoryThreshold = 0.8;
  
  if (usage > memoryThreshold) {
    return {
      name: 'memory',
      status: 'unhealthy',
      error: `Uso de memória alto: ${(usage * 100).toFixed(2)}%`,
      details: {
        heapUsed: used.heapUsed,
        heapTotal: total,
        usage: usage
      }
    };
  }
  
  return {
    name: 'memory',
    status: 'healthy',
    details: {
      heapUsed: used.heapUsed,
      heapTotal: total,
      usage: usage
    }
  };
}

// Função para health check completo do sistema
export async function performHealthCheck(): Promise<HealthCheck[]> {
  const checks = [
    checkDatabaseHealth(),
    checkExternalAPIHealth(),
    Promise.resolve(checkMemoryHealth())
  ];
  
  return Promise.all(checks);
}

// Função para obter status geral do sistema
export function getSystemStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  performance: {
    avgResponseTime: number;
    errorRate: number;
    activeAlerts: number;
  };
} {
  const checks = performHealthCheck();
  const stats = performanceMonitor.getPerformanceStats();
  const activeAlerts = performanceMonitor.getUnacknowledgedAlerts().length;
  
  // Determinar status geral
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (stats.errorRate > 0.1 || activeAlerts > 5) {
    status = 'unhealthy';
  } else if (stats.errorRate > 0.05 || activeAlerts > 2) {
    status = 'degraded';
  }
  
  return {
    status,
    checks: [], // Será preenchido quando checks for resolvido
    performance: {
      avgResponseTime: stats.avgDuration,
      errorRate: stats.errorRate,
      activeAlerts
    }
  };
}

// Decorator para medir performance de métodos
export function measureMethodPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return measurePerformance(
        operation,
        () => method.apply(this, args),
        {
          method: propertyName,
          className: target.constructor.name
        }
      );
    };
  };
} 