'use client';
import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';

// Função para abreviar números
function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toLocaleString('pt-BR');
}

// Função para formatar valores monetários
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

// Função para detectar se a série é de gasto
function isSpendSeries(seriesId) {
  return seriesId && (seriesId.toString().toLowerCase().includes('spend') || 
                     seriesId.toString().toLowerCase().includes('gasto') || 
                     seriesId.toString().toLowerCase().includes('gastos'));
}

const AnimatedLineChart = ({ data, height = 300 }) => {
  // Verificar se os dados são válidos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  // Filtrar dados com valores válidos
  const validData = data.filter(series => 
    series && 
    Array.isArray(series.data) && 
    series.data.length > 0 &&
    series.data.some(point => 
      point && 
      typeof point.y === 'number' && 
      !isNaN(point.y)
    )
  );

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum dado válido para exibir</p>
      </div>
    );
  }

  // Verificar se há pelo menos um valor maior que zero
  const hasValidValues = validData.some(series => 
    series.data.some(point => point.y > 0)
  );
  if (!hasValidValues) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum valor positivo para exibir</p>
      </div>
    );
  }

  // Tema personalizado para Apple Vision Pro + Baremetrics
  const theme = {
    background: 'transparent',
    textColor: '#ffffff',
    fontSize: 12,
    fontFamily: 'Satoshi, sans-serif',
    axis: {
      domain: {
        line: {
          stroke: '#374151',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: '#374151',
          strokeWidth: 1,
        },
        text: {
          fill: '#9CA3AF',
          fontSize: 11,
          fontFamily: 'Satoshi, sans-serif',
        },
      },
      legend: {
        text: {
          fill: '#9CA3AF',
          fontSize: 12,
          fontFamily: 'Satoshi, sans-serif',
        },
      },
    },
    grid: {
      line: {
        stroke: '#374151',
        strokeWidth: 1,
        strokeDasharray: '4 4',
      },
    },
    legends: {
      text: {
        fill: '#9CA3AF',
        fontSize: 11,
        fontFamily: 'Satoshi, sans-serif',
      },
    },
    tooltip: {
      container: {
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        fontFamily: 'Satoshi, sans-serif',
      },
    },
  };

  // Cores do tema
  const colors = [
    '#8A2BE2', // Violeta
    '#00BFFF', // Azul elétrico
    '#00CED1', // Azul turquesa
    '#9370DB', // Violeta médio
    '#4169E1', // Azul royal
    '#FF6B6B', // Vermelho coral
    '#4ECDC4', // Verde menta
    '#45B7D1', // Azul claro
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className="w-full h-full"
      style={{ height }}
    >
      <ResponsiveLine
        data={validData}
        margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.0f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Período',
          legendOffset: 36,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Valor',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        theme={theme}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        tooltip={({ point }) => (
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: point.color }}
              />
              <span className="text-white font-medium font-satoshi">
                {point.serieId}
              </span>
            </div>
            <div className="text-gray-300 text-sm font-satoshi">
              Período: <span className="text-white font-semibold">{point.data.x}</span>
            </div>
            <div className="text-gray-300 text-sm font-satoshi">
              Valor: <span className="text-white font-semibold">{isSpendSeries(point.serieId) ? formatCurrency(point.data.y) : formatNumberShort(point.data.y)}</span>
            </div>
          </div>
        )}
      />
    </motion.div>
  );
};

export default AnimatedLineChart; 