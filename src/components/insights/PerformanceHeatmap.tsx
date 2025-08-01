import React, { useState, useMemo, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import { useHeatmapData, HEATMAP_METRICS } from '../../hooks/useHeatmapData';
import { Tooltip } from '../ui/tooltip';
import type { HeatmapFilters, HeatmapData, HeatmapTooltipData } from '../../types/heatmap';

interface PerformanceHeatmapProps {
  filters: HeatmapFilters;
  onFiltersChange: (filters: Partial<HeatmapFilters>) => void;
  className?: string;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 14 dias', days: 14 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 60 dias', days: 60 },
  { label: 'Últimos 90 dias', days: 90 },
];

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {
  const { data, loading, error, getColor, metric } = useHeatmapData(filters);
  const [hoveredDay, setHoveredDay] = useState<HeatmapData | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // Para controlar preview aberto

  // Fechar preview ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-heatmap-cell]') && !target.closest('[data-heatmap-preview]')) {
        setSelectedDay(null);
      }
    };

    if (selectedDay) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedDay]);

  // Calcular layout baseado no período
  const layoutConfig = useMemo(() => {
    const totalDays = filters.period;
    const cellSize = totalDays <= 30 ? 'w-8 h-8' : totalDays <= 60 ? 'w-6 h-6' : 'w-4 h-4';
    const cellSpacing = totalDays <= 30 ? 'gap-1' : 'gap-0.5';
    const fontSize = totalDays <= 30 ? 'text-xs' : 'text-[10px]';
    
    return { cellSize, cellSpacing, fontSize };
  }, [filters.period]);

  // Preparar dados do tooltip
  const getTooltipData = (day: HeatmapData): HeatmapTooltipData => {
    const date = new Date(day.date);
    const weekday = format(date, 'EEEE', { locale: ptBR });
    
    return {
      date: format(date, "dd 'de' MMMM", { locale: ptBR }),
      value: day.value,
      formattedValue: day.formattedValue || metric.format(day.value),
      metric: metric.label,
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      campaigns: day.campaigns || 0,
      rawData: day.rawData
    };
  };

  // Renderizar célula do heatmap
  const renderHeatmapCell = (day: HeatmapData, index: number) => {
    const date = new Date(day.date);
    const dayOfMonth = format(date, 'd');
    const backgroundColor = getColor(day.value);
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const isSelected = selectedDay === day.date;
    
    // Função para toggle do preview
    const handleDayClick = () => {
      setSelectedDay(prev => prev === day.date ? null : day.date);
    };

    // Renderizar preview se o dia estiver selecionado
    const renderPreview = () => {
      if (!isSelected) return null;
      
      return (
        <div 
          className="absolute z-50 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl min-w-64 max-w-sm"
          data-heatmap-preview
          style={{
            // Posicionamento simples e robusto
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            // Garantir que não saia da tela
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            overflow: 'auto',
          }}
        >
          <div className="space-y-3">
            <div className="font-semibold text-white border-b border-white/20 pb-2">
              {getTooltipData(day).weekday}, {getTooltipData(day).date}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-300">{metric.label}:</span>
                <div className="font-semibold text-white">{day.formattedValue}</div>
              </div>
              {day.rawData && (
                <>
                  <div>
                    <span className="text-gray-300">Campanhas:</span>
                    <div className="font-semibold text-white">{day.campaigns}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Leads:</span>
                    <div className="font-semibold text-white">{day.rawData.leads}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Gastos:</span>
                    <div className="font-semibold text-white">R$ {day.rawData.spend.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">CTR:</span>
                    <div className="font-semibold text-white">{day.rawData.ctr.toFixed(2)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-300">CPL:</span>
                    <div className="font-semibold text-white">R$ {day.rawData.cpl.toFixed(2)}</div>
                  </div>
                </>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-white/20">
              Clique novamente para fechar
            </div>
          </div>
          
          {/* Seta do preview */}
          <div className="absolute w-3 h-3 bg-gray-900/95 border border-white/20 transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0" />
        </div>
      );
    };
    
    return (
      <div key={`${day.date}-${index}`} className="relative">
        <Tooltip
          content={
            <div className="space-y-2">
              <div className="font-medium text-white">
                {getTooltipData(day).weekday}, {getTooltipData(day).date}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-300">{metric.label}:</span>
                  <div className="font-medium text-white">{day.formattedValue}</div>
                </div>
                {day.rawData && (
                  <>
                    <div>
                      <span className="text-gray-300">Campanhas:</span>
                      <div className="font-medium text-white">{day.campaigns}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Leads:</span>
                      <div className="font-medium text-white">{day.rawData.leads}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">Gastos:</span>
                      <div className="font-medium text-white">R$ {day.rawData.spend.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-300">CTR:</span>
                      <div className="font-medium text-white">{day.rawData.ctr.toFixed(2)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-300">CPL:</span>
                      <div className="font-medium text-white">R$ {day.rawData.cpl.toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                Clique para fixar preview
              </div>
            </div>
          }
        >
          <div
            className={`
              ${layoutConfig.cellSize} 
              rounded-md 
              border border-gray-200/20 
              cursor-pointer 
              transition-all duration-200 
              hover:scale-110 hover:z-10 
              flex items-center justify-center
              ${layoutConfig.fontSize} 
              font-bold
              ${isToday ? 'ring-2 ring-blue-400' : ''}
              ${isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''}
              ${day.value === 0 ? 'text-gray-400' : 'text-gray-800'}
            `}
            style={{ backgroundColor }}
            onMouseEnter={() => setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
            onClick={handleDayClick}
            data-heatmap-cell
            data-date={day.date}
          >
            {filters.period <= 30 ? dayOfMonth : ''}
          </div>
        </Tooltip>
        
        {/* Preview permanente quando selecionado */}
        {renderPreview()}
      </div>
    );
  };

  // Renderizar estatísticas
  const renderStats = () => {
    if (!data.stats || data.data.length === 0) return null;

    const { stats } = data;
    const trend = stats.total > 0 ? 'up' : stats.total < 0 ? 'down' : 'stable';
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="text-sm text-gray-400 mb-1">Total</div>
          <div className="font-semibold text-white">{metric.format(stats.total)}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="text-sm text-gray-400 mb-1">Média</div>
          <div className="font-semibold text-white">{metric.format(stats.avg)}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="text-sm text-gray-400 mb-1">Máximo</div>
          <div className="font-semibold text-white">{metric.format(stats.max)}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="text-sm text-gray-400 mb-1">Mínimo</div>
          <div className="font-semibold text-white">{metric.format(stats.min)}</div>
        </div>
      </div>
    );
  };

  // Renderizar controles
  const renderControls = () => (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Seletor de métrica */}
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Métrica
        </label>
        <select
          value={filters.metric}
          onChange={(e) => onFiltersChange({ metric: e.target.value })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {HEATMAP_METRICS.map(metric => (
            <option key={metric.key} value={metric.key} className="bg-gray-800">
              {metric.label}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor de período */}
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Período
        </label>
        <select
          value={filters.period}
          onChange={(e) => {
            const days = parseInt(e.target.value);
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - days + 1);
            
            onFiltersChange({ 
              period: days,
              startDate: start,
              endDate: end
            });
          }}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {PERIOD_OPTIONS.map(option => (
            <option key={option.days} value={option.days} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // Renderizar legenda
  const renderLegend = () => {
    const intensityLevels = [
      { label: 'Baixo', color: metric.colorScale.low },
      { label: 'Médio', color: metric.colorScale.medium },
      { label: 'Alto', color: metric.colorScale.high },
    ];

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-400">
          {format(filters.startDate, "dd 'de' MMM", { locale: ptBR })} - {format(filters.endDate, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
            {intensityLevels.map((level, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: level.color }}
              ></div>
            ))}
          </div>
          <span className="text-sm text-gray-400">Mais</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Heatmap de Performance</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Heatmap de Performance</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Erro ao carregar dados</div>
          <div className="text-gray-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!data.data.length) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Heatmap de Performance</h3>
        </div>
        {renderControls()}
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-300 mb-2">Nenhum dado encontrado</div>
          <div className="text-gray-400 text-sm">
            Não há dados para o período selecionado
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Heatmap de Performance</h3>
        <div className="ml-auto text-sm text-gray-400">
          {data.data.length} dias analisados
        </div>
      </div>

      {/* Controles */}
      {renderControls()}

      {/* Estatísticas */}
      {renderStats()}

      {/* Heatmap */}
      <div className="space-y-2 relative">
        {/* Labels dos dias da semana */}
        {filters.period <= 30 && (
          <div className={`grid grid-cols-7 ${layoutConfig.cellSpacing} mb-2`}>
            {WEEKDAY_LABELS.map(day => (
              <div
                key={day}
                className={`${layoutConfig.cellSize} flex items-center justify-center text-xs text-gray-400 font-medium`}
              >
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Grid do heatmap com espaçamento extra para previews */}
        <div className={`grid grid-cols-7 ${layoutConfig.cellSpacing} auto-rows-min pb-20`}>
          {data.data.map((day, index) => renderHeatmapCell(day, index))}
        </div>
      </div>

      {/* Legenda */}
      {renderLegend()}
    </div>
  );
}; 