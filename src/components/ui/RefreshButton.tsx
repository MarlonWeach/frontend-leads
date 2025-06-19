import { Button } from './button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Tooltip } from './tooltip';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
  tooltipText?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function RefreshButton({
  onRefresh,
  className,
  tooltipText = 'Atualizar dados',
  size = 'icon',
  variant = 'ghost'
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Tooltip content={<p className="text-xs">{tooltipText}</p>}>
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        className={cn(className)}
        disabled={isRefreshing}
      >
        <RefreshCw 
          className={cn(
            "h-4 w-4", 
            isRefreshing && "animate-spin"
          )} 
        />
        <span className="sr-only">{tooltipText}</span>
      </Button>
    </Tooltip>
  );
} 