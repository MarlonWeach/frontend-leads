import React from 'react';
import { Icon } from '@iconify/react';

export function RecentSales({ data }) {
  return (
    <div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col">
      <div className="text-title font-bold text-mint mb-4">Vendas Recentes</div>
      <div className="space-y-8">
        {data.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between py-2 border-b border-mint/20 last:border-0">
            <div className="flex items-center">
              <Icon className="h-5 w-5 text-electric mr-2" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{sale.name}</p>
                <p className="text-sm text-muted-foreground">{sale.email}</p>
              </div>
            </div>
            <div className="text-xs text-mint/70">
              {sale.status === 'active' ? (
                <span className="text-green-500">Ativo</span>
              ) : (
                <span className="text-yellow-500">Pendente</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 