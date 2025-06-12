import React from 'react';

export function RecentSales({ data }) {
  return (
    <div className="space-y-8">
      {data.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">
            {sale.status === 'active' ? (
              <span className="text-green-500">Ativo</span>
            ) : (
              <span className="text-yellow-500">Pendente</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 