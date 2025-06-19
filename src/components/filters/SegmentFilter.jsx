'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, CheckCircle, Circle, Building, TrendingUp } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';

const SegmentFilter = () => {
  const { filters, updateSegments } = useFilters();
  const [showAdvertisers, setShowAdvertisers] = useState(false);

  // Mock data - em produção viria de uma API
  const advertisers = [
    { id: 'adv1', name: 'Empresa A', campaigns: 12 },
    { id: 'adv2', name: 'Empresa B', campaigns: 8 },
    { id: 'adv3', name: 'Empresa C', campaigns: 15 },
    { id: 'adv4', name: 'Empresa D', campaigns: 6 },
    { id: 'adv5', name: 'Empresa E', campaigns: 10 },
    { id: 'adv6', name: 'Empresa F', campaigns: 4 }
  ];

  const campaignStatuses = [
    { id: 'all', label: 'Todas as campanhas', count: 40 },
    { id: 'active', label: 'Apenas ativas', count: 32 },
    { id: 'inactive', label: 'Apenas inativas', count: 8 }
  ];

  const performanceLevels = [
    { id: 'all', label: 'Todas as performances', icon: TrendingUp, color: 'text-gray-400' },
    { id: 'high', label: 'Alta performance', icon: TrendingUp, color: 'text-green-400', description: 'CR > 5%' },
    { id: 'medium', label: 'Performance média', icon: TrendingUp, color: 'text-yellow-400', description: 'CR 2-5%' },
    { id: 'low', label: 'Baixa performance', icon: TrendingUp, color: 'text-red-400', description: 'CR < 2%' }
  ];

  const handleCampaignStatusChange = (statusId) => {
    updateSegments('campaignStatus', statusId);
  };

  const handleAdvertiserToggle = (advertiserId) => {
    const currentAdvertisers = filters.segments?.advertisers || [];
    const updatedAdvertisers = currentAdvertisers.includes(advertiserId)
      ? currentAdvertisers.filter(id => id !== advertiserId)
      : [...currentAdvertisers, advertiserId];

    updateSegments('advertisers', updatedAdvertisers);
  };

  const handlePerformanceLevelChange = (levelId) => {
    updateSegments('performance', levelId);
  };

  const getSelectedAdvertisersText = () => {
    const selected = filters.segments?.advertisers || [];
    if (selected.length === 0) return 'Todos os anunciantes';
    if (selected.length === 1) {
      const advertiser = advertisers.find(a => a.id === selected[0]);
      return advertiser?.name || 'Anunciante selecionado';
    }
    return `${selected.length} anunciantes selecionados`;
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
        
        {/* Status da Campanha */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Status da Campanha</h4>
          <div className="space-y-2">
            {campaignStatuses.map((status) => {
              const isSelected = (filters.segments?.campaignStatus || 'all') === status.id;
              
              return (
                <motion.button
                  key={status.id}
                  onClick={() => handleCampaignStatusChange(status.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    {isSelected ? (
                      <CheckCircle className="w-4 h-4 text-[#8A2BE2]" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">{status.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{status.count} campanhas</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Nível de Performance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Nível de Performance</h4>
          <div className="space-y-2">
            {performanceLevels.map((level) => {
              const isSelected = (filters.segments?.performance || 'all') === level.id;
              const IconComponent = level.icon;
              
              return (
                <motion.button
                  key={level.id}
                  onClick={() => handlePerformanceLevelChange(level.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#8A2BE2]/20 border-[#8A2BE2] text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    {isSelected ? (
                      <CheckCircle className="w-4 h-4 text-[#8A2BE2]" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-4 h-4 ${level.color}`} />
                      <div className="text-left">
                        <div className="text-sm">{level.label}</div>
                        {level.description && (
                          <div className="text-xs text-gray-400">{level.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Anunciantes */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Anunciantes</h4>
        
        {/* Dropdown de anunciantes */}
        <div className="relative">
          <button
            onClick={() => setShowAdvertisers(!showAdvertisers)}
            className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{getSelectedAdvertisersText()}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              showAdvertisers ? 'rotate-180' : ''
            }`} />
          </button>

          <AnimatePresence>
            {showAdvertisers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0E1117]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-10 overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto p-2">
                  {advertisers.map((advertiser) => {
                    const isSelected = (filters.segments?.advertisers || []).includes(advertiser.id);
                    
                    return (
                      <motion.button
                        key={advertiser.id}
                        onClick={() => handleAdvertiserToggle(advertiser.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-[#8A2BE2]/20 text-white'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center space-x-3">
                          {isSelected ? (
                            <CheckCircle className="w-4 h-4 text-[#8A2BE2]" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm">{advertiser.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{advertiser.campaigns} campanhas</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-gray-400 mb-3">Filtros de segmentação ativos</p>
        <div className="space-y-2">
          
          {/* Status da campanha */}
          {filters.segments?.campaignStatus && filters.segments.campaignStatus !== 'all' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8A2BE2] rounded-full"></div>
              <span className="text-sm text-white">
                Status: {campaignStatuses.find(s => s.id === filters.segments.campaignStatus)?.label}
              </span>
            </div>
          )}

          {/* Nível de performance */}
          {filters.segments?.performance && filters.segments.performance !== 'all' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8A2BE2] rounded-full"></div>
              <span className="text-sm text-white">
                Performance: {performanceLevels.find(l => l.id === filters.segments.performance)?.label}
              </span>
            </div>
          )}

          {/* Anunciantes selecionados */}
          {filters.segments?.advertisers && filters.segments.advertisers.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8A2BE2] rounded-full"></div>
              <span className="text-sm text-white">
                Anunciantes: {getSelectedAdvertisersText()}
              </span>
            </div>
          )}

          {/* Nenhum filtro ativo */}
          {(!filters.segments?.campaignStatus || filters.segments.campaignStatus === 'all') &&
           (!filters.segments?.performance || filters.segments.performance === 'all') &&
           (!filters.segments?.advertisers || filters.segments.advertisers.length === 0) && (
            <div className="text-sm text-gray-400">Nenhum filtro de segmentação ativo</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SegmentFilter; 