'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  Clock, 
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useOpenAIBilling, useBillingStats } from '../../hooks/useOpenAIBilling';

interface OpenAIBillingWidgetProps {
  days?: number;
  autoRefresh?: boolean;
  className?: string;
}

export function OpenAIBillingWidget({ 
  days = 7, 
  autoRefresh = true,
  className = ""
}: OpenAIBillingWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error, refresh, lastUpdated } = useOpenAIBilling({
    days,
    autoRefresh,
    refreshInterval: 10 * 60 * 1000 // 10 minutos
  });

  // Usar dados reais ou fallback para dados vazios (sem demonstração fixa)
  const displayData = data;
  const stats = useBillingStats(displayData);

  if (error) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            OpenAI Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados de billing: {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm" 
            className="mt-3"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            OpenAI Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayData?.data) {
    return null;
  }

  const { currentPeriod, limits, alerts } = displayData.data;
  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.type === 'error');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            OpenAI Billing
            {displayData?.source === 'local_estimation' && (
              <Badge variant="secondary" className="text-xs">
                Estimativa
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alertas Críticos */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {criticalAlerts[0].message}
            </AlertDescription>
          </Alert>
        )}

        {/* Alertas de Aviso */}
        {warningAlerts.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              {warningAlerts[0].message}
            </AlertDescription>
          </Alert>
        )}

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <DollarSign className="h-4 w-4" />
              Custo Total ({days}d)
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(stats.totalCost)}
            </div>
            <div className="text-xs text-white/60">
              Média: {formatCurrency(stats.averageCostPerDay)}/dia
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Activity className="h-4 w-4" />
              Tokens Usados
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(stats.totalTokens)}
            </div>
            <div className="text-xs text-white/60">
              {stats.totalRequests} requisições
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Uso do Limite</span>
            <span className="text-white">
              {stats.usagePercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(stats.usagePercentage, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-white/60">
            <span>{formatCurrency(stats.totalCost)}</span>
            <span>{formatCurrency(limits.softLimit)}</span>
          </div>
        </div>

        {/* Seção Expandida */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Projeções */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <TrendingUp className="h-4 w-4" />
                  Projeção Mensal
                </div>
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(stats.projectedMonthlyCost)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="h-4 w-4" />
                  Dias Restantes
                </div>
                <div className="text-lg font-semibold text-white">
                  {stats.daysRemaining === Infinity ? '∞' : stats.daysRemaining}
                </div>
              </div>
            </div>

            {/* Alertas Informativos */}
            {alerts.filter(a => a.type === 'info').map((alert, index) => (
              <Alert key={index} className="border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}

            {/* Gráfico Simples de Uso Diário */}
            {data && data.data && Array.isArray(data.data.dailyUsage) && data.data.dailyUsage.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-white/70">Uso Diário (últimos {days} dias)</div>
                <div className="flex items-end gap-1 h-16">
                  {data.data.dailyUsage.slice(0, days).reverse().map((day, index) => {
                    const maxCost = Math.max(...data.data.dailyUsage.map(d => d.estimatedCost));
                    const height = maxCost > 0 ? (day.estimatedCost / maxCost) * 100 : 0;
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500/30 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${formatCurrency(day.estimatedCost)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="text-xs text-white/50 space-y-1">
              <div>Fonte: {data && data.source === 'openai_api' ? 'OpenAI API' : 'Estimativa Local'}</div>
              {lastUpdated && (
                <div>
                  Última atualização: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente auxiliar para formatação de moeda
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

// Função para formatação consistente de números
function formatNumber(num: number): string {
  if (num === 0) return '0';
  
  // Usar formatação manual para evitar diferenças entre server/client
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
} 