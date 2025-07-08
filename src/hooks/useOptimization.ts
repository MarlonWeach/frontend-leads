import { useState, useCallback, useEffect, useMemo } from 'react';
import { OptimizationAnalysis, OptimizationSuggestion } from '../lib/ai/optimizationEngine';

interface UseOptimizationParams {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  campaignIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number; // minutos
}

interface UseOptimizationReturn {
  analysis: OptimizationAnalysis | null;
  loading: boolean;
  error: string | null;
  generateOptimizations: () => Promise<void>;
  applySuggestion: (suggestionId: string) => Promise<boolean>;
  refreshOptimizations: () => Promise<void>;
  clearError: () => void;
}

export function useOptimization({
  dateRange,
  campaignIds = [],
  autoRefresh = false,
  refreshInterval = 30
}: UseOptimizationParams): UseOptimizationReturn {
  const [analysis, setAnalysis] = useState<OptimizationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoizar campaignIds para evitar re-criação desnecessária
  const memoizedCampaignIds = useMemo(() => campaignIds, [campaignIds]);

  // Extrair expressão complexa para variável separada
  const campaignIdsString = useMemo(() => JSON.stringify(campaignIds), [campaignIds]);

  const generateOptimizations = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Período de datas é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data: OptimizationAnalysis = await response.json();
      setAnalysis(data);
      
      console.log(`Carregadas ${data.suggestions.length} sugestões de otimização`);
      
    } catch (err) {
      console.error('Erro ao gerar otimizações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [dateRange, campaignIds]);

  const applySuggestion = useCallback(async (suggestionId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/ai/optimization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionId,
          action: 'apply',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Atualizar estado local removendo a sugestão aplicada
        setAnalysis(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
            summary: {
              ...prev.summary,
              totalSuggestions: prev.summary.totalSuggestions - 1
            }
          };
        });
        
        console.log(`Sugestão ${suggestionId} aplicada com sucesso`);
        return true;
      }
      
      throw new Error(result.message || 'Falha ao aplicar sugestão');
      
    } catch (err) {
      console.error('Erro ao aplicar sugestão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao aplicar sugestão');
      return false;
    }
  }, []);

  const refreshOptimizations = useCallback(async () => {
    await generateOptimizations();
  }, [generateOptimizations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        generateOptimizations();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, generateOptimizations]);

  // Gerar otimizações iniciais quando dependências mudarem
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      generateOptimizations();
    }
  }, [dateRange, campaignIdsString, generateOptimizations]);

  return {
    analysis,
    loading,
    error,
    generateOptimizations,
    applySuggestion,
    refreshOptimizations,
    clearError,
  };
}

// Hook auxiliar para filtrar sugestões por tipo
export function useOptimizationFilters(analysis: OptimizationAnalysis | null) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);

  const filteredSuggestions = analysis?.suggestions.filter(suggestion => {
    // Filtro por tipo
    if (selectedTypes.length > 0 && !selectedTypes.includes(suggestion.type)) {
      return false;
    }

    // Filtro por impacto
    if (selectedImpact.length > 0 && !selectedImpact.includes(suggestion.impact)) {
      return false;
    }

    // Filtro por confiança mínima
    if (suggestion.confidence < minConfidence) {
      return false;
    }

    return true;
  }) || [];

  return {
    filteredSuggestions,
    selectedTypes,
    setSelectedTypes,
    selectedImpact,
    setSelectedImpact,
    minConfidence,
    setMinConfidence,
    availableTypes: ['SEGMENTACAO', 'CRIATIVO', 'ORCAMENTO', 'TIMING', 'ABTEST'],
    availableImpacts: ['ALTO', 'MEDIO', 'BAIXO'],
  };
}

// Hook para estatísticas de otimização
export function useOptimizationStats(analysis: OptimizationAnalysis | null) {
  if (!analysis) {
    return {
      totalSuggestions: 0,
      implementableSuggestions: 0,
      averageConfidence: 0,
      totalEstimatedROI: 0,
      suggestionsByType: {},
      suggestionsByImpact: {},
    };
  }

  const suggestionsByType = analysis.suggestions.reduce((acc, suggestion) => {
    acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const suggestionsByImpact = analysis.suggestions.reduce((acc, suggestion) => {
    acc[suggestion.impact] = (acc[suggestion.impact] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSuggestions: analysis.summary.totalSuggestions,
    implementableSuggestions: analysis.suggestions.filter(s => s.implementable).length,
    averageConfidence: analysis.summary.averageConfidence,
    totalEstimatedROI: analysis.summary.estimatedTotalROI,
    suggestionsByType,
    suggestionsByImpact,
  };
} 