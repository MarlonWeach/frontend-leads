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
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAIAnalysis, type AIModelType } from '../../hooks/useAIAnalysis';
import { useAnomalyDetection } from '../../hooks/useAnomalyDetection';
import AnomalyAlert from './AnomalyAlert';
import { OptimizationSuggestions } from './OptimizationSuggestions';
import ChatAssistant from './ChatAssistant';
import { AlertTriangle as AlertTriangleIcon, Settings as SettingsIcon } from 'lucide-react';
import { logger } from '../../utils/logger';
import { ModelSelector } from './ModelSelector';
import { ModelIndicator } from './ModelIndicator';
import ReactMarkdown from 'react-markdown';

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
    description: 'Identifica mudanças significativas nas métricas',
    color: 'blue'
  },
  {
    id: 'anomalies',
    label: 'Anomalias',
    icon: AlertTriangle,
    description: 'Detecta padrões suspeitos e irregularidades',
    color: 'orange'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Brain,
    description: 'Análise geral de performance das campanhas',
    color: 'purple'
  },
  {
    id: 'optimization',
    label: 'Otimização',
    icon: Zap,
    description: 'Sugere melhorias para campanhas',
    color: 'green'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: Search,
    description: 'Assistente virtual para dúvidas',
    color: 'indigo'
  }
];

// Função para obter classes de cor baseadas no tipo de análise
const getAnalysisColorClasses = (color: string, isSelected: boolean) => {
  const colorMap = {
    blue: {
      selected: 'bg-blue-900/30 border-blue-500/20 hover:bg-blue-900/40 hover:border-blue-500/40 text-blue-400',
      unselected: 'bg-blue-900/20 border-blue-500/10 hover:bg-blue-900/30 hover:border-blue-500/30 text-blue-300'
    },
    orange: {
      selected: 'bg-orange-900/30 border-orange-500/20 hover:bg-orange-900/40 hover:border-orange-500/40 text-orange-400',
      unselected: 'bg-orange-900/20 border-orange-500/10 hover:bg-orange-900/30 hover:border-orange-500/30 text-orange-300'
    },
    purple: {
      selected: 'bg-purple-900/30 border-purple-500/20 hover:bg-purple-900/40 hover:border-purple-500/40 text-purple-400',
      unselected: 'bg-purple-900/20 border-purple-500/10 hover:bg-purple-900/30 hover:border-purple-500/30 text-purple-300'
    },
    green: {
      selected: 'bg-green-900/30 border-green-500/20 hover:bg-green-900/40 hover:border-green-500/40 text-green-400',
      unselected: 'bg-green-900/20 border-green-500/10 hover:bg-green-900/30 hover:border-green-500/30 text-green-300'
    },
    indigo: {
      selected: 'bg-indigo-900/30 border-indigo-500/20 hover:bg-indigo-900/40 hover:border-indigo-500/40 text-indigo-400',
      unselected: 'bg-indigo-900/20 border-indigo-500/10 hover:bg-indigo-900/30 hover:border-indigo-500/30 text-indigo-300'
    }
  };

  return colorMap[color as keyof typeof colorMap]?.[isSelected ? 'selected' : 'unselected'] || colorMap.blue.unselected;
};

function AIPanel({ data, filters }: AIPanelProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [anomalySensitivity, setAnomalySensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelType>('auto');
  
  // Estados para filtros
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedAdset, setSelectedAdset] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

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

  // Estado de erro para IA
  const [aiError, setAIError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<boolean>(false);

  // Extrair campanhas e adsets únicos dos dados
  const uniqueCampaigns = Array.from(new Set(data.map(item => item.campaign_name || item.name || 'Sem nome')));
  const uniqueAdsets = Array.from(new Set(data.map(item => item.adset_name || '').filter(Boolean)));

  // Função genérica para tratar erros de IA
  function handleAIError(error: any) {
    logger.warn({
      msg: 'Erro de IA recebido',
      error: error instanceof Error ? error.message : String(error),
      code: error?.code,
      status: error?.status,
      context: 'AIPanel'
    });
    
    if (error?.code === 'rate_limit_exceeded' || error?.status === 429) {
      setRateLimit(true);
      setAIError('Limite de uso da IA atingido. Aguarde alguns minutos e tente novamente.');
    } else {
      setAIError('Erro ao processar análise de IA. Tente novamente em instantes.');
    }
  }

  // Filtrar dados baseado nas seleções
  const getFilteredData = () => {
    let filtered = data;
    
    if (selectedCampaign) {
      filtered = filtered.filter(item => 
        (item.campaign_name || item.name || '') === selectedCampaign
      );
    }
    
    if (selectedAdset) {
      filtered = filtered.filter(item => 
        (item.adset_name || '') === selectedAdset
      );
    }
    
    return filtered;
  };

  const handleAnalysisClick = async (analysisType: string) => {
    if (selectedAnalysis === analysisType) {
      setSelectedAnalysis(null);
      clearAnalysis();
      return;
    }

    setSelectedAnalysis(analysisType);
    setAIError(null);
    setRateLimit(false);
    
    if (analysisType === 'anomalies') {
      setShowAnomalies(true);
      setShowOptimizations(false);
      await detectAnomalies();
    } else if (analysisType === 'optimization') {
      setShowOptimizations(true);
      setShowAnomalies(false);
      // Otimizações são carregadas automaticamente pelo componente OptimizationSuggestions
    } else if (analysisType === 'chat') {
      setIsChatOpen(true);
      setShowAnomalies(false);
      setShowOptimizations(false);
    } else {
      setShowAnomalies(false);
      setShowOptimizations(false);
      
      // Usar dados filtrados
      const filteredData = getFilteredData();
      
      // Converter dados para formato esperado pelo hook
      const performanceData = {
        campaigns: filteredData,
        metrics: {
          totalLeads: filteredData.reduce((sum, item) => sum + (item.leads || 0), 0),
          totalSpend: filteredData.reduce((sum, item) => sum + (item.spend || 0), 0),
          totalImpressions: filteredData.reduce((sum, item) => sum + (item.impressions || 0), 0),
          totalClicks: filteredData.reduce((sum, item) => sum + (item.clicks || 0), 0),
        },
        period: `${filters.dateRange.startDate} - ${filters.dateRange.endDate}`,
        filters: {
          campaign: selectedCampaign,
          adset: selectedAdset
        }
      };
      
      try {
        await analyzeSpecific(performanceData, analysisType as any, selectedModel);
      } catch (error) {
        handleAIError(error);
      }
    }
  };

  const handleSensitivityChange = async (newSensitivity: 'low' | 'medium' | 'high') => {
    setAnomalySensitivity(newSensitivity);
    if (showAnomalies) {
      await detectAnomalies();
    }
  };

  const clearFilters = () => {
    setSelectedCampaign('');
    setSelectedAdset('');
  };

  return (
    <>
      {/* Mensagem de erro global IA */}
      {aiError && (
        <div data-testid="ai-error" className="my-2 p-2 bg-red-900 text-red-200 rounded text-sm">
          {aiError}
        </div>
      )}
      {rateLimit && (
        <div data-testid="ai-rate-limit" className="my-2 p-2 bg-yellow-900 text-yellow-200 rounded text-sm">
          Limite de requisições da IA atingido. Aguarde alguns minutos e tente novamente.
        </div>
      )}
      <Card className="glass-card overflow-x-auto min-h-[200px] w-full flex flex-col justify-between" data-testid="ai-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            Análise Inteligente
            <Badge variant="outline" className="ml-auto text-xs">
              IA
            </Badge>
          </CardTitle>
          
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

      <CardContent className="flex-1 flex flex-col justify-between w-full">
        {/* Filtros */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtros</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {(selectedCampaign || selectedAdset) && (
              <button
                onClick={clearFilters}
                className="text-xs text-white/60 hover:text-white/80 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              {/* Filtro de Campanha */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Campanha</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-white/40"
                >
                  <option value="">Todas as campanhas</option>
                  {uniqueCampaigns.map((campaign, index) => (
                    <option key={index} value={campaign}>
                      {campaign}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filtro de Adset */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Adset</label>
                <select
                  value={selectedAdset}
                  onChange={(e) => setSelectedAdset(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-white/40"
                >
                  <option value="">Todos os adsets</option>
                  {uniqueAdsets.map((adset, index) => (
                    <option key={index} value={adset}>
                      {adset}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Análise com cores dos cards de métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {analysisTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedAnalysis === type.id;
            const isButtonLoading = (type.id === 'anomalies' ? anomaliesLoading : isLoading) && isSelected;
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

        {/* Seção de Anomalias */}
        {showAnomalies && (
          <div data-testid="anomalies-section">
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
          <div data-testid="optimization-section">
            <OptimizationSuggestions
              dateRange={filters.dateRange}
              campaignIds={getFilteredData().map(campaign => campaign.campaign_id || campaign.id).filter(Boolean)}
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
              <div className="prose prose-invert max-w-none text-white">
                <ReactMarkdown>
                  {typeof analysis?.analysis === 'string' && analysis.analysis.trim()
                    ? analysis.analysis
                    : typeof analysis?.analysis === 'object' && analysis.analysis !== null
                      ? JSON.stringify(analysis.analysis, null, 2)
                      : 'Nenhuma análise disponível.'}
                </ReactMarkdown>
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

    {/* Chat Assistant visível imediatamente ao abrir */}
    <ChatAssistant 
      data={getFilteredData()}
      filters={filters}
      isOpen={isChatOpen}
      onToggle={() => setIsChatOpen(!isChatOpen)}
    />
    </>
  );
}

export default AIPanel;
export { AIPanel }; 