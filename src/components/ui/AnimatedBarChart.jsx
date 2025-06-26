'use client';

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
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

const AnimatedBarChart = ({ data, keys, indexBy = 'label', height = 300 }) => {
  // Verificar se os dados são válidos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  // Verificar se as chaves são válidas
  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Configuração de chaves inválida</p>
      </div>
    );
  }

  // Filtrar dados com valores válidos
  const validData = data.filter(item => 
    item && 
    keys.some(key => 
      typeof item[key] === 'number' && 
      !isNaN(item[key]) && 
      item[key] >= 0
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
  const hasValidValues = validData.some(item => 
    keys.some(key => item[key] > 0)
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
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className="w-full h-full"
      style={{ height }}
    >
      <ResponsiveBar
        data={validData}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={colors}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        theme={theme}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        enableLabel={false}
        tooltip={({ id, value, color, indexValue }) => (
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-white font-medium font-satoshi">
                {indexValue}
              </span>
            </div>
            <div className="text-gray-300 text-sm font-satoshi">
              {id}: <span className="text-white font-semibold">{value}</span>
            </div>
          </div>
        )}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 50,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </motion.div>
  );
};

export default AnimatedBarChart;