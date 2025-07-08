'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, CheckCircle, Circle, Building, TrendingUp, X } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';

const SegmentFilter = () => {
  const { filters, updateSegments } = useFilters();
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const performanceOptions = [
    { id: 'all', label: 'Todas' },
    { id: 'high', label: 'Alta Performance' },
    { id: 'medium', label: 'Performance Média' },
    { id: 'low', label: 'Baixa Performance' }
  ];

  const handleCampaignToggle = (campaignId) => {
    const currentCampaigns = filters.segments?.campaigns || [];
    const updatedCampaigns = currentCampaigns.includes(campaignId)
      ? currentCampaigns.filter(id => id !== campaignId)
      : [...currentCampaigns, campaignId];
    
    updateSegments('campaigns', updatedCampaigns);
  };

  const handlePerformanceChange = (performance) => {
    updateSegments('performance', performance);
  };

  const getSelectedCampaignsText = () => {
    const selected = filters.segments?.campaigns || [];
    if (selected.length === 0) return 'Todas as campanhas';
    if (selected.length === 1) return '1 campanha selecionada';
    return `${selected.length} campanhas selecionadas`;
  };

  const getSelectedPerformanceText = () => {
    const performance = filters.segments?.performance || 'all';
    const option = performanceOptions.find(opt => opt.id === performance);
    return option ? option.label : 'Todas';
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center space-x-2 mb-4">
        <Target className="w-5 h-5 text-[#8A2BE2]" />
        <h3 className="text-lg font-medium text-white">Segmentação</h3>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Filtro de Campanhas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Campanhas</h4>
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-lg rounded-lg text-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={() => setShowCampaigns(!showCampaigns)}
            >
              <span className="text-sm">{getSelectedCampaignsText()}</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${
                  showCampaigns ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showCampaigns && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900/95 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl z-50">
                <div className="p-3">
                  <div className="text-sm font-medium text-white mb-2">Selecionar Campanhas</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {/* Placeholder para campanhas - será preenchido dinamicamente */}
                    <div className="text-sm text-gray-400">Campanhas serão carregadas dinamicamente</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtro de Performance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Performance</h4>
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-lg rounded-lg text-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={() => setShowPerformance(!showPerformance)}
            >
              <span className="text-sm">Performance: {getSelectedPerformanceText()}</span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${
                  showPerformance ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showPerformance && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900/95 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl z-50">
                <div className="p-2">
                  {performanceOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors duration-200 ${
                        filters.segments?.performance === option.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        handlePerformanceChange(option.id);
                        setShowPerformance(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros Ativos */}
      <div className="flex flex-wrap gap-1">
        {filters.segments?.campaigns && filters.segments.campaigns.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
            <span>Campanhas: {getSelectedCampaignsText()}</span>
            <button
              onClick={() => updateSegments('campaigns', [])}
              className="hover:text-blue-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {filters.segments?.performance && filters.segments.performance !== 'all' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">
            <span>Performance: {getSelectedPerformanceText()}</span>
            <button
              onClick={() => updateSegments('performance', 'all')}
              className="hover:text-green-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {(!filters.segments?.campaigns || filters.segments.campaigns.length === 0) && 
         (!filters.segments?.performance || filters.segments.performance === 'all') && (
          <div className="text-xs text-gray-400 px-2 py-1">
            Nenhum filtro aplicado
          </div>
        )}
      </div>

      {/* Resumo dos filtros ativos */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-gray-400 mb-3">Filtros de segmentação ativos</p>
        <div className="space-y-2">
          
          {/* Campanhas selecionadas */}
          {filters.segments?.campaigns && filters.segments.campaigns.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8A2BE2] rounded-full"></div>
              <span className="text-sm text-white">
                Campanhas: {getSelectedCampaignsText()}
              </span>
            </div>
          )}

          {/* Performance selecionada */}
          {filters.segments?.performance && filters.segments.performance !== 'all' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8A2BE2] rounded-full"></div>
              <span className="text-sm text-white">
                Performance: {getSelectedPerformanceText()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SegmentFilter; 