'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Calendar, BarChart3, Target, X } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';
import DateRangePicker from './DateRangePicker';
import MetricSelector from './MetricSelector';
import SegmentFilter from './SegmentFilter';

const FilterContainer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('period');
  const { filters, getActiveFiltersCount, resetFilters } = useFilters();

  const activeFiltersCount = getActiveFiltersCount();

  const tabs = [
    { id: 'period', label: 'Período', icon: Calendar },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'segments', label: 'Segmentos', icon: Target },
  ];

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    setIsOpen(false);
    // Os filtros já são aplicados automaticamente através do hook useFilters
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className="relative">
      {/* Botão de filtros */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-xl text-white hover:bg-gray-700/50 transition-all duration-300 relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filtros</span>
        
        {/* Badge de filtros ativos */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
            >
              {activeFiltersCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-[#0E1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Filtros Avançados
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-white bg-[#8A2BE2]/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A2BE2]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'period' && <DateRangePicker />}
                    {activeTab === 'metrics' && <MetricSelector />}
                    {activeTab === 'segments' && <SegmentFilter />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10 bg-[#0E1117]/50">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Resetar Filtros
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 text-sm text-gray-300 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-6 py-2 text-sm bg-[#8A2BE2] hover:bg-[#8A2BE2]/80 text-white rounded-lg transition-colors"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterContainer; 