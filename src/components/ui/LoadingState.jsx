'use client';

import React from 'react';
import { Card } from './card';

export default function LoadingState({ type = 'metrics' }) {
  if (type === 'table') {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-white/20 rounded w-1/4"></div>
              <div className="h-6 bg-white/20 rounded w-1/6"></div>
              <div className="h-6 bg-white/20 rounded w-1/6"></div>
              <div className="h-6 bg-white/20 rounded w-1/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="loading" className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-white/30 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    </div>
  );
} 