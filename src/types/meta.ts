export interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAdset {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  created_time: string;
  updated_time: string;
  campaign_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
  targeting: any;
  optimization_goal: string;
  billing_event: string;
  insights?: MetaAdsetInsights[];
}

export interface MetaAdsetInsights {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results: number;
  actions?: any[];
  date_start: string;
  date_stop: string;
}

export interface MetaAdsResponse {
  data: MetaAd[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface MetaAdsetsResponse {
  data: MetaAdset[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface MetaAdsetInsightsResponse {
  data: MetaAdsetInsights[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface MetaError {
  code: number;
  message: string;
  type: string;
  fbtrace_id: string;
}

export class MetaAPIError extends Error {
  constructor(
    public readonly code: number,
    public readonly type: string,
    public readonly fbtrace_id: string,
    message: string
  ) {
    super(message);
    this.name = 'MetaAPIError';
  }
}

export interface MetaAdsServiceConfig {
  accessToken: string;
  accountId: string;
  baseUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
} 