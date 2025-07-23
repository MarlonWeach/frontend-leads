// Component: AlertIndicator.tsx
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import React from 'react';
import { AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { AlertSeverity } from '@/types/alertSystem';

interface AlertIndicatorProps {
  count: number;
  severity: AlertSeverity;
  latestMessage?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-500',
    textColor: 'text-red-100',
    borderColor: 'border-red-400',
    pulseColor: 'bg-red-400',
    label: 'Crítico'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-100',
    borderColor: 'border-yellow-400',
    pulseColor: 'bg-yellow-400',
    label: 'Atenção'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-100',
    borderColor: 'border-blue-400',
    pulseColor: 'bg-blue-400',
    label: 'Info'
  }
};

const sizeConfig = {
  sm: {
    container: 'w-5 h-5',
    icon: 'w-3 h-3',
    badge: 'w-3 h-3 text-xs',
    pulse: 'w-5 h-5'
  },
  md: {
    container: 'w-6 h-6',
    icon: 'w-4 h-4',
    badge: 'w-4 h-4 text-xs',
    pulse: 'w-6 h-6'
  },
  lg: {
    container: 'w-8 h-8',
    icon: 'w-5 h-5',
    badge: 'w-5 h-5 text-sm',
    pulse: 'w-8 h-8'
  }
};

export default function AlertIndicator({
  count,
  severity,
  latestMessage,
  onClick,
  size = 'md',
  className = ''
}: AlertIndicatorProps) {
  if (count === 0) return null;

  // Validar severity e usar fallback se inválido
  const validSeverity = severity && severityConfig[severity] ? severity : 'info';
  const config = severityConfig[validSeverity];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const shouldAnimate = validSeverity === 'critical';

  if (!config || !Icon) {
    console.warn('[AlertIndicator] Invalid severity or missing icon:', { severity, validSeverity, config });
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Pulse animation for critical alerts */}
      {shouldAnimate && (
        <div className={`absolute inset-0 ${sizes.pulse} ${config.pulseColor} rounded-full animate-ping opacity-75`} />
      )}
      
      {/* Main indicator */}
      <div
        className={`
          relative ${sizes.container} ${config.bgColor} ${config.borderColor}
          rounded-full border-2 flex items-center justify-center
          ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          ${shouldAnimate ? 'animate-pulse' : ''}
        `}
        onClick={onClick}
        title={latestMessage || `${count} alerta(s) ${config.label.toLowerCase()}`}
      >
        <Icon className={`${sizes.icon} ${config.textColor}`} />
        
        {/* Count badge */}
        {count > 1 && (
          <div className={`
            absolute -top-1 -right-1 ${sizes.badge}
            bg-white text-gray-800 rounded-full
            flex items-center justify-center font-bold
            border border-gray-200
          `}>
            {count > 9 ? '9+' : count}
          </div>
        )}
      </div>

      {/* Tooltip on hover (optional enhancement) */}
      {latestMessage && onClick && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {latestMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Variação para múltiplos alertas de diferentes severidades
interface MultiAlertIndicatorProps {
  alerts: {
    severity: AlertSeverity;
    count: number;
    latestMessage?: string;
  }[];
  onClick?: (severity: AlertSeverity) => void;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MultiAlertIndicator({
  alerts,
  onClick,
  maxVisible = 3,
  size = 'md',
  className = ''
}: MultiAlertIndicatorProps) {
  // Filtrar apenas alertas com count > 0 e ordenar por severidade
  const visibleAlerts = alerts
    .filter(alert => alert.count > 0 && alert.severity && severityConfig[alert.severity])
    .sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, maxVisible);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {visibleAlerts.map((alert, index) => (
        <AlertIndicator
          key={alert.severity}
          count={alert.count}
          severity={alert.severity}
          latestMessage={alert.latestMessage}
          onClick={() => onClick?.(alert.severity)}
          size={size}
        />
      ))}
      
      {/* Indicador de mais alertas se houver */}
      {alerts.filter(a => a.count > 0).length > maxVisible && (
        <div className={`
          ${sizeConfig[size].container} bg-gray-500 text-white
          rounded-full flex items-center justify-center text-xs font-bold
        `}>
          +{alerts.filter(a => a.count > 0).length - maxVisible}
        </div>
      )}
    </div>
  );
}

// Hook para usar com alertas dos adsets (AdsetGoalAlert)
export function useAlertSummary(alerts: any[] = []) {
  if (!Array.isArray(alerts)) {
    console.warn('[useAlertSummary] alerts is not an array:', alerts);
    return [];
  }

  // Mapear severidades de AdsetGoalAlert para AlertSeverity
  const mapSeverity = (severity: string): AlertSeverity => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const summary = alerts.reduce((acc, alert) => {
    if (!alert) return acc;
    
    const originalSeverity = alert.severity || 'low';
    const mappedSeverity = mapSeverity(originalSeverity);
    
    if (!acc[mappedSeverity]) {
      acc[mappedSeverity] = { count: 0, latestMessage: '', latestTime: null };
    }
    
    acc[mappedSeverity].count++;
    
    // Pegar a mensagem mais recente
    const alertTime = new Date(alert.created_at || alert.timestamp || Date.now());
    if (!acc[mappedSeverity].latestTime || alertTime > acc[mappedSeverity].latestTime) {
      acc[mappedSeverity].latestTime = alertTime;
      acc[mappedSeverity].latestMessage = alert.message || 'Alerta sem mensagem';
    }
    
    return acc;
  }, {} as Record<AlertSeverity, { count: number; latestMessage: string; latestTime: Date | null }>);

  return Object.entries(summary)
    .filter(([severity]) => severityConfig[severity as AlertSeverity]) // Filtrar severities válidas
    .map(([severity, data]) => ({
      severity: severity as AlertSeverity,
      count: data.count,
      latestMessage: data.latestMessage
    }));
} 