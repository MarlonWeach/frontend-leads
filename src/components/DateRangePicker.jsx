import React from 'react';
import { Button } from './ui/button';

export function CalendarDateRangePicker() {
  return (
    <div className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-4 flex flex-col">
      <div className="text-sublabel text-glow mb-2">Selecione o período</div>
      <input type="date" className="bg-background rounded-2xl p-2 text-mint focus:ring-2 focus:ring-electric mb-2" />
      <input type="date" className="bg-background rounded-2xl p-2 text-mint focus:ring-2 focus:ring-electric" />
    </div>
  );
} 