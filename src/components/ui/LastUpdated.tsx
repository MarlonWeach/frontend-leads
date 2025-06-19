import { useFormattedLastUpdated } from '@/hooks/useQueryWithCache';
import { Tooltip } from './tooltip';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LastUpdatedProps {
  lastUpdated: Date | null;
  className?: string;
  showIcon?: boolean;
  showPrefix?: boolean;
  tooltipText?: string;
}

export function LastUpdated({
  lastUpdated,
  className,
  showIcon = true,
  showPrefix = true,
  tooltipText = 'Dados atualizados automaticamente a cada 5 minutos'
}: LastUpdatedProps) {
  const formattedTime = useFormattedLastUpdated(lastUpdated);
  
  if (!lastUpdated || !formattedTime) {
    return null;
  }
  
  const fullText = showPrefix ? `Atualizado ${formattedTime}` : formattedTime;
  const exactTime = lastUpdated.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return (
    <Tooltip content={<div className="text-xs"><p>{tooltipText}</p><p className="mt-1 font-mono">{exactTime}</p></div>}>
      <div className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}>
        {showIcon && <InfoIcon className="h-3 w-3" />}
        <span>{fullText}</span>
      </div>
    </Tooltip>
  );
} 