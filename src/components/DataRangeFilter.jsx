'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export function DataRangeFilter({ 
  selectedRange, 
  onRangeChange, 
  className = '' 
}) {
  const ranges = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '1y', label: 'Último ano' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
        <select
          value={selectedRange}
          onChange={(e) => onRangeChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-electric appearance-none text-sublabel-refined"
        >
          {ranges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
      </div>
    </div>
  );
}