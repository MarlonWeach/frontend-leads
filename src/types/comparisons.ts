export interface ComparisonRequest {
  startDate: string;
  endDate: string;
  granularity?: 'campaign' | 'day' | 'week';
  campaignIds?: string[];
}

export interface PeriodComparison {
  metric: string;
  current: number;
  previous: number;
  variation: number;
  variationPercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PeriodData {
  period: { start: string; end: string };
  metrics: AggregatedMetrics;
  campaigns: CampaignData[];
}

export interface AggregatedMetrics {
  totalLeads: number;
  totalSpend: number;
  averageCTR: number;
  averageCPL: number;
  averageROI: number;
  totalImpressions: number;
  totalClicks: number;
}

export interface CampaignData {
  campaign_id: string;
  campaign_name: string;
  date: string;
  leads: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
}

export interface ComparisonMetadata {
  totalCampaigns: number;
  granularity: string;
  generatedAt: string;
  dataQuality: 'complete' | 'partial' | 'limited';
}

export interface ComparisonResponse {
  success: boolean;
  data: {
    current: PeriodData;
    previous: PeriodData;
    comparisons: PeriodComparison[];
    metadata: ComparisonMetadata;
  };
  error?: string;
} 