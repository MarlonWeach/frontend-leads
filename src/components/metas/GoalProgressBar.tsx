'use client';

// Component: GoalProgressBar.tsx
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import React from 'react';
import { GoalProgressBarProps } from '../../types/adsetGoalsDashboard';

const STATUS_COLORS = {
  no_prazo: 'bg-green-500',
  atencao: 'bg-yellow-500',
  atrasado: 'bg-orange-500',
  critico: 'bg-red-500',
  atingido: 'bg-blue-500',
  pausado: 'bg-gray-400'
};

const SIZE_CONFIG = {
  sm: { height: 'h-1.5', text: 'text-xs' },
  md: { height: 'h-2', text: 'text-sm' },
  lg: { height: 'h-3', text: 'text-base' }
};

export default function GoalProgressBar({ 
  percentage, 
  status, 
  size = 'md', 
  showLabel = true 
}: GoalProgressBarProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const progressColor = STATUS_COLORS[status];
  
  // Garantir que a porcentagem esteja entre 0 e 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeConfig.height}`}>
        <div
          className={`${sizeConfig.height} ${progressColor} transition-all duration-300 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      
      {showLabel && (
        <div className={`flex justify-between mt-1 ${sizeConfig.text} text-gray-600`}>
          <span>Progresso</span>
          <span className="font-medium">
            {clampedPercentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
} 