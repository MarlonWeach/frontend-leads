export interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  created_time: string;
  updated_time: string;
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