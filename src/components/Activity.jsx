import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Activity({ data }) {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="total"
            nameKey="status"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Exemplo de aplicação para painel de atividades:
<div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col">
  <div className="text-title font-bold text-mint mb-4">Atividades Recentes</div>
  {/* Lista de atividades */}
  {activities.map((activity, idx) => (
    <div key={idx} className="flex items-center justify-between py-2 border-b border-mint/20 last:border-0">
      <div className="flex items-center">
        <Icon className="h-5 w-5 text-electric mr-2" />
        <span className="text-sublabel text-glow">{activity.title}</span>
      </div>
      <span className="text-xs text-mint/70">{activity.timestamp}</span>
    </div>
  ))}
</div> 