import { useState, useEffect, useCallback, useMemo } from 'react';
import { DetectedAnomaly } from '../lib/ai/anomalyDetection';

interface UseAnomalyDetectionProps {
  dateRange: { startDate: string; endDate: string };
  campaignIds?: string[];
  sensitivity?: 'low' | 'medium' | 'high';
  autoRefresh?: boolean;
  refreshInterval?: number; // em minutos
}

interface AnomalyDetectionState {
  anomalies: DetectedAnomaly[];
  loading: boolean;
  error: string | null;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastUpdated: Date | null;
}

const CACHE_KEY = 'anomaly_detection_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

export function useAnomalyDetection({
  dateRange,
  campaignIds,
  sensitivity = 'medium',
  autoRefresh = false,
  refreshInterval = 30
}: UseAnomalyDetectionProps) {
  const [state, setState] = useState<AnomalyDetectionState>({
    anomalies: [],
    loading: false,
    error: null,
    summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    lastUpdated: null
  });

  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());
  const [resolvedAnomalies, setResolvedAnomalies] = useState<Set<string>>(new Set());

  // Memoizar campaignIds para evitar re-criação desnecessária
  const memoizedCampaignIds = useMemo(() => campaignIds, [campaignIds]);

  // Função para detectar anomalias
  const detectAnomalies = useCallback(async (forceRefresh = false) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setState(prev => ({ ...prev, error: 'Período de data é obrigatório' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar cache primeiro
      if (!forceRefresh) {
        const cached = getCachedData();
        if (cached) {
          setState(prev => ({
            ...prev,
            ...cached,
            loading: false
          }));
          return;
        }
      }

      const response = await fetch('/api/ai/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          campaignIds: memoizedCampaignIds,
          sensitivity,
          forceRefresh
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();

      const newState = {
        anomalies: data.anomalies || [],
        summary: data.summary || { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        lastUpdated: new Date(),
        loading: false,
        error: null
      };

      setState(prev => ({ ...prev, ...newState }));

      // Salvar no cache
      setCachedData(newState);

    } catch (error) {
      console.error('Erro ao detectar anomalias:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [dateRange, memoizedCampaignIds, sensitivity]);

  // Função para buscar anomalias históricas
  const fetchHistoricalAnomalies = useCallback(async (
    limit = 10,
    severityFilter?: string,
    typeFilter?: string
  ) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(severityFilter && { severity: severityFilter }),
        ...(typeFilter && { type: typeFilter })
      });

      const response = await fetch(`/api/ai/anomalies?${params}`);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.anomalies || [];

    } catch (error) {
      console.error('Erro ao buscar anomalias históricas:', error);
      return [];
    }
  }, []);

  // Função para dispensar anomalia
  const dismissAnomaly = useCallback((anomalyId: string) => {
    setDismissedAnomalies(prev => new Set(Array.from(prev).concat(anomalyId)));
  }, []);

  // Função para marcar como resolvida
  const markAsResolved = useCallback(async (anomalyId: string) => {
    setResolvedAnomalies(prev => new Set(Array.from(prev).concat(anomalyId)));
    
    // Aqui poderia fazer uma chamada à API para marcar como resolvida no backend
    try {
      await fetch(`/api/ai/anomalies/${anomalyId}/resolve`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erro ao marcar anomalia como resolvida:', error);
    }
  }, []);

  // Função para limpar filtros
  const clearDismissed = useCallback(() => {
    setDismissedAnomalies(new Set());
  }, []);

  const clearResolved = useCallback(() => {
    setResolvedAnomalies(new Set());
  }, []);

  // Filtrar anomalias (remover dispensadas e resolvidas)
  const filteredAnomalies = state.anomalies.filter(
    anomaly => !dismissedAnomalies.has(anomaly.id) && !resolvedAnomalies.has(anomaly.id)
  );

  // Recalcular summary baseado nas anomalias filtradas
  const filteredSummary = {
    total: filteredAnomalies.length,
    critical: filteredAnomalies.filter(a => a.severity === 'CRITICAL').length,
    high: filteredAnomalies.filter(a => a.severity === 'HIGH').length,
    medium: filteredAnomalies.filter(a => a.severity === 'MEDIUM').length,
    low: filteredAnomalies.filter(a => a.severity === 'LOW').length
  };

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        detectAnomalies(false);
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, detectAnomalies]);

  // Detectar anomalias apenas na primeira montagem do componente
  useEffect(() => {
    // Apenas detecta na primeira montagem, não quando dependências mudarem
    detectAnomalies(false);
  }, [detectAnomalies]);

  // Funções de cache
  function getCachedData() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = new Date().getTime();
      
      if (now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return {
        anomalies: data.anomalies,
        summary: data.summary,
        lastUpdated: new Date(data.lastUpdated)
      };
    } catch (error) {
      console.error('Erro ao ler cache:', error);
      return null;
    }
  }

  function setCachedData(data: Partial<AnomalyDetectionState>) {
    try {
      const cacheData = {
        ...data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }

  return {
    // Estado
    anomalies: filteredAnomalies,
    loading: state.loading,
    error: state.error,
    summary: filteredSummary,
    lastUpdated: state.lastUpdated,
    
    // Ações
    detectAnomalies,
    fetchHistoricalAnomalies,
    dismissAnomaly,
    markAsResolved,
    clearDismissed,
    clearResolved,
    
    // Estado dos filtros
    dismissedCount: dismissedAnomalies.size,
    resolvedCount: resolvedAnomalies.size,
    
    // Refresh manual
    refresh: () => detectAnomalies(true)
  };
} 