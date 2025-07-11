export interface PerformanceMetric {
  name: string;
  value: number;
  previousValue: number;
  variation: number;
  variationPercent: number;
  isSignificant: boolean;
  unit?: string;
}

export interface PerformanceInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  metric: string;
  variation: number;
  campaigns?: string[];
  suggestedAction?: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  campaignId?: string;
  campaignName?: string;
  variationPercent?: number;
}

export interface PeriodComparison {
  currentPeriod: {
    start: Date;
    end: Date;
    metrics: PerformanceMetric[];
  };
  previousPeriod: {
    start: Date;
    end: Date;
    metrics: PerformanceMetric[];
  };
  insights: PerformanceInsight[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface InsightConfig {
  threshold: number; // Percentual para considerar variação significativa
  maxInsights: number; // Máximo de insights a gerar
  enableAI: boolean; // Se deve usar IA para gerar descrições
}

export interface PerformanceData {
  leads: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
  date: string;
}

export interface ComparisonResult {
  current: PerformanceData;
  previous: PerformanceData;
  variations: {
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpl: number;
  };
  insights: PerformanceInsight[];
} 