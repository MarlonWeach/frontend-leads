export interface HeatmapData {
  date: string;
  value: number;
  metric: string;
  campaigns?: number;
  formattedValue?: string;
  rawData?: {
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpl: number;
  };
}

export interface HeatmapMetric {
  key: string;
  label: string;
  unit: string;
  format: (value: number) => string;
  colorScale: {
    low: string;
    medium: string;
    high: string;
  };
}

export interface HeatmapPeriod {
  label: string;
  days: number;
  getRange: () => { start: Date; end: Date };
}

export interface HeatmapFilters {
  metric: string;
  period: number; // days
  startDate: Date;
  endDate: Date;
  campaignIds?: string[];
}

export interface HeatmapConfig {
  cellSize: number;
  cellSpacing: number;
  showWeekdays: boolean;
  showMonthLabels: boolean;
  showTooltips: boolean;
  showLegend: boolean;
}

export interface HeatmapTooltipData {
  date: string;
  value: number;
  formattedValue: string;
  metric: string;
  weekday: string;
  campaigns: number;
  rawData?: {
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpl: number;
  };
}

export type HeatmapIntensity = 'none' | 'low' | 'medium' | 'high' | 'max';

export interface ProcessedHeatmapData {
  data: HeatmapData[];
  weeks: HeatmapData[][];
  stats: {
    min: number;
    max: number;
    avg: number;
    total: number;
  };
  intensityScale: number[];
} 