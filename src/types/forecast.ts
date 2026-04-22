export interface ForecastData {
  date: string;
  predicted: number;
  confidence: 'high' | 'medium' | 'low';
  min: number;
  max: number;
  actual?: number; // Para comparação com dados reais quando disponível
}

export interface ForecastMetric {
  name: string;
  label: string;
  unit: string;
  format: (value: number) => string;
  color: string;
  forecastColor: string; // Nova propriedade para cor da linha de previsão
}

export interface ForecastRequest {
  startDate: string;
  endDate: string;
  metrics: string[];
  daysToForecast?: number;
  adsetId?: string;
  campaignId?: string;
}

export interface ForecastResponse {
  success: boolean;
  data?: {
    historical: ForecastData[];
    forecast: ForecastData[];
    metrics: {
      [key: string]: {
        trend: 'up' | 'down' | 'stable';
        confidence: 'high' | 'medium' | 'low';
        next7Days: {
          total: number;
          average: number;
          min: number;
          max: number;
        };
        scenarios?: {
          conservative: number;
          realistic: number;
          optimistic: number;
        };
      };
    };
    metadata: {
      generatedAt: string;
      historicalDays: number;
      forecastDays: number;
      aiUsed: boolean;
      baselineModel?: string;
      source?: string;
      adsetId?: string | null;
      campaignId?: string | null;
      scenarioModel?: string;
      accuracy?: Record<
        string,
        {
          mape: number;
          sampleSize: number;
          status: 'healthy' | 'warning' | 'critical';
        }
      >;
      contractConstraint?: {
        enabled: boolean;
        remainingLeads: number;
        scope: 'global' | 'campaign' | 'adset';
      };
      segmentationComparison?: Record<
        string,
        {
          segmentedTotal: number;
          globalTotal: number;
          deltaPercent: number;
        }
      >;
      predictiveAlerts?: Array<{
        id: string;
        severity: 'info' | 'warning' | 'critical';
        metric: string;
        title: string;
        message: string;
      }>;
      budgetRecommendations?: Array<{
        id: string;
        action: 'increase' | 'decrease' | 'maintain';
        scope: 'global' | 'campaign' | 'adset';
        reason: string;
        expectedImpact: string;
      }>;
      seasonality?: Record<
        string,
        {
          enabled: boolean;
          strength: number;
          weekdayMultipliers: number[];
          monthlyMultipliers?: number[];
          weeklyStrength?: number;
          monthlyStrength?: number;
        }
      >;
    };
  };
  error?: string;
}

export interface ForecastConfig {
  historicalDays: number;
  forecastDays: number;
  confidenceThreshold: number;
  enableAI: boolean;
}

export interface UseForecastOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    campaignId?: string;
    adsetId?: string;
  };
  config?: Partial<ForecastConfig>;
  enabled?: boolean;
}

export interface ForecastInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  metric: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction?: string;
  priority: 'high' | 'medium' | 'low';
}

// Métricas disponíveis para previsão
export const FORECAST_METRICS: Record<string, ForecastMetric> = {
  leads: {
    name: 'leads',
    label: 'Leads',
    unit: 'leads',
    format: (value: number) => Math.round(value).toString(),
    color: '#3b82f6',
    forecastColor: '#00E0FF'
  },
  spend: {
    name: 'spend',
    label: 'Gastos',
    unit: 'R$',
    format: (value: number) => `R$ ${value.toFixed(2)}`,
    color: '#10b981',
    forecastColor: '#00E0FF'
  },
  ctr: {
    name: 'ctr',
    label: 'CTR',
    unit: '%',
    format: (value: number) => `${value.toFixed(2)}%`,
    color: '#f59e0b',
    forecastColor: '#00E0FF'
  },
  cpl: {
    name: 'cpl',
    label: 'CPL',
    unit: 'R$',
    format: (value: number) => `R$ ${value.toFixed(2)}`,
    color: '#ef4444',
    forecastColor: '#00E0FF'
  },
  impressions: {
    name: 'impressions',
    label: 'Impressões',
    unit: 'impressions',
    format: (value: number) => value.toLocaleString(),
    color: '#8b5cf6',
    forecastColor: '#00E0FF'
  },
  clicks: {
    name: 'clicks',
    label: 'Cliques',
    unit: 'clicks',
    format: (value: number) => Math.round(value).toString(),
    color: '#06b6d4',
    forecastColor: '#00E0FF'
  }
}; 