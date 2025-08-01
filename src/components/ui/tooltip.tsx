'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  // Determinar posição baseada no viewport
  const getTooltipPosition = () => {
    if (!triggerRef.current) return position;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Se está na metade direita da tela, preferir left
    if (rect.left > viewportWidth / 2) {
      return 'left';
    }
    
    // Se está na metade esquerda da tela, preferir right
    if (rect.left < viewportWidth / 2) {
      return 'right';
    }
    
    // Se está no topo da tela, preferir bottom
    if (rect.top < viewportHeight / 3) {
      return 'bottom';
    }
    
    // Se está na base da tela, preferir top
    if (rect.bottom > viewportHeight * 2/3) {
      return 'top';
    }
    
    return position;
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            key="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              absolute z-50 px-3 py-2 
              bg-gray-900/95 backdrop-blur-xl 
              border border-white/20 
              rounded-lg shadow-2xl 
              text-white text-sm font-medium
              pointer-events-none
              whitespace-nowrap
              ${tooltipPosition === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
                tooltipPosition === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
                tooltipPosition === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
                'left-full top-1/2 -translate-y-1/2 ml-2'
              }
            `}
          >
            {content}
            {/* Seta do tooltip */}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900/95 border border-white/20 transform rotate-45
                ${tooltipPosition === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0' :
                  tooltipPosition === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0' :
                  tooltipPosition === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0' :
                  'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0'
                }
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 