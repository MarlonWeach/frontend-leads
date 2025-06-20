'use client';
import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';

const AnimatedLineChart = ({ data, height = 300 }) => {
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
        delay: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className="w-full h-full"
      style={{ height }}
    >
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
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
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        colors={colors}
        lineWidth={2}
        theme={theme}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        enableArea={true}
        areaOpacity={0.15}
        areaBlendMode="multiply"
        enableGridX={false}
        enableGridY={true}
        gridYValues={[0, 25, 50, 75, 100]}
        curve="monotoneX"
        enablePoints={true}
        pointSymbol={({ size, color, borderWidth, borderColor }) => (
          <motion.circle
            r={size / 2}
            fill={color}
            stroke={borderColor}
            strokeWidth={borderWidth}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.5 }}
          />
        )}
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
              Data: <span className="text-white font-semibold">{point.data.x}</span>
            </div>
            <div className="text-gray-300 text-sm font-satoshi">
              Valor: <span className="text-white font-semibold">{point.data.y}</span>
            </div>
          </div>
        )}
        legends={[
          {
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

export default AnimatedLineChart; 