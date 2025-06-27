import { useState, useCallback } from 'react';

// Tipos para os dados de análise
export interface PerformanceData {
  campaigns?: any[];
  adsets?: any[];
  ads?: any[];
  leads?: any[];
  metrics?: {
    totalLeads?: number;
    totalSpend?: number;
    totalImpressions?: number;
    totalClicks?: number;
    averageCTR?: number;
    averageCPL?: number;
  };
  period?: string;
}

export interface AIAnalysis {
  analysis: string;
  trends?: string;
  comparison?: string;
  variations?: string;
  efficiency?: string;
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  suggestions: Array<{
    type: string;
    suggestion: string;
    expectedImpact: string;
  }>;
  timestamp: number;
}

export interface AIAnalysisState {
  isLoading: boolean;
  error: string | null;
  analysis: AIAnalysis | null;
  lastUpdated: number | null;
}

// Tipos de análise disponíveis
export type AnalysisType = 
  | 'performance' 
  | 'trends' 
  | 'comparison' 
  | 'variations' 
  | 'efficiency' 
  | 'anomaly' 
  | 'optimization';

async function fetchAIAnalysis(data: PerformanceData, analysisType: AnalysisType) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, analysisType })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Tratar diferentes tipos de erro
    if (response.status === 429) {
      throw new Error('Limite de quota da OpenAI excedido. Tente novamente mais tarde.');
    } else if (response.status === 400) {
      throw new Error(result.error || 'Dados inválidos para análise');
    } else if (response.status === 500) {
      throw new Error(result.error || 'Erro interno no servidor de IA');
    } else {
      throw new Error(result.error || `Erro ${response.status}: ${response.statusText}`);
    }
  }

  if (!result.success) {
    throw new Error(result.error || 'Erro na análise de IA');
  }

  return result.data;
}

/**
 * Hook para gerenciar análise de IA
 */
export function useAIAnalysis() {
  const [state, setState] = useState<AIAnalysisState>({
    isLoading: false,
    error: null,
    analysis: null,
    lastUpdated: null,
  });

  /**
   * Analisa um tipo específico de análise
   */
  const analyzeSpecific = useCallback(async (data: PerformanceData, analysisType: AnalysisType) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    try {
      const result = await fetchAIAnalysis(data, analysisType);
      
      // Criar uma análise específica com o resultado
      const specificAnalysis: AIAnalysis = {
        analysis: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        trends: analysisType === 'trends' ? result : undefined,
        comparison: analysisType === 'comparison' ? result : undefined,
        variations: analysisType === 'variations' ? result : undefined,
        efficiency: analysisType === 'efficiency' ? result : undefined,
        anomalies: analysisType === 'anomaly' ? (Array.isArray(result) ? result : []) : [],
        suggestions: analysisType === 'optimization' ? (Array.isArray(result) ? result : []) : [],
        timestamp: Date.now(),
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        analysis: specificAnalysis,
        lastUpdated: Date.now(),
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na análise de IA';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Analisa dados de performance usando IA
   */
  const analyzePerformance = useCallback(async (data: PerformanceData) => {
    return await analyzeSpecific(data, 'performance');
  }, [analyzeSpecific]);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Limpa a análise atual
   */
  const clearAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysis: null,
      lastUpdated: null,
    }));
  }, []);

  /**
   * Atualiza a análise com novos dados
   */
  const refreshAnalysis = useCallback(async (data: PerformanceData) => {
    return await analyzePerformance(data);
  }, [analyzePerformance]);

  return {
    ...state,
    analyzePerformance,
    analyzeSpecific,
    clearError,
    clearAnalysis,
    refreshAnalysis,
  };
} 