'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Função para normalizar valores em diferentes escalas
function normalizeValue(value, min, max) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

// Função para abreviar números
function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toLocaleString('pt-BR');
}

// Cores do tema
const DEFAULT_COLORS = ["#2E5FF2", "#8A2BE2", "#F29D35", "#00E6C0"];

// Componente de gráfico de linhas múltiplas
const LineChartAnimated = ({ data, width = 800, height = 400, title }) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhum dado disponível para o gráfico
      </div>
    );
  }

  // Definir cores para cada métrica
  const colors = {
    spend: '#4F46E5', // azul
    impressions: '#10B981', // verde
    clicks: '#F59E0B', // laranja
    leads: '#EC4899' // rosa
  };

  // Lista de métricas para exibir
  const metrics = ['spend', 'impressions', 'clicks', 'leads'];

  // Validar e limpar dados
  const cleanData = data.map(item => ({
    date: item.date || '',
    spend: Number(item.spend) || 0,
    impressions: Number(item.impressions) || 0,
    clicks: Number(item.clicks) || 0,
    leads: Number(item.leads) || 0
  }));

  // Encontrar valores min/max para cada métrica
  const ranges = {};
  metrics.forEach(metric => {
    const values = cleanData.map(d => d[metric]).filter(v => !isNaN(v) && isFinite(v));
    ranges[metric] = {
      min: Math.min(...values) || 0,
      max: Math.max(...values) || 1
    };
  });

  // Normalizar valores para escala 0-1
  const normalizeValue = (value, metric) => {
    const range = ranges[metric];
    if (range.max === range.min) return 0.5; // Valor padrão se min === max
    return (value - range.min) / (range.max - range.min);
  };

  // Calcular pontos do gráfico
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const xScale = chartWidth / (cleanData.length - 1);
  
  const getPoints = (metric) => {
    return cleanData.map((d, i) => {
      const normalizedValue = normalizeValue(d[metric], metric);
      return {
        x: padding + i * xScale,
        y: height - padding - (normalizedValue * chartHeight),
        value: d[metric],
        date: d.date
      };
    });
  };

  // Gerar path string para cada linha
  const createPathD = (points) => {
    return points.reduce((path, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return path + `${command} ${point.x},${point.y} `;
    }, '');
  };

  // Criar grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = padding + (i * (chartHeight / numGridLines));
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#374151"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
    );
  }

  // Formatar valores para legenda
  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.round(value).toString();
  };

  // Função para mostrar tooltip
  const showTooltip = (event, dataPoint, pointIndex) => {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      show: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      data: dataPoint
    });
    setHoveredPoint(pointIndex);
  };

  // Função para esconder tooltip
  const hideTooltip = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
    setHoveredPoint(null);
  };

  // Formatação de valores para tooltip
  const formatTooltipValue = (key, value) => {
    // Validar se o valor existe e é um número válido
    const numValue = Number(value);
    if (isNaN(numValue) || value === null || value === undefined) {
      return '0';
    }

    switch (key) {
      case 'spend':
        return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'impressions':
        return numValue.toLocaleString('pt-BR');
      case 'clicks':
        return numValue.toLocaleString('pt-BR');
      case 'leads':
        return numValue.toLocaleString('pt-BR');
      default:
        return numValue.toString();
    }
  };

  const getMetricLabel = (key) => {
    switch (key) {
      case 'spend': return 'Investimento';
      case 'impressions': return 'Impressões';
      case 'clicks': return 'Cliques';
      case 'leads': return 'Leads';
      default: return key;
    }
  };

  return (
    <div className="relative w-full">
      {title && (
        <h2 className="text-xl font-bold text-white mb-6 text-center">{title}</h2>
      )}

      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        className="overflow-visible"
      >
        {/* Grid lines */}
        {gridLines}

        {/* Linhas e pontos para cada métrica */}
        {metrics.map(metric => {
          const points = getPoints(metric);
          const pathD = createPathD(points);

          return (
            <g key={metric}>
              {/* Linha */}
              <motion.path
                d={pathD}
                stroke={colors[metric]}
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />

              {/* Pontos */}
              {points.map((point, i) => (
                <motion.circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={colors[metric]}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={(e) => showTooltip(e, point, i)}
                  onMouseLeave={hideTooltip}
                />
              ))}
            </g>
          );
        })}

        {/* Eixo X */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#374151"
          strokeWidth="1"
        />

        {/* Eixo Y */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#374151"
          strokeWidth="1"
        />

        {/* Labels do eixo X (datas) */}
        {cleanData.map((d, i) => (
          <text
            key={i}
            x={padding + i * xScale}
            y={height - padding + 20}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
          >
            {d.date}
          </text>
        ))}
      </svg>

      {/* Legenda */}
      <div className="flex gap-4 justify-center mt-4">
        {metrics.map(metric => {
          const value = cleanData[cleanData.length - 1][metric];
          return (
            <div key={metric} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[metric] }}
              />
              <span className="text-sm text-gray-400">
                {metric}: {formatValue(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip.show && tooltip.data && (
        <div 
          className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg pointer-events-none"
          style={{ 
            left: tooltip.x + 10, 
            top: tooltip.y - 10,
            transform: tooltip.x > width/2 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="text-white font-semibold mb-2 text-sm">
            {tooltip.data.date}
          </div>
          <div className="space-y-1">
            {metrics.map(metric => (
              <div key={metric} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: colors[metric] }}
                  />
                  <span className="text-gray-300 text-xs">
                    {getMetricLabel(metric)}:
                  </span>
                </div>
                <span className="text-white text-xs font-medium">
                  {formatTooltipValue(metric, tooltip.data[metric])}
                </span>
              </div>
            ))}
          </div>
          
          {/* Métricas calculadas */}
          <div className="border-t border-gray-600 mt-2 pt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">CTR:</span>
              <span className="text-white text-xs">
                {(tooltip.data.impressions && tooltip.data.clicks && tooltip.data.impressions > 0)
                  ? `${((Number(tooltip.data.clicks) / Number(tooltip.data.impressions)) * 100).toFixed(2)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Taxa Conv:</span>
              <span className="text-white text-xs">
                {(tooltip.data.clicks && tooltip.data.leads && tooltip.data.clicks > 0)
                  ? `${((Number(tooltip.data.leads) / Number(tooltip.data.clicks)) * 100).toFixed(2)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">CPC:</span>
              <span className="text-white text-xs">
                {(tooltip.data.clicks && tooltip.data.spend && tooltip.data.clicks > 0)
                  ? `R$ ${(Number(tooltip.data.spend) / Number(tooltip.data.clicks)).toFixed(2)}`
                  : 'R$ 0,00'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChartAnimated;