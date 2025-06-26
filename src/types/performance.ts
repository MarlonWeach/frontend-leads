export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  status: string;
  leads: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
  roi: number;
  data_start_date: string;
  data_end_date: string;
}

export interface PerformanceMetrics {
  totalLeads: number;
  totalSpend: number;
  averageCTR: number;
  averageCPL: number;
  averageROI: number;
  totalImpressions: number;
  totalClicks: number;
}

export interface PerformancePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PerformanceResponse {
  campaigns: CampaignPerformance[];
  metrics: PerformanceMetrics;
  pagination: PerformancePagination;
}

export interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type SortableFields = 'campaign_name' | 'status' | 'leads' | 'spend' | 'ctr' | 'cpl' | 'roi' | 'data_start_date';

export interface PerformanceSortConfig {
  field: SortableFields;
  order: 'asc' | 'desc';
} 