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
  modelUsed?: string;
  isFallback?: boolean;
}

export interface AIAnalysisState {
  isLoading: boolean;
  error: string | null;
  analysis: AIAnalysis | null;
  lastUpdated: number | null;
  modelUsed?: string;
  isFallback?: boolean;
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

// Tipos de modelo disponíveis
export type AIModelType = 'auto' | 'openai' | 'anthropic';

async function fetchAIAnalysis(data: PerformanceData, analysisType: AnalysisType, model?: AIModelType) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, analysisType, model })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Tratar diferentes tipos de erro
    let errorMessage = result.error || response.statusText;
    
    // Tratamento específico para rate limiting
    if (response.status === 429) {
      const retryAfter = result.retryAfter || 60;
      errorMessage = result.message || `Rate limit excedido. Tente novamente em ${retryAfter} segundos.`;
    }
    
    const errorObj = new Error(errorMessage);
    (errorObj as any).status = response.status;
    (errorObj as any).retryAfter = result.retryAfter;
    throw errorObj;
  }

  // Se é uma resposta de fallback, retornar diretamente
  if (result.isFallback) {
    return {
      data: result.analysis || result.message || 'Análise gerada em modo fallback',
      modelUsed: result.modelUsed || 'Sistema de Fallback',
      isFallback: true
    };
  }

  if (!result.success) {
    const errorObj = new Error(result.error || 'Erro na análise de IA');
    (errorObj as any).status = 500;
    throw errorObj;
  }

  return {
    data: result.data,
    modelUsed: result.modelUsed || 'OpenAI GPT-4o-mini',
    isFallback: result.isFallback || false
  };
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
  const analyzeSpecific = useCallback(async (data: PerformanceData, analysisType: AnalysisType, model?: AIModelType) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    try {
      const result = await fetchAIAnalysis(data, analysisType, model);
      
      // Criar uma análise específica com o resultado
      const specificAnalysis: AIAnalysis = {
        analysis: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
        trends: analysisType === 'trends' ? result.data : undefined,
        comparison: analysisType === 'comparison' ? result.data : undefined,
        variations: analysisType === 'variations' ? result.data : undefined,
        efficiency: analysisType === 'efficiency' ? result.data : undefined,
        anomalies: analysisType === 'anomaly' ? (Array.isArray(result.data) ? result.data : []) : [],
        suggestions: analysisType === 'optimization' ? (Array.isArray(result.data) ? result.data : []) : [],
        timestamp: Date.now(),
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        analysis: specificAnalysis,
        lastUpdated: Date.now(),
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
      }));
      
      return result.data;
    } catch (error) {
      let errorMessage = 'Erro desconhecido na análise de IA';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Tratamento específico para diferentes tipos de erro
        const errorStatus = (error as any).status;
        if (errorStatus === 429) {
          const retryAfter = (error as any).retryAfter || 60;
          errorMessage = `💡 Usando análise em modo fallback. Para análises avançadas com IA, considere fazer upgrade da conta OpenAI.`;
        } else if (errorStatus === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (errorStatus === 400) {
          errorMessage = 'Dados inválidos enviados para análise.';
        }
      }
      
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