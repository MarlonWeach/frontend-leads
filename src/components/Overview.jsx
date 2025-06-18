import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export function Overview({ data }) {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
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
            dataKey="date"
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
          <Area
            type="monotone"
            dataKey="total"
            stackId="1"
            stroke="#8884d8"
            fill="#8884d8"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OverviewCard({ valor, título, subtitulo }) {
  return (
    <div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col items-center">
      <div className="mb-2 text-electric"><BarChart3 className="h-8 w-8" /></div>
      <div className="text-title font-bold text-mint">{valor}</div>
      <div className="text-sublabel text-glow mt-1">{título}</div>
      {subtitulo && <div className="text-xs text-mint/70 mt-1">{subtitulo}</div>}
    </div>
  );
} 