'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';

const DateRangePicker = () => {
  const { filters, updateDateRange, applyDatePreset } = useFilters();
  const [showCustom, setShowCustom] = useState(false);
  const [tempDates, setTempDates] = useState({
    dateFrom: filters.dateRange.startDate ? filters.dateRange.startDate.toISOString().split('T')[0] : '',
    dateTo: filters.dateRange.endDate ? filters.dateRange.endDate.toISOString().split('T')[0] : ''
  });

  const presets = [
    { id: '7d', label: 'Últimos 7 dias', value: '7d' },
    { id: '30d', label: 'Últimos 30 dias', value: '30d' },
    { id: '90d', label: 'Últimos 90 dias', value: '90d' },
    { id: '6m', label: 'Últimos 6 meses', value: '6m' },
    { id: '1y', label: 'Último ano', value: '1y' },
    { id: 'custom', label: 'Período personalizado', value: 'custom' }
  ];

  const handlePresetClick = (preset) => {
    if (preset.value === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      applyDatePreset(preset.value);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setTempDates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyCustomDates = () => {
    updateDateRange({
      preset: 'custom',
      startDate: tempDates.dateFrom ? new Date(tempDates.dateFrom) : null,
      endDate: tempDates.dateTo ? new Date(tempDates.dateTo) : null
    });
    setShowCustom(false);
  };

  const formatDateRange = () => {
    if (filters.dateRange.preset === 'custom' && filters.dateRange.startDate && filters.dateRange.endDate) {
      return `${filters.dateRange.startDate.toLocaleDateString('pt-BR')} - ${filters.dateRange.endDate.toLocaleDateString('pt-BR')}`;
    }
    
    const preset = presets.find(p => p.value === filters.dateRange.preset);
    return preset ? preset.label : 'Selecionar período';
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-[#8A2BE2]" />
        <h3 className="text-lg font-medium text-white">Seleção de Período</h3>
      </div>

      {/* Presets em grid compacto */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset) => (
          <motion.button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`p-3 text-sm rounded-lg border transition-all ${
              filters.dateRange.preset === preset.value
                ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Período personalizado */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={tempDates.dateFrom}
                  onChange={(e) => handleCustomDateChange('dateFrom', e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#8A2BE2] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data final
                </label>
                <input
                  type="date"
                  value={tempDates.dateTo}
                  onChange={(e) => handleCustomDateChange('dateTo', e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#8A2BE2] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyCustomDates}
                disabled={!tempDates.dateFrom || !tempDates.dateTo}
                className="px-4 py-2 text-sm bg-[#8A2BE2] hover:bg-[#8A2BE2]/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumo do período selecionado */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Período selecionado</p>
            <p className="text-white font-medium">{formatDateRange()}</p>
          </div>
          <Calendar className="w-5 h-5 text-[#8A2BE2]" />
        </div>
      </div>

      {/* Toggle de comparação */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
        <div>
          <p className="text-white font-medium">Comparar com período anterior</p>
          <p className="text-sm text-gray-400">Exibir comparação no dashboard</p>
        </div>
        <button
          onClick={() => updateDateRange({
            compareWithPrevious: !filters.dateRange.compareWithPrevious
          })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            filters.dateRange.compareWithPrevious ? 'bg-[#8A2BE2]' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              filters.dateRange.compareWithPrevious ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker; 