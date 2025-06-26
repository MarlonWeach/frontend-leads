'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils.ts';

const Card = React.forwardRef(({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'glass-card rounded-2xl p-6 transition-all duration-300';
  
  const variants = {
    light: 'glass-light',
    default: 'glass-medium',
    strong: 'glass-strong',
  };

  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export { Card };

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`flex flex-col space-y-2 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-header font-bold text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ 
  className = '', 
  children, 
  expanded = false,
  ...props 
}) {
  return (
    <div 
      className={`
        p-6 pt-0 transition-all duration-500 ease-out
        ${expanded ? 'max-h-screen opacity-100' : 'max-h-96 opacity-100'}
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardExpandable({ 
  title, 
  children, 
  defaultExpanded = false,
  className = '',
  ...props 
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card 
      interactive 
      expanded={isExpanded}
      onToggle={setIsExpanded}
      className={className}
      {...props}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className={`
            w-6 h-6 rounded-full glass-light flex items-center justify-center
            transition-all duration-300 ease-out
            ${isExpanded ? 'rotate-180 glass-medium' : ''}
          `}>
            <svg 
              className="w-4 h-4 text-primary transition-transform duration-300"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent expanded={isExpanded}>
        {children}
      </CardContent>
    </Card>
  );
} 