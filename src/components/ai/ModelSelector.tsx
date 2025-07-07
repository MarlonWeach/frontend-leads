import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export type AIModelType = 'auto' | 'openai' | 'anthropic';

interface ModelSelectorProps {
  value: AIModelType;
  onChange: (value: AIModelType) => void;
  disabled?: boolean;
  className?: string;
}

const modelOptions = [
  {
    value: 'auto' as AIModelType,
    label: 'Automático',
    description: 'OpenAI com fallback para Anthropic',
    icon: Settings,
    badge: 'Recomendado',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  {
    value: 'openai' as AIModelType,
    label: 'OpenAI GPT-4o-mini',
    description: 'Modelo principal da OpenAI',
    icon: Brain,
    badge: 'Padrão',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  {
    value: 'anthropic' as AIModelType,
    label: 'Claude 3.5 Haiku',
    description: 'Modelo da Anthropic como alternativa',
    icon: Zap,
    badge: 'Fallback',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
];

export function ModelSelector({ value, onChange, disabled = false, className = '' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = modelOptions.find(option => option.value === value);

  const handleSelect = (modelValue: AIModelType) => {
    onChange(modelValue);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 relative ${className}`}>
      <label className="text-sm font-medium text-white/90">
        Modelo de IA
      </label>
      
      {/* Dropdown Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white text-left flex items-center justify-between transition-all ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-800/70 hover:border-gray-500/50'
        }`}
      >
        {selectedModel && (
          <div className="flex items-center gap-2">
            <selectedModel.icon className="w-4 h-4" />
            <span>{selectedModel.label}</span>
            <Badge variant="outline" className={`text-xs ${selectedModel.badgeColor}`}>
              {selectedModel.badge}
            </Badge>
          </div>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/60" />
        )}
      </button>
      
      {/* Dropdown Options */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
        >
          {modelOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full p-3 text-left hover:bg-gray-700 transition-colors ${
                  isSelected ? 'bg-gray-700/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-white/70" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{option.label}</span>
                      <Badge variant="outline" className={`text-xs ${option.badgeColor}`}>
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
      
      {selectedModel && (
        <p className="text-xs text-white/60">
          {selectedModel.description}
        </p>
      )}
    </div>
  );
} 