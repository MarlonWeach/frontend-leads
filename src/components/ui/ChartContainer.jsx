'use client';

import React from 'react';

export default function ChartContainer({ title, subtitle, children, height = 400, className = '', delay = 0 }) {
  return (
    <div
      className={`bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col ${className}`}
      style={{ minHeight: height }}
    >
      {title && <h2 className="text-xl font-bold text-white mb-1">{title}</h2>}
      {subtitle && <div className="text-gray-400 text-sm mb-4">{subtitle}</div>}
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
} 