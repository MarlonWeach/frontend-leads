'use client';

import React, { useState, useEffect } from 'react';

export function SectionTransition({ 
  children, 
  isVisible = true, 
  direction = 'up',
  delay = 0,
  duration = 500,
  className = ''
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setMounted(true), delay);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [isVisible, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(20px)';
      case 'down':
        return 'translateY(-20px)';
      case 'left':
        return 'translateX(20px)';
      case 'right':
        return 'translateX(-20px)';
      case 'scale':
        return 'scale(0.95)';
      default:
        return 'translateY(20px)';
    }
  };

  return (
    <div
      className={`
        transition-all duration-${duration} ease-out transform-gpu
        ${mounted 
          ? 'opacity-100 transform-none' 
          : `opacity-0 transform ${getTransform()}`
        }
        ${className}
      `}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like
      }}
    >
      {children}
    </div>
  );
}

export function StaggeredChildren({ 
  children, 
  staggerDelay = 100,
  className = ''
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <SectionTransition
          key={index}
          delay={index * staggerDelay}
          direction="up"
        >
          {child}
        </SectionTransition>
      ))}
    </div>
  );
}

export function AnimatedCard({ 
  children, 
  className = '',
  hoverEffect = true,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        transition-all duration-300 ease-out transform-gpu
        ${hoverEffect && isHovered ? 'scale-105 -translate-y-1' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
} 