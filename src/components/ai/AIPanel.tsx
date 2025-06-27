import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3, 
  Zap,
  Brain,
  Search,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import { useAnomalyDetection } from '../../hooks/useAnomalyDetection';
import AnomalyAlert from './AnomalyAlert';
import { OptimizationSuggestions } from './OptimizationSuggestions';
import ChatAssistant from './ChatAssistant';
import { AlertTriangle as AlertTriangleIcon, Settings as SettingsIcon } from 'lucide-react';

interface AIPanelProps {
  data: any[];
  filters: {
    dateRange: { startDate: string; endDate: string };
    [key: string]: any;
  };
}

const analysisTypes = [
  {
    id: 'variations',
    label: 'Variações',
    icon: TrendingUp,
    description: 'Identifica mudanças significativas nas métricas'
  },
  {
    id: 'anomalies',
    label: 'Anomalias',
    icon: AlertTriangle,
    description: 'Detecta padrões suspeitos e irregularidades'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Brain,
    description: 'Análise geral de performance das campanhas'
  },
  {
    id: 'optimization',
    label: 'Otimização',
    icon: Zap,
    description: 'Sugere melhorias para campanhas'
  }
];

function AIPanel({ data, filters }: AIPanelProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [anomalySensitivity, setAnomalySensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Hook para análise de IA
  const {
    analysis,
    isLoading,
    error,
    analyzeSpecific,
    clearAnalysis
  } = useAIAnalysis();

  // Hook para detecção de anomalias
  const {
    anomalies,
    loading: anomaliesLoading,
    error: anomaliesError,
    summary: anomaliesSummary,
    detectAnomalies,
    dismissAnomaly,
    markAsResolved,
    refresh: refreshAnomalies
  } = useAnomalyDetection({
    dateRange: {
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate
    },
    sensitivity: anomalySensitivity,
    autoRefresh: false,
    refreshInterval: 0
  });

  const handleAnalysisClick = async (analysisType: string) => {
    if (selectedAnalysis === analysisType) {
      setSelectedAnalysis(null);
      clearAnalysis();
      return;
    }

    setSelectedAnalysis(analysisType);
    
    if (analysisType === 'anomalies') {
      setShowAnomalies(true);
      setShowOptimizations(false);
      await detectAnomalies();
    } else if (analysisType === 'optimization') {
      setShowOptimizations(true);
      setShowAnomalies(false);
      // Otimizações são carregadas automaticamente pelo componente OptimizationSuggestions
    } else {
      setShowAnomalies(false);
      setShowOptimizations(false);
      // Converter dados para formato esperado pelo hook
      const performanceData = {
        campaigns: data,
        metrics: {
          totalLeads: data.reduce((sum, item) => sum + (item.leads || 0), 0),
          totalSpend: data.reduce((sum, item) => sum + (item.spend || 0), 0),
          totalImpressions: data.reduce((sum, item) => sum + (item.impressions || 0), 0),
          totalClicks: data.reduce((sum, item) => sum + (item.clicks || 0), 0),
        },
        period: `${filters.dateRange.startDate} - ${filters.dateRange.endDate}`
      };
      await analyzeSpecific(performanceData, analysisType as any);
    }
  };

  const handleSensitivityChange = async (newSensitivity: 'low' | 'medium' | 'high') => {
    setAnomalySensitivity(newSensitivity);
    if (showAnomalies) {
      await detectAnomalies();
    }
  };

  return (
    <>
      <Card className="glass-card overflow-x-auto min-h-[200px] w-full flex flex-col justify-between">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            Análise Inteligente
            <Badge variant="outline" className="ml-auto text-xs">
              IA
            </Badge>
          </CardTitle>
        </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between w-full">
        {/* Botões de Análise */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {analysisTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedAnalysis === type.id;
            const isButtonLoading = (type.id === 'anomalies' ? anomaliesLoading : isLoading) && isSelected;
            
            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
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

        {/* Seção de Anomalias */}
        {showAnomalies && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5 text-orange-400" />
                Anomalias Detectadas
                {anomaliesSummary && (
                  <Badge variant="outline" className="ml-2">
                    {anomaliesSummary.total}
                  </Badge>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-gray-400" />
                <select 
                  value={anomalySensitivity}
                  onChange={(e) => handleSensitivityChange(e.target.value as 'low' | 'medium' | 'high')}
                  className="bg-white/10 border border-white/20 text-white text-sm rounded px-2 py-1"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            {anomaliesError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">
                  Erro ao detectar anomalias: {anomaliesError}
                </p>
              </div>
            )}

            {anomaliesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                <span className="text-white/80">Detectando anomalias...</span>
              </div>
            ) : anomalies.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {anomalies.map((anomaly) => (
                  <AnomalyAlert
                    key={anomaly.id}
                    anomaly={anomaly}
                    onDismiss={dismissAnomaly}
                    onMarkResolved={markAsResolved}
                    showActions={true}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <span className="text-white/80">Nenhuma anomalia detectada</span>
              </div>
            )}
          </div>
        )}

        {/* Seção de Otimizações */}
        {showOptimizations && (
          <div className="w-full">
            <OptimizationSuggestions
              dateRange={filters.dateRange}
              campaignIds={data.map(campaign => campaign.campaign_id || campaign.id).filter(Boolean)}
              className="mt-4"
            />
          </div>
        )}

        {/* Resultado da Análise */}
        {selectedAnalysis && selectedAnalysis !== 'anomalies' && selectedAnalysis !== 'optimization' && (
          <div className="w-full">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-200 font-medium">Erro na análise</span>
                </div>
                <p className="text-red-200/80 text-sm mt-1">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                <span className="text-white/80">Gerando análise...</span>
              </div>
            ) : analysis ? (
              <div className="prose prose-sm w-full break-words whitespace-pre-line text-white/90">
                {typeof analysis.analysis === 'string' ? analysis.analysis : JSON.stringify(analysis, null, 2)}
              </div>
            ) : null}
          </div>
        )}

        {/* Estado Inicial */}
        {!selectedAnalysis && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/60 text-sm">
              Selecione um tipo de análise para começar
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Chat Assistant */}
    <ChatAssistant
      data={data}
      filters={filters}
      isOpen={isChatOpen}
      onToggle={() => setIsChatOpen(!isChatOpen)}
    />
    </>
  );
}

export default AIPanel;
export { AIPanel }; 