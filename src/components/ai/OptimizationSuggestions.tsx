'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Clock, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Filter,
  BarChart3
} from 'lucide-react';
import { OptimizationAnalysis, OptimizationSuggestion } from '../../lib/ai/optimizationEngine';
import { useOptimization, useOptimizationFilters, useOptimizationStats } from '../../hooks/useOptimization';

interface OptimizationSuggestionsProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  campaignIds?: string[];
  className?: string;
}

const SUGGESTION_ICONS = {
  SEGMENTACAO: Target,
  CRIATIVO: Lightbulb,
  ORCAMENTO: DollarSign,
  TIMING: Clock,
  ABTEST: TestTube,
};

const IMPACT_COLORS = {
  ALTO: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BAIXO: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const TYPE_LABELS = {
  SEGMENTACAO: 'Segmentação',
  CRIATIVO: 'Criativo',
  ORCAMENTO: 'Orçamento',
  TIMING: 'Timing',
  ABTEST: 'A/B Test',
};

export function OptimizationSuggestions({ 
  dateRange, 
  campaignIds = [], 
  className = '' 
}: OptimizationSuggestionsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const {
    analysis,
    loading,
    error,
    generateOptimizations,
    applySuggestion,
    refreshOptimizations,
    clearError,
  } = useOptimization({
    dateRange,
    campaignIds,
    autoRefresh: false,
    refreshInterval: 30,
  });

  const {
    filteredSuggestions,
    selectedTypes,
    setSelectedTypes,
    selectedImpact,
    setSelectedImpact,
    minConfidence,
    setMinConfidence,
    availableTypes,
    availableImpacts,
  } = useOptimizationFilters(analysis);

  const stats = useOptimizationStats(analysis);

  const handleApplySuggestion = async (suggestionId: string) => {
    const success = await applySuggestion(suggestionId);
    if (success) {
      // Mostrar feedback de sucesso
      console.log('Sugestão aplicada com sucesso!');
    }
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleImpactFilter = (impact: string) => {
    setSelectedImpact(prev =>
      prev.includes(impact)
        ? prev.filter(i => i !== impact)
        : [...prev, impact]
    );
  };

  if (error) {
    return (
      <Card className={`glass-card border-red-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Erro ao carregar sugestões</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={clearError}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              Limpar Erro
            </Button>
            <Button
              onClick={refreshOptimizations}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Sugestões de Otimização</CardTitle>
                <p className="text-white/60 text-sm">
                  Recomendações baseadas em IA para melhorar performance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                onClick={refreshOptimizations}
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="text-blue-400 text-sm font-medium">Total</div>
              <div className="text-white text-xl font-bold">{stats.totalSuggestions}</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="text-green-400 text-sm font-medium">Implementáveis</div>
              <div className="text-white text-xl font-bold">{stats.implementableSuggestions}</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
              <div className="text-purple-400 text-sm font-medium">Confiança Média</div>
              <div className="text-white text-xl font-bold">{stats.averageConfidence.toFixed(0)}%</div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
              <div className="text-orange-400 text-sm font-medium">ROI Estimado</div>
              <div className="text-white text-xl font-bold">{stats.totalEstimatedROI.toFixed(1)}x</div>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por tipo */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tipo</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTypes.map(type => (
                      <button
                        key={type}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedTypes.includes(type)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'text-white/70 border-white/20 hover:bg-white/10'
                        }`}
                        onClick={() => toggleTypeFilter(type)}
                      >
                        {TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por impacto */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Impacto</label>
                  <div className="flex flex-wrap gap-2">
                    {availableImpacts.map(impact => (
                      <button
                        key={impact}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedImpact.includes(impact)
                            ? IMPACT_COLORS[impact as keyof typeof IMPACT_COLORS].replace('bg-', 'bg-').replace('/20', '')
                            : 'text-white/70 border-white/20 hover:bg-white/10'
                        }`}
                        onClick={() => toggleImpactFilter(impact)}
                      >
                        {impact}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por confiança */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Confiança Mínima: {minConfidence}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-white">Gerando sugestões de otimização...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de sugestões */}
      {!loading && filteredSuggestions.length > 0 && (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => {
            const Icon = SUGGESTION_ICONS[suggestion.type];
            const isExpanded = expandedSuggestion === suggestion.id;
            
            return (
              <Card key={suggestion.id} className="glass-card hover:glass-medium transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-white font-semibold">{suggestion.title}</h3>
                          <Badge className={`${IMPACT_COLORS[suggestion.impact]} border`}>
                            {suggestion.impact}
                          </Badge>
                          <Badge variant="outline" className="text-white/70 border-white/20">
                            {TYPE_LABELS[suggestion.type]}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{suggestion.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <span>Confiança: {suggestion.confidence}%</span>
                          <span>Prioridade: {suggestion.priority}/10</span>
                          {suggestion.estimatedROI && (
                            <span>ROI: {suggestion.estimatedROI.toFixed(1)}x</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                        variant="outline"
                        size="sm"
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        {isExpanded ? 'Menos' : 'Mais'}
                      </Button>
                      {suggestion.implementable && (
                        <Button
                          onClick={() => handleApplySuggestion(suggestion.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-medium mb-2">Ações Recomendadas</h4>
                          <ul className="space-y-2">
                            {suggestion.actionItems.map((item, index) => (
                              <li key={index} className="flex items-start space-x-2 text-white/70 text-sm">
                                <ArrowRight className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-2">Justificativa</h4>
                          <p className="text-white/70 text-sm">{suggestion.reasoning}</p>
                          {suggestion.expectedImprovement && (
                            <div className="mt-3">
                              <h5 className="text-white font-medium text-sm mb-1">Melhoria Esperada</h5>
                              <p className="text-green-400 text-sm">{suggestion.expectedImprovement}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sem sugestões */}
      {!loading && filteredSuggestions.length === 0 && analysis && (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Nenhuma sugestão encontrada</h3>
            <p className="text-white/60 text-sm">
              {analysis.suggestions.length === 0
                ? 'Não há sugestões disponíveis para o período selecionado.'
                : 'Nenhuma sugestão corresponde aos filtros aplicados.'}
            </p>
            {analysis.suggestions.length === 0 && (
              <Button
                onClick={generateOptimizations}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Sugestões
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 