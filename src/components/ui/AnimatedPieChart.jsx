'use client';
import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';

// Função para abreviar números
function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toLocaleString('pt-BR');
}

const AnimatedPieChart = ({ data, height = 300 }) => {
  // Verificar se os dados são válidos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  // Filtrar dados com valores válidos
  const validData = data.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !isNaN(item.value) && 
    item.value > 0
  );

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nenhum dado válido para exibir</p>
      </div>
    );
  }

  // Verificar se há pelo menos um valor maior que zero
  const hasValidValues = validData.some(item => item.value > 0);
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
        delay: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className="w-full h-full"
      style={{ height }}
    >
      <ResponsivePie
        data={validData}
        margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={colors}
        borderWidth={1}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#9CA3AF"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        theme={theme}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        tooltip={({ datum }) => {
          // Calcular porcentagem manualmente se não estiver disponível
          const total = validData.reduce((sum, item) => sum + (item.value || 0), 0);
          const percentage = total > 0 ? ((datum.value || 0) / total) * 100 : 0;
          
          return (
            <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: datum.color }}
                />
                <span className="text-white font-medium font-satoshi">
                  {datum.label}
                </span>
              </div>
              <div className="text-gray-300 text-sm font-satoshi">
                Valor: <span className="text-white font-semibold">{formatNumberShort(datum.value)}</span>
              </div>
              <div className="text-gray-300 text-sm font-satoshi">
                Percentual: <span className="text-white font-semibold">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#9CA3AF',
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 18,
            symbolShape: 'circle',
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

export default AnimatedPieChart; 