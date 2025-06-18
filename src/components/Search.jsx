import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function Search({ data }) {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="source"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip />
          <Bar dataKey="total" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Exemplo de aplicação para painel de busca:
<div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col">
  <div className="text-title font-bold text-mint mb-4">Busca</div>
  <input className="bg-background rounded-2xl p-3 text-mint placeholder:text-mint/50 focus:ring-2 focus:ring-electric" placeholder="Buscar..." />
  {/* Resultados da busca */}
  <div className="mt-4">
    {results.map((result, idx) => (
      <div key={idx} className="flex items-center justify-between py-2 border-b border-mint/20 last:border-0">
        <span className="text-sublabel text-glow">{result.title}</span>
        <span className="text-xs text-mint/70">{result.subtitle}</span>
      </div>
    ))}
  </div>
</div> 