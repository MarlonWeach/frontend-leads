'use client';

import React, { useState } from 'react';

export function Card({ 
  className = '', 
  interactive = false, 
  expanded = false,
  onToggle,
  children,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = () => {
    if (interactive) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (interactive) setIsHovered(false);
  };

  const handleClick = () => {
    if (interactive && onToggle) {
      onToggle(!expanded);
    }
  };

  const handleMouseDown = () => {
    if (interactive) setIsPressed(true);
  };

  const handleMouseUp = () => {
    if (interactive) setIsPressed(false);
  };

  return (
    <div
      className={`
        glass-card backdrop-blur-lg bg-glass-refined border-glass shadow-glass-refined 
        text-white rounded-2xl transition-all duration-500 ease-out
        ${interactive ? 'cursor-pointer transform-gpu' : ''}
        ${interactive && isHovered ? 'scale-105 shadow-glass-glow border-electric/30' : ''}
        ${interactive && isPressed ? 'scale-95' : ''}
        ${expanded ? 'ring-2 ring-electric/50 shadow-electric-glow' : ''}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </div>
  );
}

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
            w-6 h-6 rounded-full bg-electric/20 flex items-center justify-center
            transition-all duration-300 ease-out
            ${isExpanded ? 'rotate-180 bg-electric/40' : ''}
          `}>
            <svg 
              className="w-4 h-4 text-electric transition-transform duration-300"
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