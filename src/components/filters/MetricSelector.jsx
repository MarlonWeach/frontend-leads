'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Eye, MousePointer, Users, Percent, Calculator, TrendingUp } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';

const MetricSelector = () => {
  const { filters, updateMetrics } = useFilters();

  const metricGroups = [
    {
      title: 'Métricas Principais',
      metrics: [
        { id: 'spend', label: 'Investimento', icon: DollarSign, color: 'text-green-400' },
        { id: 'impressions', label: 'Impressões', icon: Eye, color: 'text-blue-400' },
        { id: 'clicks', label: 'Cliques', icon: MousePointer, color: 'text-yellow-400' },
        { id: 'leads', label: 'Leads', icon: Users, color: 'text-purple-400' }
      ]
    },
    {
      title: 'Métricas Calculadas',
      metrics: [
        { id: 'ctr', label: 'CTR', icon: Percent, color: 'text-orange-400' },
        { id: 'conversionRate', label: 'Taxa de Conversão', icon: TrendingUp, color: 'text-pink-400' },
        { id: 'cpc', label: 'CPC', icon: Calculator, color: 'text-cyan-400' },
        { id: 'cpm', label: 'CPM', icon: BarChart3, color: 'text-indigo-400' }
      ]
    }
  ];

  const handleMetricToggle = (metricId) => {
    const currentValue = filters.metrics[metricId] || false;
    updateMetrics(metricId, !currentValue);
  };

  const handleGroupToggle = (groupMetrics, selectAll) => {
    groupMetrics.forEach(metric => {
      updateMetrics(metric.id, selectAll);
    });
  };

  const isMetricSelected = (metricId) => {
    return filters.metrics[metricId] || false;
  };

  const getSelectedCount = () => {
    return Object.values(filters.metrics).filter(Boolean).length;
  };

  const getSelectedMetrics = () => {
    return Object.keys(filters.metrics).filter(key => filters.metrics[key]);
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-[#8A2BE2]" />
          <h3 className="text-lg font-medium text-white">Seleção de Métricas</h3>
        </div>
        <div className="text-sm text-gray-400">
          {getSelectedCount()} selecionadas
        </div>
      </div>

      {/* Grupos de métricas */}
      {metricGroups.map((group, groupIndex) => {
        const groupMetrics = group.metrics;
        const selectedInGroup = groupMetrics.filter(m => isMetricSelected(m.id)).length;
        const allSelected = selectedInGroup === groupMetrics.length;
        const noneSelected = selectedInGroup === 0;

        return (
          <div key={group.title} className="space-y-4">
            {/* Cabeçalho do grupo */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">{group.title}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGroupToggle(groupMetrics, true)}
                  disabled={allSelected}
                  className="px-3 py-1 text-xs bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Todos
                </button>
                <button
                  onClick={() => handleGroupToggle(groupMetrics, false)}
                  disabled={noneSelected}
                  className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Nenhum
                </button>
              </div>
            </div>

            {/* Grid de métricas */}
            <div className="grid grid-cols-2 gap-3">
              {groupMetrics.map((metric) => {
                const isSelected = isMetricSelected(metric.id);
                const IconComponent = metric.icon;

                return (
                  <motion.button
                    key={metric.id}
                    onClick={() => handleMetricToggle(metric.id)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#8A2BE2]/30' : 'bg-white/10'}`}>
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : metric.color}`} />
                      </div>
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    
                    {/* Toggle visual */}
                    <div className="mt-3 flex justify-end">
                      <div className={`w-10 h-5 rounded-full transition-colors ${
                        isSelected ? 'bg-[#8A2BE2]' : 'bg-gray-600'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                          isSelected ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Resumo das métricas selecionadas */}
      {getSelectedCount() > 0 && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-sm text-gray-400 mb-2">Métricas selecionadas</p>
          <div className="flex flex-wrap gap-2">
            {getSelectedMetrics().map((metricId) => {
              const metric = metricGroups
                .flatMap(g => g.metrics)
                .find(m => m.id === metricId);
              
              if (!metric) return null;

              const IconComponent = metric.icon;

              return (
                <div
                  key={metricId}
                  className="flex items-center space-x-2 px-3 py-1 bg-[#8A2BE2]/20 border border-[#8A2BE2]/30 rounded-full text-sm text-white"
                >
                  <IconComponent className={`w-3 h-3 ${metric.color}`} />
                  <span>{metric.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricSelector; 