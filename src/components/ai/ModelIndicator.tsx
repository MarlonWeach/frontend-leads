import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface ModelIndicatorProps {
  modelUsed?: string;
  isFallback?: boolean;
  className?: string;
  showDetails?: boolean;
}

export function ModelIndicator({ 
  modelUsed, 
  isFallback = false, 
  className = '', 
  showDetails = true 
}: ModelIndicatorProps) {
  if (!modelUsed) return null;

  // Determinar o tipo de modelo baseado no nome
  const getModelInfo = (model: string) => {
    const modelLower = model.toLowerCase();
    
    if (modelLower.includes('openai') || modelLower.includes('gpt')) {
      return {
        type: 'openai',
        icon: Brain,
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        label: 'OpenAI',
        fullName: 'OpenAI GPT-4o-mini'
      };
    }
    
    if (modelLower.includes('anthropic') || modelLower.includes('claude')) {
      return {
        type: 'anthropic',
        icon: Zap,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        label: 'Anthropic',
        fullName: 'Claude 3.5 Haiku'
      };
    }
    
    if (modelLower.includes('fallback') || modelLower.includes('sistema')) {
      return {
        type: 'fallback',
        icon: AlertTriangle,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        label: 'Fallback',
        fullName: 'Sistema de Fallback'
      };
    }
    
    return {
      type: 'unknown',
      icon: CheckCircle,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      label: 'IA',
      fullName: model
    };
  };

  const modelInfo = getModelInfo(modelUsed);
  const Icon = modelInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className={`${modelInfo.color} flex items-center gap-1.5`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">
          {showDetails ? modelInfo.fullName : modelInfo.label}
        </span>
        {isFallback && (
          <span className="text-xs opacity-80">(Fallback)</span>
        )}
      </Badge>
      
      {isFallback && showDetails && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-orange-400" />
          <span className="text-xs text-orange-400">
            Modo fallback ativo
          </span>
        </div>
      )}
    </div>
  );
}

// Componente compacto para uso em espaços menores
export function ModelIndicatorCompact({ modelUsed, isFallback }: ModelIndicatorProps) {
  return (
    <ModelIndicator 
      modelUsed={modelUsed} 
      isFallback={isFallback} 
      showDetails={false}
      className="text-xs"
    />
  );
} 