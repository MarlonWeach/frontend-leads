import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { usePerformanceForecast } from '../../hooks/usePerformanceForecast';
import { ForecastData, FORECAST_METRICS } from '../../types/forecast';

interface PerformanceForecastProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  className?: string;
}

interface ForecastCardProps {
  metric: string;
  data: {
    trend: 'up' | 'down' | 'stable';
    confidence: 'high' | 'medium' | 'low';
    next7Days: {
      total: number;
      average: number;
      min: number;
      max: number;
    };
  };
}

/**
 * Card individual de métrica prevista
 */
const ForecastCard: React.FC<ForecastCardProps> = ({ metric, data }) => {
  const metricConfig = FORECAST_METRICS[metric];
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Alta confiança';
      case 'medium':
        return 'Média confiança';
      case 'low':
        return 'Baixa confiança';
      default:
        return 'Confiança desconhecida';
    }
  };

  return (
    <div className="
      bg-white/5 
      backdrop-blur-sm 
      border 
      border-white/10 
      rounded-lg 
      p-4 
      transition-all 
      duration-300 
      hover:bg-white/10 
      hover:border-white/20
    ">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: metricConfig.color }}
          />
          <h3 className="text-sm font-semibold text-white">
            {metricConfig.label}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon(data.trend)}
          {getConfidenceIcon(data.confidence)}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          {/* Para CTR e CPL, usar average como métrica principal e mostrar "média" no label */}
          {(metric === 'ctr' || metric === 'cpl') ? (
            <>
              <div className="text-xs text-gray-400">Próximos 7 dias (média)</div>
              <div className="text-lg font-bold text-white">
                {metricConfig.format(data.next7Days.average)}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-400">Próximos 7 dias (total)</div>
              <div className="text-lg font-bold text-white">
                {metricConfig.format(data.next7Days.total)}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            {/* Para CTR e CPL, não mostrar o total calculado (sem serventia) */}
            {(metric === 'ctr' || metric === 'cpl') ? (
              <div></div> /* Espaço vazio para manter o grid */
            ) : (
              <>
                <div className="text-gray-400">Média/dia</div>
                <div className="font-medium text-white">
                  {metricConfig.format(data.next7Days.average)}
                </div>
              </>
            )}
          </div>
          <div>
            <div className="text-gray-400">Variação</div>
            <div className="font-medium text-white">
              {metricConfig.format(data.next7Days.min)} - {metricConfig.format(data.next7Days.max)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="text-xs text-gray-400">
            {getConfidenceText(data.confidence)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Gráfico de linha com histórico e previsões
 */
const ForecastChart: React.FC<{ 
  historical: ForecastData[]; 
  forecast: ForecastData[]; 
  metric: string;
}> = ({ historical, forecast, metric }) => {
  const metricConfig = FORECAST_METRICS[metric];
  
  // Utilitário para gerar range de datas (inclusive)
  function getDateRange(start: string | Date, end: string | Date): Date[] {
    const result: Date[] = [];
    let current = new Date(start);
    const last = new Date(end);
    while (current <= last) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  // Mapear pontos históricos e previsão por data
  const histMap = new Map(historical.map(p => [p.date, p.predicted]));
  const forecastMap = new Map(forecast.map(p => [p.date, p.predicted]));

  // Determinar datas de histórico e previsão
  const histDates = historical.map(p => p.date);
  const forecastDates = forecast.map(p => p.date);
  const minDate = histDates.length ? histDates.reduce((a, b) => a < b ? a : b) : null;
  const maxDate = forecastDates.length ? forecastDates.reduce((a, b) => a > b ? a : b) : null;

  // Determinar a data do gap (hoje)
  let gapDate: Date | null = null;
  if (histDates.length && forecastDates.length) {
    const lastHist = new Date(histDates[histDates.length - 1]);
    const firstForecast = new Date(forecastDates[0]);
    // O gap é o dia imediatamente após o último histórico e antes do primeiro previsto
    gapDate = new Date(lastHist);
    gapDate.setDate(gapDate.getDate() + 1);
  }

  // Gerar range completo: minDate -> maxDate, incluindo gap
  let fullRange: Date[] = [];
  if (minDate && maxDate) {
    fullRange = getDateRange(minDate, maxDate);
  }

  // Gerar série contínua para histórico e previsão, respeitando o gap
  const historicalSeries = {
    id: 'Histórico',
    color: metricConfig.color,
    data: fullRange.map(dateObj => {
      // Posicionar ponto no início do dia (meia-noite)
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dateMid = new Date(dateStr + 'T00:00:00');
      if (histMap.has(dateStr)) {
        const y = histMap.get(dateStr);
        return { x: dateMid, y: typeof y === 'number' ? y : null };
      }
      return { x: dateMid, y: null };
    })
  };
  const forecastSeries = {
    id: 'Previsão',
    color: metricConfig.forecastColor || '#00E0FF',
    data: fullRange.map(dateObj => {
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dateMid = new Date(dateStr + 'T00:00:00');
      if (forecastMap.has(dateStr)) {
        const y = forecastMap.get(dateStr);
        return { x: dateMid, y: typeof y === 'number' ? y : null };
      }
      return { x: dateMid, y: null };
    })
  };

  // Ajustar o range do eixo X para incluir o final do último dia previsto
  let xMin = fullRange[0];
  let xMax = fullRange[fullRange.length - 1];
  if (xMax) {
    xMax = new Date(xMax);
    xMax.setHours(23, 59, 59, 999);
  }

  const chartData = [historicalSeries, forecastSeries];

  // Gerar array de datas dos pontos para ticks do eixo X
  const tickDates = fullRange.map(dateObj => {
    const dateStr = dateObj.toISOString().slice(0, 10);
    return new Date(dateStr + 'T00:00:00');
  });

  // Se não há dados para exibir, mostrar placeholder
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-black/20 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">📊</div>
          <div className="text-sm">Sem dados disponíveis para {metricConfig.label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        xScale={{ 
          type: 'time', 
          format: '%Y-%m-%d',
          precision: 'day',
          min: xMin,
          max: xMax
        }}
        yScale={{ 
          type: 'linear', 
          min: 'auto', 
          max: 'auto',
          stacked: false 
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Data',
          legendOffset: 40,
          legendPosition: 'middle',
          format: '%d/%m',
          tickValues: tickDates
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: metricConfig.label,
          legendOffset: -50,
          legendPosition: 'middle',
        }}
        enablePoints={true}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        useMesh={true}
        enableArea={false}
        curve="linear"
        tooltip={input => {
          // input é sempre PointTooltipProps
          let date = 'N/A', value = 'N/A', label = metricConfig.label;
          if (input.point) {
            date = input.point.data.x instanceof Date ? format(input.point.data.x, 'EEE dd/MM', { locale: ptBR }) : String(input.point.data.x);
            value = input.point.data.yFormatted ?? 'N/A';
            label = input.point.seriesId || metricConfig.label;
          }
          return (
            <div className="p-2 rounded text-xs" style={{ color: '#fff', background: 'transparent' }}>
              <span>{date} - {value} {label}</span>
            </div>
          );
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: '#fff',
                fontSize: 12
              }
            },
            legend: {
              text: {
                fill: '#fff',
                fontSize: 14
              }
            }
          },
          grid: {
            line: {
              stroke: '#fff',
              strokeOpacity: 0.1
            }
          },
          tooltip: {
            container: {
              background: '#222',
              color: '#fff',
              fontSize: 12
            }
          }
        }}
        isInteractive={true}
        enableCrosshair={true}
        lineWidth={3}
        enablePointLabel={false}
        legends={[]}
      />
    </div>
  );
};

/**
 * Componente principal de previsões
 */
export const PerformanceForecast: React.FC<PerformanceForecastProps> = ({
  dateRange,
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState('leads');
  
  const { data, loading, error, refetch, metrics } = usePerformanceForecast({
    dateRange,
    config: {
      historicalDays: 30,
      forecastDays: 7,
      confidenceThreshold: 0.1,
      enableAI: false
    }
  });

  // Renderizar estado de loading
  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Previsões de Performance</h2>
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-700/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Erro nas Previsões</h2>
        </div>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Renderizar dados
  if (!data) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Previsões de Performance</h2>
        </div>
        <p className="text-gray-400">Nenhum dado de previsão disponível.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Previsões de Performance</h2>
        </div>
        <div className="text-xs text-gray-400">
          Gerado em {format(new Date(data.metadata.generatedAt), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>

      {/* Seletor de métrica */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Métrica para Visualização
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(metrics).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${selectedMetric === metric
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }
              `}
            >
              {metrics[metric].label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Histórico e Previsão - {metrics[selectedMetric].label}
        </h3>
        <div className="bg-black/20 rounded-lg p-4">
          <ForecastChart
            historical={
              data.historical && typeof data.historical === 'object' && !Array.isArray(data.historical)
                ? (data.historical as Record<string, ForecastData[]>)[selectedMetric] || []
                : []
            }
            forecast={
              data.forecast && typeof data.forecast === 'object' && !Array.isArray(data.forecast)
                ? (data.forecast as Record<string, ForecastData[]>)[selectedMetric] || []
                : []
            }
            metric={selectedMetric}
          />
        </div>
      </div>

      {/* Cards de métricas */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Resumo das Previsões (Próximos 7 dias)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.metrics).map(([metric, metricData]) => (
            <ForecastCard
              key={metric}
              metric={metric}
              data={metricData as {
                trend: 'up' | 'down' | 'stable';
                confidence: 'high' | 'medium' | 'low';
                next7Days: {
                  total: number;
                  average: number;
                  min: number;
                  max: number;
                };
              }}
            />
          ))}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
          <div>
            <div className="font-medium">Dados Históricos</div>
            <div>{data.metadata.historicalDays} dias</div>
          </div>
          <div>
            <div className="font-medium">Previsões</div>
            <div>{data.metadata.forecastDays} dias</div>
          </div>
          <div>
            <div className="font-medium">Métricas</div>
            <div>{Object.keys(data.metrics).length}</div>
          </div>
          <div>
            <div className="font-medium">IA Utilizada</div>
            <div>{data.metadata.aiUsed ? 'Sim' : 'Não'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 