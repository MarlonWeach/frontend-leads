"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { ArrowUpDown, TrendingUp, Eye, MousePointer, DollarSign, Users, Clock } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import AnimatedBarChart from '../../src/components/ui/AnimatedBarChart';
import AnimatedPieChart from '../../src/components/ui/AnimatedPieChart';
import { AIPanel } from '../../src/components/ai/AIPanel';
import { OpenAIBillingWidget } from '../../src/components/ai/OpenAIBillingWidget';
import { motion } from 'framer-motion';
import { InsightsPanel } from '../../src/components/insights/InsightsPanel';
import { PerformanceHeatmap } from '../../src/components/insights/PerformanceHeatmap';
import { PerformanceForecast } from '../../src/components/insights/PerformanceForecast';

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

  // Inicializar filtros com data de hoje para evitar carregamento incorreto na primeira renderização
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const todayStr = formatInTimeZone(today, 'America/Sao_Paulo', 'yyyy-MM-dd');
    return {
      status: 'ACTIVE',
      startDate: todayStr,
      endDate: todayStr,
      page: 1,
      limit: 20
    };
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'spend',
    direction: 'desc'
  });

  const [_showDateMenu, setShowDateMenu] = useState(false);
  const [_showStatusMenu, setShowStatusMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [sortField, setSortField] = useState('leads');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filtros do heatmap
  const [heatmapFilters, setHeatmapFilters] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29); // Últimos 30 dias
    
    return {
      metric: 'cpl', // CPL como padrão
      period: 30,
      startDate: start,
      endDate: end
    };
  });
  const dateMenuRef = useRef(null);
  const statusMenuRef = useRef(null);

  // Presets de data com timezone São Paulo
  const SAO_PAULO_TZ = 'America/Sao_Paulo';
  
  const datePresets = useMemo(() => [
    { label: 'Hoje', getRange: () => {
      // Usar data atual no timezone São Paulo para evitar offset
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: todaySP, end: todaySP };
    }},
    { label: 'Ontem', getRange: () => {
      // CORREÇÃO CRÍTICA: Calcular ontem corretamente no timezone São Paulo
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      todaySPDate.setDate(todaySPDate.getDate() - 1);
      const yesterdaySP = formatInTimeZone(todaySPDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: yesterdaySP, end: yesterdaySP };
    }},
    { label: 'Últimos 3 dias', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      const threeDaysAgoDate = new Date(todaySPDate);
      threeDaysAgoDate.setDate(todaySPDate.getDate() - 2);
      const threeDaysAgoSP = formatInTimeZone(threeDaysAgoDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      
      // CORREÇÃO: Últimos 3 dias deve ser ontem, anteontem e 3 dias atrás (não incluir hoje)
      const yesterdayDate = new Date(todaySPDate);
      yesterdayDate.setDate(todaySPDate.getDate() - 1);
      const yesterdaySP = formatInTimeZone(yesterdayDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      
      return { 
        start: threeDaysAgoSP, 
        end: yesterdaySP 
      };
    }},
    { label: 'Últimos 7 dias', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      const sevenDaysAgoDate = new Date(todaySPDate);
      sevenDaysAgoDate.setDate(todaySPDate.getDate() - 6);
      const sevenDaysAgoSP = formatInTimeZone(sevenDaysAgoDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      
      // CORREÇÃO: Últimos 7 dias deve ser os 7 dias anteriores a hoje (não incluir hoje)
      const yesterdayDate = new Date(todaySPDate);
      yesterdayDate.setDate(todaySPDate.getDate() - 1);
      const yesterdaySP = formatInTimeZone(yesterdayDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      
      return { 
        start: sevenDaysAgoSP, 
        end: yesterdaySP 
      };
    }},
    { label: 'Personalizado', getRange: () => {
      // Será usado quando o usuário selecionar datas customizadas
      return { start: '', end: '' };
    }},
  ], []);

  const [selectedPreset, setSelectedPreset] = useState(0); // Hoje por padrão
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

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
    // Garantir que o preset selecionado seja "Hoje" na montagem
    // (os filtros já foram inicializados com a data correta)
    setSelectedPreset(0);
  }, []); // Executar apenas uma vez na montagem

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

  const applyCustomDateRange = () => {
    setFilters(prev => ({
      ...prev,
      startDate: customDateRange.start,
      endDate: customDateRange.end,
      page: 1 // Reset para primeira página
    }));
    setSelectedPreset(4); // Indica que é um período personalizado
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

  // Memoizar campaigns para evitar re-renders desnecessários
  const campaigns = useMemo(() => data?.campaigns || [], [data?.campaigns]);
  const metrics = data?.metrics;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Garantir interpretação correta da data evitando problemas de timezone
    // Adicionar T00:00:00 para forçar horário local
    const dateWithTime = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    return formatInTimeZone(new Date(dateWithTime), 'America/Sao_Paulo', 'dd/MM/yyyy');
  };

  // Função para exibir label resumida do filtro de data
  const getDateLabel = useCallback(() => {
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
  }, [selectedPreset, datePresets, filters.startDate, filters.endDate]);

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
  }), [filters.startDate, filters.endDate, filters.status, getDateLabel]);

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

  // Calcular altura dinâmica da tabela baseada no número de campanhas
  const calculateTableHeight = () => {
    const baseHeight = 60; // Altura do cabeçalho
    const rowHeight = 72; // Altura estimada por linha (p-4 = 16px top + 16px bottom + ~40px conteúdo)
    const maxRows = 10; // Máximo de linhas visíveis antes do scroll
    const totalHeight = baseHeight + (sortedCampaigns.length * rowHeight);
    const maxHeight = baseHeight + (maxRows * rowHeight);
    
    return Math.min(totalHeight, maxHeight);
  };

  const tableHeight = calculateTableHeight();

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
    <div className="flex flex-col gap-8" data-testid="performance-page">
      {/* Resumo do período no topo da página */}
      <div className="flex items-center justify-between">
        <div className="text-sublabel-refined text-white glass-light px-4 py-3 rounded-2xl">
          <span className="font-medium text-white">Período Selecionado:</span> {
            filters.startDate && filters.endDate 
              ? `${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`
              : 'Últimos 7 dias'
          }
        </div>
        <div className="text-sublabel-refined text-white/70 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Última atualização: {currentTime || 'Carregando...'}
        </div>
      </div>

      {/* Métricas agregadas no topo */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
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

          {/* ROI Médio - 7º card */}
          <motion.div 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-pink-900/30 rounded-lg p-4 border border-pink-500/20 hover:bg-pink-900/40 hover:border-pink-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-pink-400 text-sm font-medium">ROI Médio</div>
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatPercentage(metrics.averageROI)}</div>
          </motion.div>
        </div>
      )}

      {/* Filtros de período - SEGUINDO PADRÃO DO DASHBOARD */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4">
          {/* Label para Presets de data */}
          <label className="text-sm text-white/70 mb-1">Presets</label>
          {/* Presets de data */}
          <div id="date-presets" className="flex space-x-2">
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
          {/* Labels e campos de data customizada sempre visíveis */}
          <div className="flex space-x-4 items-center mt-2">
            <div className="flex flex-col">
              <label htmlFor="custom-date-start" className="text-sm text-white/70 mb-1">Data Início</label>
              <input
                id="custom-date-start"
                type="date"
                value={customDateRange.start || filters.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                disabled={selectedPreset !== 4}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="custom-date-end" className="text-sm text-white/70 mb-1">Data Fim</label>
              <input
                id="custom-date-end"
                type="date"
                value={customDateRange.end || filters.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                disabled={selectedPreset !== 4}
              />
            </div>
            {selectedPreset === 4 && (
              <button
                onClick={() => applyCustomDateRange()}
                disabled={!customDateRange.start || !customDateRange.end}
                className="px-4 py-2 mt-6 rounded-lg bg-primary text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
              >
                Aplicar
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Label para filtro de status */}
          <label htmlFor="status-filter" className="text-sm text-white/70 mb-1">Status</label>
          {/* Botões de status para compatibilidade com E2E */}
          <div className="flex space-x-2 mb-2">
            <button onClick={() => setFilters(prev => ({ ...prev, status: 'ACTIVE', page: 1 }))} className={`px-3 py-1 rounded ${filters.status === 'ACTIVE' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>Ativo</button>
            <button onClick={() => setFilters(prev => ({ ...prev, status: 'PAUSED', page: 1 }))} className={`px-3 py-1 rounded ${filters.status === 'PAUSED' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>Pausado</button>
            <button onClick={() => setFilters(prev => ({ ...prev, status: 'DELETED', page: 1 }))} className={`px-3 py-1 rounded ${filters.status === 'DELETED' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>Excluído</button>
            <button onClick={() => setFilters(prev => ({ ...prev, status: 'ARCHIVED', page: 1 }))} className={`px-3 py-1 rounded ${filters.status === 'ARCHIVED' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>Arquivado</button>
            <button onClick={() => setFilters(prev => ({ ...prev, status: 'ALL', page: 1 }))} className={`px-3 py-1 rounded ${filters.status === 'ALL' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}>Todos</button>
          </div>
          {/* Select de status (mantido para acessibilidade) */}
          <select
            id="status-filter"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary focus:outline-none"
            style={{ minWidth: 120 }}
          >
            <option value="ACTIVE">Ativo</option>
            <option value="PAUSED">Pausado</option>
            <option value="DELETED">Excluído</option>
            <option value="ARCHIVED">Arquivado</option>
            <option value="ALL">Todos</option>
          </select>
        </div>
      </div>

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
        </div>
      )}

      {/* Heatmap de Performance */}
      {!loading && campaigns.length > 0 && (
        <div className="mb-6">
          <PerformanceHeatmap
            filters={heatmapFilters}
            onFiltersChange={(newFilters) => setHeatmapFilters(prev => ({ ...prev, ...newFilters }))}
            className="w-full"
          />
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

      {/* Painel de Insights Automáticos */}
      {!loading && campaigns.length > 0 && filters.startDate && filters.endDate && (
        <div className="mb-6">
          {(() => {
            const dateRange = {
              start: new Date(filters.startDate + 'T00:00:00'),
              end: new Date(filters.endDate + 'T00:00:00')
            };
            return (
              <InsightsPanel 
                dateRange={dateRange}
                config={{
                  threshold: 10,
                  maxInsights: 5,
                  enableAI: false
                }}
                className="bg-white/5 rounded-lg p-6 backdrop-blur-sm border border-white/10"
              />
            );
          })()}
        </div>
      )}

      {/* Sistema de Previsões de Performance */}
      {!loading && campaigns.length > 0 && filters.startDate && filters.endDate && (
        <div className="mb-6">
          <PerformanceForecast 
            dateRange={{
              start: new Date(filters.startDate + 'T00:00:00'),
              end: new Date(filters.endDate + 'T00:00:00')
            }}
            className="col-span-full"
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
              <div 
                className="table-responsive table-container w-full overflow-y-auto"
                style={{ maxHeight: `${tableHeight}px` }}
              >
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-white/10 table-fixed" data-testid="performance-table">
                      <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/4" onClick={() => handleSort('campaign_name')}>
                            <div className="flex items-center space-x-2">
                              <span>Campanha</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/6" onClick={() => handleSort('status')}>
                            <div className="flex items-center space-x-2">
                              <span>Status</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/6" onClick={() => handleSort('leads')}>
                            <div className="flex items-center space-x-2">
                              <span>Leads</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/6" onClick={() => handleSort('spend')}>
                            <div className="flex items-center space-x-2">
                              <span>Gasto</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/6" onClick={() => handleSort('ctr')}>
                            <div className="flex items-center space-x-2">
                              <span>CTR</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium text-white cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap w-1/6" onClick={() => handleSort('cpl')}>
                            <div className="flex items-center space-x-2">
                              <span>CPL</span>
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedCampaigns.map((campaign, index) => (
                          <tr key={campaign.id || index} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white whitespace-nowrap w-1/4">
                              <div className="font-medium table-cell-responsive max-w-xs truncate" title={campaign.campaign_name || 'Nome não disponível'}>
                                {campaign.campaign_name || 'Nome não disponível'}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap w-1/6">
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
                            <td className="p-4 text-white whitespace-nowrap w-1/6">{formatNumberShort(campaign.leads || 0)}</td>
                            <td className="p-4 text-white whitespace-nowrap w-1/6">{formatCurrency(campaign.spend || 0)}</td>
                            <td className="p-4 text-white whitespace-nowrap w-1/6">{formatPercentage(campaign.ctr || 0)}</td>
                            <td className="p-4 text-white whitespace-nowrap w-1/6">{formatCurrency(campaign.cpl || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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