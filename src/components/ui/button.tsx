import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}, ref) {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-electric focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';
  
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    default: 'bg-electric text-background hover:bg-violet shadow-glass backdrop-blur-lg',
    secondary: 'glass-card text-white hover:bg-white/10 border-glass',
    outline: 'border border-electric text-electric hover:bg-electric hover:text-background',
    ghost: 'text-white hover:bg-white/10',
    destructive: 'bg-violet text-white hover:bg-violet/90',
    link: 'bg-transparent text-electric underline hover:text-violet',
  };
  
  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    default: 'h-10 px-4 py-2 text-base',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10 p-0 flex items-center justify-center',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});

export { Button };
export default Button; 