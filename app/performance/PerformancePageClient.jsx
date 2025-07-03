"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { ArrowUpDown, TrendingUp, Eye, MousePointer, DollarSign, Users } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import AnimatedBarChart from '../../src/components/ui/AnimatedBarChart';
import AnimatedPieChart from '../../src/components/ui/AnimatedPieChart';
import AnimatedLineChart from '../../src/components/ui/AnimatedLineChart';
import { AIPanel } from '../../src/components/ai/AIPanel';
import { OpenAIBillingWidget } from '../../src/components/ai/OpenAIBillingWidget';
import { motion } from 'framer-motion';

// Função para abreviar números grandes (igual ao dashboard)
function formatNumberShort(num) {
  if (num === null || num === undefined) return '';
  if (typeof num === 'string') num = Number(num.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '';
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString('pt-BR');
}

export default function PerformancePageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    campaigns: [],
    metrics: {
      totalLeads: 0,
      totalSpend: 0,
      averageCTR: 0,
      averageCPL: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageROI: 0
    }
  });

  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'spend',
    direction: 'desc'
  });

  const [_showDateMenu, setShowDateMenu] = useState(false);
  const [_showStatusMenu, setShowStatusMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const dateMenuRef = useRef(null);
  const statusMenuRef = useRef(null);

  // Presets de data com timezone São Paulo
  const SAO_PAULO_TZ = 'America/Sao_Paulo';
  
  const datePresets = useMemo(() => [
    { label: 'Hoje', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: todaySP, end: todaySP };
    }},
    { label: 'Ontem', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      todaySPDate.setDate(todaySPDate.getDate() - 1);
      const yestSP = formatInTimeZone(todaySPDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: yestSP, end: yestSP };
    }},
    { label: 'Últimos 7 dias', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      const weekAgoDate = new Date(todaySPDate);
      weekAgoDate.setDate(todaySPDate.getDate() - 6);
      const weekAgoSP = formatInTimeZone(weekAgoDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: weekAgoSP, end: todaySP };
    }},
    { label: 'Últimos 30 dias', getRange: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - 29);
      return {
        start: formatInTimeZone(past, SAO_PAULO_TZ, 'yyyy-MM-dd'),
        end: formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd')
      };
    }},
  ], []);

  const [selectedPreset, setSelectedPreset] = useState(2); // Últimos 7 dias por padrão

  // Atualizar horário apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Ao montar, aplicar o preset "Últimos 7 dias"
    const range = datePresets[2].getRange();
    setFilters(prev => ({
      ...prev,
      startDate: range.start,
      endDate: range.end
    }));
  }, [datePresets]); // Adicionar datePresets como dependência

  const applyDatePreset = (presetIndex) => {
    const preset = datePresets[presetIndex];
    const range = preset.getRange();
    setFilters(prev => ({
      ...prev,
      startDate: range.start,
      endDate: range.end,
      page: 1 // Reset para primeira página
    }));
    setSelectedPreset(presetIndex);
    setShowDateMenu(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const fetchRealData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        status: filters.status,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/performance?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.status, filters.startDate, filters.endDate]);

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  const campaigns = data?.campaigns || [];
  const metrics = data?.metrics;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return formatInTimeZone(new Date(dateString), 'America/Sao_Paulo', 'dd/MM/yyyy');
  };

  // Função para exibir label resumida do filtro de data
  const getDateLabel = () => {
    if (selectedPreset !== null) {
      return datePresets[selectedPreset].label;
    }
    if (filters.startDate && filters.endDate) {
      if (filters.startDate === filters.endDate) {
        return formatDate(filters.startDate);
      }
      return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    }
    return 'Selecionar período';
  };

  // Memoizar props do AIPanel para evitar re-renders desnecessários
  const aiPanelData = useMemo(() => {
    return campaigns.map(campaign => ({
      campaign_id: campaign.campaign_id || campaign.id,
      name: campaign.campaign_name || 'Nome não disponível',
      status: campaign.status,
      spend: campaign.spend || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      leads: campaign.leads || 0,
      ctr: campaign.ctr || 0,
      cpl: campaign.cpl || 0,
      conversion_rate: campaign.conversion_rate || 0,
      created_time: campaign.created_time || new Date().toISOString()
    }));
  }, [campaigns]);

  const aiPanelFilters = useMemo(() => ({
    dateRange: {
      startDate: filters.startDate || '',
      endDate: filters.endDate || ''
    },
    status: filters.status,
    period: getDateLabel()
  }), [filters.startDate, filters.endDate, filters.status, selectedPreset]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };



  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'DELETED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };



  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setShowDateMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ordenar campanhas
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const aValue = a[sortConfig.key] || 0;
    const bValue = b[sortConfig.key] || 0;
    
    if (sortConfig.direction === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-400 text-lg font-medium">{error}</div>
        <button
          onClick={fetchRealData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Filtros de período - SEGUINDO PADRÃO DO DASHBOARD */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {datePresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyDatePreset(index)}
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-all duration-300 backdrop-blur-lg
                  ${selectedPreset === index
                    ? 'bg-primary text-white shadow-primary-glow'
                    : 'glass-light text-white hover:glass-medium'}
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Período selecionado */}
          <div className="text-sublabel-refined text-white glass-light px-3 py-2 rounded-2xl">
            <span className="font-medium text-white">Período:</span> {
              filters.startDate && filters.endDate 
                ? `${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`
                : 'Últimos 7 dias'
            }
          </div>
        </div>
        <div className="text-sublabel-refined text-white/70">
          Última atualização: {currentTime || 'Carregando...'}
        </div>
      </div>

      {/* Métricas agregadas expandidas (6 cards) - COM CORES E HOVER EFFECTS */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {/* Total de Leads */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20 hover:bg-blue-900/40 hover:border-blue-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-400 text-sm font-medium">Total de Leads</div>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.totalLeads)}</div>
          </motion.div>

          {/* Total de Gastos */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-green-900/30 rounded-lg p-4 border border-green-500/20 hover:bg-green-900/40 hover:border-green-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400 text-sm font-medium">Total de Gastos</div>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.totalSpend)}</div>
          </motion.div>

          {/* Total de Impressões */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20 hover:bg-purple-900/40 hover:border-purple-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-400 text-sm font-medium">Total de Impressões</div>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.totalImpressions)}</div>
          </motion.div>

          {/* Total de Cliques */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/20 hover:bg-indigo-900/40 hover:border-indigo-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-indigo-400 text-sm font-medium">Total de Cliques</div>
              <MousePointer className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.totalClicks)}</div>
          </motion.div>

          {/* CTR Médio */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-500/20 hover:bg-cyan-900/40 hover:border-cyan-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-cyan-400 text-sm font-medium">CTR Médio</div>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatPercentage(metrics.averageCTR)}</div>
          </motion.div>

          {/* CPL Médio */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-orange-900/30 rounded-lg p-4 border border-orange-500/20 hover:bg-orange-900/40 hover:border-orange-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-orange-400 text-sm font-medium">CPL Médio</div>
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatNumberShort(metrics.averageCPL)}</div>
          </motion.div>
        </div>
      )}

      {/* Gráficos de Performance */}
      {!loading && campaigns.length > 0 && campaigns.some(campaign => campaign.leads > 0 || campaign.spend > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Barras - Gastos por Campanha */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Gastos por Campanha (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedBarChart
                data={campaigns.slice(0, 10).map(campaign => ({
                  label: campaign.campaign_name?.substring(0, 20) + (campaign.campaign_name?.length > 20 ? '...' : ''),
                  gastos: campaign.spend || 0,
                  leads: campaign.leads || 0
                }))}
                keys={['gastos']}
                indexBy="label"
                height={300}
              />
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Distribuição de Leads */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedPieChart
                data={campaigns.slice(0, 8)
                  .filter(campaign => campaign.leads > 0)
                  .map(campaign => ({
                    id: campaign.campaign_name?.substring(0, 15) + (campaign.campaign_name?.length > 15 ? '...' : ''),
                    label: campaign.campaign_name?.substring(0, 15) + (campaign.campaign_name?.length > 15 ? '...' : ''),
                    value: campaign.leads || 0
                  }))}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Tendências de Performance */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 lg:col-span-2 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Tendências de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedLineChart
                data={[
                  {
                    id: 'Leads',
                    color: '#8A2BE2',
                    data: campaigns.slice(0, 10).map((campaign, index) => ({
                      x: `Campanha ${index + 1}`,
                      y: campaign.leads || 0
                    }))
                  },
                  {
                    id: 'Gastos (R$)',
                    color: '#00BFFF',
                    data: campaigns.slice(0, 10).map((campaign, index) => ({
                      x: `Campanha ${index + 1}`,
                      y: campaign.spend || 0
                    }))
                  }
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Painel de Análise Inteligente */}
      {!loading && campaigns.length > 0 && (
        <div className="mb-6">
          <AIPanel 
            data={aiPanelData}
            filters={aiPanelFilters}
          />
        </div>
      )}

      {/* Tabela de Campanhas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-header font-bold text-primary-text">Campanhas</h2>
          <button
            onClick={fetchRealData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="performance-table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('campaign_name')}>
                        <div className="flex items-center space-x-2">
                          <span>Campanha</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center space-x-2">
                          <span>Status</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('leads')}>
                        <div className="flex items-center space-x-2">
                          <span>Leads</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('spend')}>
                        <div className="flex items-center space-x-2">
                          <span>Gasto</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('ctr')}>
                        <div className="flex items-center space-x-2">
                          <span>CTR</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('cpl')}>
                        <div className="flex items-center space-x-2">
                          <span>CPL</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCampaigns.map((campaign, index) => (
                      <tr key={campaign.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white">
                          <div className="font-medium">{campaign.campaign_name || 'Nome não disponível'}</div>
                        </td>
                        <td className="p-4">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}
                            data-testid="campaign-status"
                          >
                            {campaign.status === 'ACTIVE' ? 'Ativa' : 
                             campaign.status === 'PAUSED' ? 'Pausada' : 
                             campaign.status === 'DELETED' ? 'Excluída' : 
                             campaign.status === 'ARCHIVED' ? 'Arquivada' : campaign.status}
                          </span>
                        </td>
                        <td className="p-4 text-white">{formatNumberShort(campaign.leads || 0)}</td>
                        <td className="p-4 text-white">{formatCurrency(campaign.spend || 0)}</td>
                        <td className="p-4 text-white">{formatPercentage(campaign.ctr || 0)}</td>
                        <td className="p-4 text-white">{formatCurrency(campaign.cpl || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer - Widget de Monitoramento OpenAI */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="max-w-md mx-auto">
          <OpenAIBillingWidget 
            days={7}
            autoRefresh={true}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
} 