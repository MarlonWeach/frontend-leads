import React from 'react';
import { AIAnalysis } from '../../hooks/useAIAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  GitCompare, 
  Activity, 
  Target,
  Gauge
} from 'lucide-react';
import { ModelIndicator } from './ModelIndicator';

interface InsightCardProps {
  analysis: AIAnalysis;
  isLoading?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ analysis, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="w-full glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-white/20 rounded animate-pulse" />
            <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded animate-pulse" />
            <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderAnalysisSection = (title: string, content: string | undefined, icon: React.ReactNode, color: string) => {
    if (!content) return null;
    
    return (
      <div className="mb-6">
        <h4 className="font-medium text-sm text-white mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className={`glass-light p-4 rounded-xl border-l-4 ${color} overflow-hidden`}>
          <div className="text-white/90 leading-relaxed break-words whitespace-pre-wrap text-sm">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full glass-card border-electric/20 max-w-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-electric flex-shrink-0" />
            <CardTitle className="text-lg font-semibold text-white">
              Análise Inteligente Completa
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-electric/20 text-electric border-electric/30 flex-shrink-0">
              IA Powered
            </Badge>
            <ModelIndicator 
              modelUsed={analysis.modelUsed} 
              isFallback={analysis.isFallback}
              showDetails={false}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-6 max-w-full overflow-hidden">
        {/* Análise Principal */}
        {renderAnalysisSection(
          'Análise de Performance',
          analysis.analysis,
          <Lightbulb className="h-4 w-4 text-electric flex-shrink-0" />,
          'border-electric'
        )}

        {/* Análise de Tendências */}
        {renderAnalysisSection(
          'Análise de Tendências',
          analysis.trends,
          <TrendingUp className="h-4 w-4 text-blue-400 flex-shrink-0" />,
          'border-blue-400'
        )}

        {/* Comparação entre Campanhas */}
        {renderAnalysisSection(
          'Comparação entre Campanhas',
          analysis.comparison,
          <GitCompare className="h-4 w-4 text-green-400 flex-shrink-0" />,
          'border-green-400'
        )}

        {/* Análise de Variações */}
        {renderAnalysisSection(
          'Análise de Variações',
          analysis.variations,
          <Activity className="h-4 w-4 text-orange-400 flex-shrink-0" />,
          'border-orange-400'
        )}

        {/* Análise de Eficiência */}
        {renderAnalysisSection(
          'Análise de Eficiência',
          analysis.efficiency,
          <Target className="h-4 w-4 text-violet flex-shrink-0" />,
          'border-violet'
        )}

        {/* Anomalias Detectadas */}
        {analysis.anomalies && analysis.anomalies.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              Anomalias Detectadas
            </h4>
            <ul className="space-y-3">
              {analysis.anomalies.map((anomaly, index) => (
                <li key={index} className="glass-light p-4 rounded-xl border-l-4 border-red-400 overflow-hidden">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 mt-1 flex-shrink-0">⚠️</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-red-300 mb-1 break-words">{anomaly.type}</div>
                      <div className="text-white/90 text-sm mb-2 break-words">{anomaly.description}</div>
                      <Badge 
                        variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}
                        className={`text-xs ${
                          anomaly.severity === 'high' 
                            ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                            : anomaly.severity === 'medium' 
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                            : 'bg-green-500/20 text-green-300 border-green-400/30'
                        }`}
                      >
                        {anomaly.severity === 'high' ? 'Alta' : anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sugestões de Otimização */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-white mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              Sugestões de Otimização
            </h4>
            <ul className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="glass-light p-4 rounded-xl border-l-4 border-yellow-400 overflow-hidden">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1 flex-shrink-0">💡</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-yellow-300 mb-1 break-words">{suggestion.type}</div>
                      <div className="text-white/90 text-sm mb-2 break-words">{suggestion.suggestion}</div>
                      <div className="text-xs text-white/70 break-words">
                        Impacto esperado: {suggestion.expectedImpact}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/70">
            Análise gerada em: {new Date(analysis.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 