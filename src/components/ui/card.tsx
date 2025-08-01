'use client';

import React, { useState, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'default' | 'strong';
  children?: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  expanded?: boolean;
}

interface CardExpandableProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ 
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

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-col space-y-2 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
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
}: CardContentProps) {
  return (
    <div 
      className={`
        p-6 pt-0 transition-all duration-500 ease-out
        ${expanded ? 'max-h-screen opacity-100' : 'opacity-100'}
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
}: CardExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card 
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