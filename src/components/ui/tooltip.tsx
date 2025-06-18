'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  className = '',
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - 12;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + 12;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 12;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + 12;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }
      
      setTooltipPosition({ x, y });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setIsMounted(true), 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsMounted(false);
    setTimeout(() => setIsVisible(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            fixed z-50 px-4 py-3 text-sublabel-refined glass-card backdrop-blur-lg 
            border-glass shadow-glass-glow rounded-2xl text-white pointer-events-none
            transition-all duration-300 ease-out transform-gpu
            ${isMounted 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-2'
            }
          `}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="relative">
            {content}
            <div
              className={`
                absolute w-3 h-3 bg-glass-refined border-glass transform rotate-45
                transition-all duration-300 ease-out
                ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
                'right-full top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                }
              `}
            />
          </div>
        </div>
      )}
    </div>
  );
} 