import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/button';
import { DetectedAnomaly, AnomalySeverity, AnomalyType } from '../../lib/ai/anomalyDetection';

interface AnomalyAlertProps {
  anomaly: DetectedAnomaly;
  onDismiss?: (anomalyId: string) => void;
  onMarkResolved?: (anomalyId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const severityConfig = {
  CRITICAL: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    badgeVariant: 'destructive' as const
  },
  HIGH: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    badgeVariant: 'destructive' as const
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    badgeVariant: 'outline' as const
  },
  LOW: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    badgeVariant: 'outline' as const
  }
};

const typeLabels = {
  HIGH_CONVERSION_RATE: 'Taxa de Conversão Alta',
  SUSPICIOUS_TRAFFIC: 'Tráfego Suspeito',
  MANUAL_CONVERSIONS: 'Conversões Manuais',
  DUPLICATE_LEADS: 'Leads Duplicados',
  COST_SPIKE: 'Pico de Gastos',
  PERFORMANCE_DROP: 'Queda de Performance',
  UNUSUAL_PATTERN: 'Padrão Incomum'
};

export default function AnomalyAlert({ 
  anomaly, 
  onDismiss, 
  onMarkResolved, 
  showActions = true,
  compact = false 
}: AnomalyAlertProps) {
  const config = severityConfig[anomaly.severity];
  const Icon = config.icon;
  const typeLabel = typeLabels[anomaly.type] || anomaly.type;

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const formatMetric = (value: number, type: 'percentage' | 'currency' | 'number' = 'number') => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{anomaly.title}</p>
          <p className="text-xs text-white/70 truncate">{anomaly.description}</p>
        </div>
        <Badge variant={config.badgeVariant} className="text-xs">
          {anomaly.severity}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <div>
              <CardTitle className="text-base text-white">{anomaly.title}</CardTitle>
              <p className="text-xs text-white/60 mt-1">{typeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant} className="text-xs">
              {anomaly.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(anomaly.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-white/80 mb-4">{anomaly.description}</p>

        {/* Campanhas Afetadas */}
        {anomaly.affectedCampaigns.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-white/60 mb-2">Campanhas Afetadas:</p>
            <div className="flex flex-wrap gap-1">
              {anomaly.affectedCampaigns.slice(0, 3).map((campaign, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {campaign}
                </Badge>
              ))}
              {anomaly.affectedCampaigns.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{anomaly.affectedCampaigns.length - 3} mais
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Métricas */}
        {anomaly.metrics && Object.keys(anomaly.metrics).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-white/60 mb-2">Métricas:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(anomaly.metrics).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-white/60">{key}:</span>
                  <span className="text-white">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {anomaly.recommendations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-white/60 mb-2">Recomendações:</p>
            <ul className="text-xs text-white/80 space-y-1">
              {anomaly.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-white/40">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Clock className="w-3 h-3" />
              <span>{new Date(anomaly.detectedAt).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex gap-2">
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(anomaly.id)}
                  className="text-xs text-white/70 hover:text-white"
                >
                  Dispensar
                </Button>
              )}
              {onMarkResolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkResolved(anomaly.id)}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  Resolver
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 