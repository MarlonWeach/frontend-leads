import { MetaAd } from './meta';

export interface SyncStatus {
  success: boolean;
  timestamp: string;
  totalAds: number;
  activeAds: number;
  error?: string;
  details?: {
    startTime: string;
    endTime: string;
    durationMs: number;
    retryCount?: number;
    message?: string;
  };
}

export interface SyncOptions {
  force?: boolean;
  dryRun?: boolean;
  retryCount?: number;
  timeoutMs?: number;
}

export interface SyncResult {
  status: SyncStatus;
  data?: any;
  ads?: any[]; // Adicionado para compatibilidade com testes
}

export interface SyncError extends Error {
  code: 'API_ERROR' | 'DB_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'MODEL_PROVIDER_ERROR';
  retryable: boolean;
  details?: unknown;
  providerError?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  force: false,
  retryCount: 3,
  timeoutMs: 30000, // 30 segundos
};

export const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos 