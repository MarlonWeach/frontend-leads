import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  AlertTriangle,
  TrendingDown,
  Info
} from 'lucide-react';
import { usePerformanceInsights } from '../../hooks/usePerformanceInsights';
import { DateRange, InsightConfig, PerformanceInsight } from '../../types/insights';
import { formatVariation } from '../../utils/performanceAnalysis';

interface InsightsPanelProps {
  dateRange: DateRange;
  config?: InsightConfig;
  className?: string;
}

interface InsightCardProps {
  insight: PerformanceInsight;
}

/**
 * Card individual de insight
 */
const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getIcon = (type: string, variation: number) => {
    const isPositive = variation > 0;
    
    switch (type) {
      case 'success':
        return isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Lightbulb className="w-5 h-5" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-500/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/10';
      case 'critical':
        return 'border-l-red-500 bg-red-500/10';
      case 'info':
        return 'border-l-blue-500 bg-blue-500/10';
      default:
        return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div 
      className={`
        insight-card 
        ${getTypeColor(insight.type)}
        border-l-4 
        rounded-lg 
        p-4 
        backdrop-blur-sm 
        bg-white/5 
        border 
        border-white/10 
        transition-all 
        duration-300 
        hover:transform 
        hover:-translate-y-1 
        hover:shadow-lg 
        hover:shadow-black/20
        cursor-pointer
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          icon-container 
          p-2 
          rounded-full 
          ${insight.type === 'success' ? 'bg-green-500/20 text-green-400' : ''}
          ${insight.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : ''}
          ${insight.type === 'critical' ? 'bg-red-500/20 text-red-400' : ''}
          ${insight.type === 'info' ? 'bg-blue-500/20 text-blue-400' : ''}
        `}>
          {getIcon(insight.type, insight.variation)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white truncate">
              {insight.title}
            </h3>
            <span className={`
              text-xs font-medium px-2 py-1 rounded-full
              ${insight.priority === 'high' ? 'bg-red-500/20 text-red-400' : ''}
              ${insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : ''}
              ${insight.priority === 'low' ? 'bg-blue-500/20 text-blue-400' : ''}
            `}>
              {insight.priority}
            </span>
          </div>
          
          <p className="text-xs text-gray-300 mb-2 line-clamp-2">
            {insight.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`
              text-sm font-semibold
              ${insight.variation > 0 ? 'text-green-400' : 'text-red-400'}
            `}>
              {formatVariation(insight.variation)}
            </span>
            
            {insight.suggestedAction && (
              <span className="text-xs text-gray-400 italic">
                💡 {insight.suggestedAction}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Estado de loading com skeleton cards
 */
const LoadingState: React.FC = () => (
  <div className="insights-loading space-y-4">
    {[1, 2, 3].map((i) => (
      <div 
        key={i}
        className="
          skeleton-card 
          h-24 
          bg-gray-700/50 
          rounded-lg 
          animate-pulse
          border 
          border-white/10
        "
      />
    ))}
  </div>
);

/**
 * Estado de erro
 */
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="
    insights-error 
    flex 
    items-center 
    space-x-3 
    p-4 
    bg-red-500/10 
    border 
    border-red-500/20 
    rounded-lg
  ">
    <AlertCircle className="w-5 h-5 text-red-400" />
    <p className="text-sm text-red-300">
      Erro ao carregar insights: {error}
    </p>
  </div>
);

/**
 * Estado vazio quando não há insights
 */
const EmptyState: React.FC = () => (
  <div className="
    insights-empty 
    flex 
    flex-col 
    items-center 
    justify-center 
    p-8 
    text-center
  ">
    <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">
      Nenhum insight encontrado
    </h3>
    <p className="text-sm text-gray-400">
      Não foram detectadas mudanças significativas no período selecionado.
    </p>
  </div>
);

/**
 * Componente principal de insights
 */
export const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  dateRange, 
  config,
  className = ''
}) => {
  const { insights, loading, error } = usePerformanceInsights({ 
    dateRange, 
    config 
  });

  const formatDateRange = (range: DateRange) => {
    try {
      if (!range || !range.start || !range.end) {
        return 'Período não definido';
      }
      
      const start = range.start instanceof Date ? range.start : new Date(range.start);
      const end = range.end instanceof Date ? range.end : new Date(range.end);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Período inválido';
      }
      
      return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    } catch (error) {
      console.warn('Erro ao formatar período:', error);
      return 'Período não disponível';
    }
  };

  // Função para obter cor baseada no tipo de métrica
  const getMetricColor = (metricName: string | undefined | null) => {
    if (typeof metricName !== 'string') {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
    switch (metricName.toLowerCase()) {
      case 'leads':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'spend':
      case 'gasto':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'impressions':
      case 'impressões':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'clicks':
      case 'cliques':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ctr':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cpl':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Função para obter ícone baseado no tipo de métrica
  const getMetricIcon = (metricName: string | undefined | null) => {
    if (typeof metricName !== 'string') {
      return <Info className="w-4 h-4" />;
    }
    switch (metricName.toLowerCase()) {
      case 'leads':
        return <TrendingUp className="w-4 h-4" />;
      case 'spend':
      case 'gasto':
        return <TrendingUp className="w-4 h-4" />;
      case 'impressions':
      case 'impressões':
        return <TrendingUp className="w-4 h-4" />;
      case 'clicks':
      case 'cliques':
        return <TrendingUp className="w-4 h-4" />;
      case 'ctr':
        return <AlertCircle className="w-4 h-4" />;
      case 'cpl':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className={`insights-panel ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">
            Insights de Performance
          </h2>
          <span className="text-sm text-gray-400">
            {formatDateRange(dateRange)}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Análise automática de mudanças significativas em suas métricas
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {!loading && !error && insights.length === 0 && (
          <EmptyState />
        )}
        {!loading && !error && insights.length > 0 && (
          <ul className="insights-list space-y-3" role="list">
            {insights.filter(insight => typeof insight.title === 'string' && insight.title).map((insight, index) => {
              // Gerar chave única combinando múltiplos campos
              const uniqueKey = `insight-${insight.campaignId || 'global'}-${insight.title}-${insight.variation}-${index}`;
              
              return (
                <li 
                  key={uniqueKey}
                  className={`
                    bg-white/5 
                    border 
                    border-white/10 
                    rounded-lg 
                    p-4 
                    flex 
                    items-start 
                    gap-3
                    transition-all 
                    duration-300 
                    hover:bg-white/10 
                    hover:border-white/20
                    ${getMetricColor(insight.metric)}
                    focus:outline-none focus:ring-2 focus:ring-yellow-400
                    animate-fadein
                  `}
                  tabIndex={0}
                  aria-label={`Insight: ${insight.title}. ${insight.description}`}
                  role="listitem"
                  title={`Insight: ${insight.title}\n${insight.description}\nVariação: ${insight.variation > 0 ? '+' : ''}${insight.variationPercent?.toFixed(1)}%`}
                >
                  <div 
                    className={`
                      p-2 
                      rounded-full 
                      flex-shrink-0
                      ${getMetricColor(insight.metric)}
                    `}
                    title={`Métrica: ${insight.metric || 'Geral'}`}
                    aria-label={`Ícone da métrica ${insight.metric || 'Geral'}`}
                  >
                    {getMetricIcon(insight.metric)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        {insight.campaignName || insight.campaignId || 'Geral'}
                      </h3>
                      <span 
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full
                          ${insight.variation > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                        `}
                        title={`Variação: ${insight.variation > 0 ? '+' : ''}${insight.variationPercent?.toFixed(1)}%`}
                        aria-label={`Variação percentual: ${insight.variation > 0 ? '+' : ''}${insight.variationPercent?.toFixed(1)}%`}
                      >
                        {insight.variation > 0 ? '+' : ''}{insight.variationPercent?.toFixed(1)}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">
                      {insight.description}
                    </p>
                    
                    {insight.suggestedAction && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 italic">
                          💡 {insight.suggestedAction}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && insights.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          {/* Aviso sobre threshold de variação */}
          <div className="text-sm font-semibold text-yellow-400 mb-2">
            Somente são apresentados dados de variações acima de 10%
          </div>
        </div>
      )}
    </div>
  );
}; 