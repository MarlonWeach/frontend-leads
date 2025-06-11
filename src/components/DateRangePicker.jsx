import React from 'react';
import { Button } from './ui/button';

export function CalendarDateRangePicker() {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
        <span>Últimos 30 dias</span>
      </Button>
    </div>
  );
} 