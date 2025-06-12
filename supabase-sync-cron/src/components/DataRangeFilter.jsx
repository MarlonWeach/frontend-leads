'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export default function DateRangeFilter({ onDateChange, initialRange = 30 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: new Date(Date.now() - initialRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPreset, setSelectedPreset] = useState(`${initialRange}d`);

  const presets = [
    { label: 'Hoje', value: '1d', days: 1 },
    { label: 'Últimos 7 dias', value: '7d', days: 7 },
    { label: 'Últimos 14 dias', value: '14d', days: 14 },
    { label: 'Últimos 30 dias', value: '30d', days: 30 },
    { label: 'Últimos 60 dias', value: '60d', days: 60 },
    { label: 'Últimos 90 dias', value: '90d', days: 90 },
    { label: 'Este mês', value: 'this_month', days: 0 },
    { label: 'Mês passado', value: 'last_month', days: 0 },
    { label: 'Todos os dados', value: 'all', days: 0 },
    { label: 'Personalizado', value: 'custom', days: 0 }
  ];

  // Debug: verificar se onDateChange é uma função
  useEffect(() => {
    console.log('🔧 DateRangeFilter - onDateChange é função?', typeof onDateChange);
  }, [onDateChange]);

  // Chamar onDateChange quando o componente montar
  useEffect(() => {
    console.log('🚀 DateRangeFilter montado - enviando range inicial');
    const initialPreset = presets.find(p => p.value === selectedPreset);
    if (initialPreset && onDateChange) {
      handlePresetClick(initialPreset);
    }
  }, []); // Executar apenas uma vez ao montar

  const handlePresetClick = (preset) => {
    console.log('🎯 Preset clicado:', preset);
    setSelectedPreset(preset.value);
    
    let startDate, endDate;
    const today = new Date();
    
    // Calcular datas baseado no preset
    switch (preset.value) {
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'custom':
        startDate = new Date(customRange.start);
        endDate = new Date(customRange.end);
        break;
      default:
        endDate = today;
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - preset.days + 1);
    }
    
    const range = {
      start: startDate ? startDate.toISOString().split('T')[0] : null,
      end: endDate ? endDate.toISOString().split('T')[0] : null,
      preset: preset.value
    };
    
    console.log('📤 Range calculado:', range);
    
    // Atualizar customRange se não for custom
    if (preset.value !== 'custom' && startDate && endDate) {
      setCustomRange({
        start: range.start,
        end: range.end
      });
    }
    
    // Debug logs antes de chamar onDateChange
    console.log('🚀 ANTES de chamar onDateChange - função existe?', !!onDateChange);
    console.log('🚀 ENVIANDO para parent:', range);
    
    // SEMPRE chamar onDateChange
    if (onDateChange) {
      onDateChange(range);
      console.log('✅ onDateChange executado com sucesso');
    } else {
      console.log('❌ onDateChange não existe!');
    }
    
    // Fechar dropdown se não for custom
    if (preset.value !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleCustomDateChange = () => {
    console.log('📅 Custom range aplicado:', customRange);
    
    const range = {
      start: customRange.start,
      end: customRange.end,
      preset: 'custom'
    };
    
    console.log('📤 Enviando custom range:', range);
    
    if (onDateChange) {
      onDateChange(range);
      console.log('✅ Custom range enviado com sucesso');
    }
    setIsOpen(false);
  };

  const getCurrentLabel = () => {
    const preset = presets.find(p => p.value === selectedPreset);
    if (selectedPreset === 'custom') {
      const start = new Date(customRange.start).toLocaleDateString('pt-BR');
      const end = new Date(customRange.end).toLocaleDateString('pt-BR');
      return `${start} - ${end}`;
    }
    return preset?.label || '';
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log('🖱️ Dropdown clicado - isOpen atual:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
        <span className="text-sm font-medium text-gray-700">{getCurrentLabel()}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              console.log('🖱️ Overlay clicado - fechando dropdown');
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Selecionar período</h3>
              
              {/* Presets */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      console.log('🖱️ Botão preset clicado:', preset.label);
                      handlePresetClick(preset);
                    }}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedPreset === preset.value
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Custom date inputs */}
              {selectedPreset === 'custom' && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Data inicial
                      </label>
                      <input
                        type="date"
                        value={customRange.start}
                        onChange={(e) => {
                          console.log('📅 Data inicial alterada:', e.target.value);
                          setCustomRange({ ...customRange, start: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Data final
                      </label>
                      <input
                        type="date"
                        value={customRange.end}
                        onChange={(e) => {
                          console.log('📅 Data final alterada:', e.target.value);
                          setCustomRange({ ...customRange, end: e.target.value });
                        }}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🖱️ Aplicar período personalizado clicado');
                      handleCustomDateChange();
                    }}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Aplicar período
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}