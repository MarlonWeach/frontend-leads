import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Brain, 
  X, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  Search,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAIAnalysis, type AIModelType } from '../../hooks/useAIAnalysis';
import { ModelSelector } from './ModelSelector';
import { ModelIndicator } from './ModelIndicator';

interface IndividualAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    type: 'campaign' | 'adset' | 'ad';
    data: any;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const analysisTypes = [
  {
    id: 'performance',
    label: 'Performance',
    icon: TrendingUp,
    description: 'Análise geral de performance',
    color: 'purple'
  },
  {
    id: 'anomalies',
    label: 'Anomalias',
    icon: AlertTriangle,
    description: 'Detectar problemas',
    color: 'orange'
  },
  {
    id: 'optimization',
    label: 'Otimização',
    icon: Zap,
    description: 'Sugestões de melhoria',
    color: 'green'
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Search,
    description: 'Insights detalhados',
    color: 'blue'
  }
];

// Função para obter classes de cor
const getAnalysisColorClasses = (color: string, isSelected: boolean) => {
  const colorMap = {
    blue: {
      selected: 'bg-blue-900/30 border-blue-500/20 text-blue-400',
      unselected: 'bg-blue-900/20 border-blue-500/10 text-blue-300 hover:bg-blue-900/30'
    },
    orange: {
      selected: 'bg-orange-900/30 border-orange-500/20 text-orange-400',
      unselected: 'bg-orange-900/20 border-orange-500/10 text-orange-300 hover:bg-orange-900/30'
    },
    purple: {
      selected: 'bg-purple-900/30 border-purple-500/20 text-purple-400',
      unselected: 'bg-purple-900/20 border-purple-500/10 text-purple-300 hover:bg-purple-900/30'
    },
    green: {
      selected: 'bg-green-900/30 border-green-500/20 text-green-400',
      unselected: 'bg-green-900/20 border-green-500/10 text-green-300 hover:bg-green-900/30'
    }
  };

  return colorMap[color as keyof typeof colorMap]?.[isSelected ? 'selected' : 'unselected'] || colorMap.blue.unselected;
};

export default function IndividualAnalysis({ isOpen, onClose, item, dateRange }: IndividualAnalysisProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelType>('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);

  const {
    analysis,
    isLoading,
    error: aiError,
    analyzeSpecific,
    clearAnalysis
  } = useAIAnalysis();

  const handleAnalysisClick = async (analysisType: string) => {
    if (selectedAnalysis === analysisType) {
      setSelectedAnalysis(null);
      clearAnalysis();
      return;
    }

    setSelectedAnalysis(analysisType);
    setError(null);

    try {
      // Preparar dados no formato correto que a API espera
      const analysisData: any = {
        period: `${dateRange.startDate} - ${dateRange.endDate}`,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      };

      // Adicionar dados específicos baseado no tipo do item
      if (item.type === 'campaign') {
        analysisData.campaigns = [{
          id: item.id,
          campaign_id: item.id,
          campaign_name: item.name,
          name: item.name,
          // Garantir que todos os campos numéricos sejam números válidos
          leads: Number(item.data?.leads || 0),
          spend: Number(item.data?.spend || 0),
          ctr: Number(item.data?.ctr || 0),
          cpl: Number(item.data?.cpl || 0),
          impressions: Number(item.data?.impressions || 0),
          clicks: Number(item.data?.clicks || 0),
          // Adicionar campos adicionais que podem estar disponíveis
          ...item.data
        }];
      } else if (item.type === 'adset') {
        analysisData.adsets = [{
          id: item.id,
          adset_id: item.id,
          adset_name: item.name,
          name: item.name,
          // Garantir que todos os campos numéricos sejam números válidos
          leads: Number(item.data?.leads || 0),
          spend: Number(item.data?.spend || 0),
          ctr: Number(item.data?.ctr || 0),
          cpl: Number(item.data?.cpl || 0),
          impressions: Number(item.data?.impressions || 0),
          clicks: Number(item.data?.clicks || 0),
          // Adicionar campos adicionais que podem estar disponíveis
          ...item.data
        }];
      } else if (item.type === 'ad') {
        analysisData.ads = [{
          id: item.id,
          ad_id: item.id,
          ad_name: item.name,
          name: item.name,
          // Garantir que todos os campos numéricos sejam números válidos
          leads: Number(item.data?.leads || 0),
          spend: Number(item.data?.spend || 0),
          ctr: Number(item.data?.ctr || 0),
          cpl: Number(item.data?.cpl || 0),
          impressions: Number(item.data?.impressions || 0),
          clicks: Number(item.data?.clicks || 0),
          // Adicionar campos adicionais que podem estar disponíveis
          ...item.data
        }];
      }

      console.log('Dados enviados para análise:', analysisData);
      await analyzeSpecific(analysisData, analysisType as any, selectedModel);
    } catch (error: any) {
      console.error('Error in individual analysis:', error);
      setError('Erro ao processar análise. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              Análise de {item.type === 'campaign' ? 'Campanha' : item.type === 'adset' ? 'Adset' : 'Ad'}
              <Badge variant="outline" className="ml-2 text-xs">
                {item.name}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Controles de Modelo */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="text-white/70 hover:text-white text-sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Configurar Modelo
              {showModelSelector ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
            
            {/* Indicador do modelo usado na última análise */}
            {analysis && (
              <ModelIndicator 
                modelUsed={analysis.modelUsed} 
                isFallback={analysis.isFallback}
                className="ml-auto"
              />
            )}
          </div>
          
          {/* Seletor de Modelo (colapsável) */}
          {showModelSelector && (
            <div className="pt-4 border-t border-white/10">
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isLoading}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Botões de Análise */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedAnalysis === type.id;
              const isButtonLoading = isLoading && isSelected;
              const colorClasses = getAnalysisColorClasses(type.color, isSelected);
              
              return (
                <Button
                  key={type.id}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-300 border rounded-lg ${
                    isSelected 
                      ? colorClasses
                      : `${colorClasses} hover:scale-105`
                  }`}
                  onClick={() => handleAnalysisClick(type.id)}
                  disabled={isButtonLoading}
                >
                  {isButtonLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs opacity-80 text-center leading-tight">
                    {type.description}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Resultado da Análise */}
          {selectedAnalysis && (
            <div className="w-full">
              {(error || aiError) && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-200 font-medium">Erro na análise</span>
                  </div>
                  <p className="text-red-200/80 text-sm mt-1">{error || aiError}</p>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                  <span className="text-white/80">Gerando análise...</span>
                </div>
              ) : analysis ? (
                <div className="prose prose-sm w-full break-words whitespace-pre-line text-white/90">
                  {analysisType === 'optimization' ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">🎯 Sugestões de Otimização</h3>
                      {Array.isArray(analysis.analysis) ? (
                        <div className="space-y-3">
                          {analysis.analysis.map((suggestion: any, index: number) => (
                            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-blue-400">
                                  {suggestion.type?.toUpperCase() || 'OTIMIZAÇÃO'}
                                </span>
                                <span className="text-xs text-white/60">•</span>
                                <span className="text-xs text-green-400 font-medium">
                                  {suggestion.expectedImpact}
                                </span>
                              </div>
                              <p className="text-white/90 text-sm leading-relaxed">
                                {suggestion.suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                          <p className="text-yellow-200 text-sm">
                            Formato de sugestões inválido. Retornando sugestões padrão.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    typeof analysis.analysis === 'string' ? analysis.analysis : JSON.stringify(analysis, null, 2)
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">
                    Selecione um tipo de análise para começar
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estado Inicial */}
          {!selectedAnalysis && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 text-sm">
                Selecione um tipo de análise para analisar {item.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 