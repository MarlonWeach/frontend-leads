import React from 'react';

export function Button({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-electric focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-electric text-background hover:bg-violet shadow-glass backdrop-blur-lg',
    secondary: 'glass-card text-white hover:bg-white/10 border-glass',
    outline: 'border border-electric text-electric hover:bg-electric hover:text-background',
    ghost: 'text-white hover:bg-white/10',
    destructive: 'bg-violet text-white hover:bg-violet/90',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-sublabel-refined',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
} 