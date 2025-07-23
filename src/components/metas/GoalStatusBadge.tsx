'use client';

// Component: GoalStatusBadge.tsx
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  XCircle,
  PlayCircle,
  PauseCircle 
} from 'lucide-react';
import { GoalStatusBadgeProps } from '@/types/adsetGoalsDashboard';

const STATUS_CONFIG = {
  no_prazo: {
    label: 'No Prazo',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
  atencao: {
    label: 'Atenção',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: AlertTriangle
  },
  atrasado: {
    label: 'Atrasado',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    icon: Clock
  },
  critico: {
    label: 'Crítico',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: XCircle
  },
  atingido: {
    label: 'Atingido',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: PlayCircle
  },
  pausado: {
    label: 'Pausado',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: PauseCircle
  }
};

export default function GoalStatusBadge({ status, alertCount }: GoalStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: 'Indefinido',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-300',
    icon: PauseCircle
  };
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
      `}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
      {alertCount && alertCount > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {alertCount > 9 ? '9+' : alertCount}
        </span>
      )}
    </div>
  );
} 