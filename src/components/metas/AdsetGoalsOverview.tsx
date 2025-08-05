'use client';

// Component: AdsetGoalsOverview.tsx
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Filter, 
  RefreshCw,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useAdsetGoals } from '../../hooks/useAdsetGoals';
import { useGoalFilters } from '../../hooks/useGoalFilters';
import AdsetGoalCard from './AdsetGoalCard';
import GoalStatusBadge from './GoalStatusBadge';
import { formatInTimeZone } from 'date-fns-tz';
import { AdsetGoalFilters } from '../../types/adsetGoalsDashboard';

export default function AdsetGoalsOverview() {
  // Presets de data/timeframe
  const datePresets = useMemo(() => [
    {
      label: 'Hoje',
      getRange: () => {
        const today = new Date();
        const start = today.toISOString().split('T')[0];
        return { start, end: start };
      }
    },
    {
      label: 'Ontem',
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const start = yesterday.toISOString().split('T')[0];
        return { start, end: start };
      }
    },
    {
      label: 'Últimos 7 dias',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Últimos 30 dias',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Este mês',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    }
  ], []);

  const { filters, setFilters, resetFilters, appliedFiltersCount } = useGoalFilters();
  const { data, summary, loading, error, refresh } = useAdsetGoals(filters);
  const [showFilters, setShowFilters] = useState(false);





  // Presets de data/timeframe
  const SAO_PAULO_TZ = 'America/Sao_Paulo';
  const [selectedPreset, setSelectedPreset] = useState<number | null>(2); // Últimos 7 dias padrão
  const [showDateMenu, setShowDateMenu] = useState(false);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 220 });

  // Sincronizar selectedPreset com filters.date_range
  useEffect(() => {
    if (!filters.date_range) {
      // Se não há date_range, definir como padrão (Últimos 7 dias)
      setSelectedPreset(2);
      return;
    }
    
    const { start, end } = filters.date_range;
    let found = null;
    for (let i = 0; i < datePresets.length; i++) {
      const range = datePresets[i].getRange();
      if (range.start === start && range.end === end) {
        found = i;
        break;
      }
    }
    setSelectedPreset(found);
  }, [filters.date_range, datePresets]);

  // Atualizar posição do menu ao abrir
  useEffect(() => {
    if (showDateMenu && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width || 220
      });
    }
  }, [showDateMenu]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!showDateMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dateButtonRef.current &&
        !dateButtonRef.current.contains(e.target as Node)
      ) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDateMenu]);

  // Componente do menu via portal
  const DateMenuPortal = showDateMenu && typeof window !== 'undefined'
    ? createPortal(
        <div
          className="z-[9999] bg-zinc-900/95 rounded-lg shadow-2xl border border-gray-700 min-w-[220px] p-2"
          style={{
            position: 'absolute',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          {datePresets.map((preset, index) => (
            <button
              key={preset.label}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPreset === index ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-blue-800/40'
              }`}
              onClick={() => applyDatePreset(index)}
            >
              {preset.label}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  // Atualizar filtro ao trocar preset
  const applyDatePreset = (presetIndex: number) => {
    const preset = datePresets[presetIndex];
    const range = preset.getRange();
    
    // Atualizar filtros
    setFilters({
      date_range: { start: range.start, end: range.end }
    });
    
    // Atualizar selectedPreset imediatamente
    setSelectedPreset(presetIndex);
    setShowDateMenu(false);
  };
  // Label do período
  const getDateLabel = () => {
    if (selectedPreset !== null) {
      return datePresets[selectedPreset].label;
    }
    if (filters.date_range?.start && filters.date_range?.end) {
      if (filters.date_range.start === filters.date_range.end) {
        return formatInTimeZone(new Date(filters.date_range.start), SAO_PAULO_TZ, 'dd/MM/yyyy');
      }
      return `${formatInTimeZone(new Date(filters.date_range.start), SAO_PAULO_TZ, 'dd/MM/yyyy')} - ${formatInTimeZone(new Date(filters.date_range.end), SAO_PAULO_TZ, 'dd/MM/yyyy')}`;
    }
    return 'Selecionar período';
  };

  const handleSearch = (value: string) => {
    setFilters({ search: value || undefined });
  };

  const handleStatusFilter = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status as any)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status as any];
    
    setFilters({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handleSortChange = (sortBy: string) => {
    const newOrder = filters.sort_by === sortBy && filters.sort_order === 'desc' ? 'asc' : 'desc';
    setFilters({ sort_by: sortBy as any, sort_order: newOrder });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-white/70">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando metas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-medium border border-red-500/30 rounded-lg p-6 text-center">
        <div className="text-red-400 font-medium mb-2">Erro ao carregar metas</div>
        <div className="text-red-300 text-sm mb-4">{error}</div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sublabel-refined text-white/70">
            Monitor do progresso das metas por adset em tempo real
          </p>
        </div>
        
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 glass-medium text-white rounded-lg hover:glass-light transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            Total
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.total_adsets}
          </div>
        </div>

        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            No Prazo
          </div>
          <div className="text-2xl font-bold text-green-400">
            {summary.no_prazo}
          </div>
        </div>

        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            Atenção
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {summary.atencao}
          </div>
        </div>

        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            Atrasado
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {summary.atrasado}
          </div>
        </div>

        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            Crítico
          </div>
          <div className="text-2xl font-bold text-red-400">
            {summary.critico}
          </div>
        </div>

        <div className="glass-medium rounded-lg p-4">
          <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
            Atingido
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {summary.atingido}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-medium rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Buscar por adset ou campanha..."
              className="w-full pl-10 pr-4 py-2 glass-light text-white placeholder-white/50 rounded-lg border border-white/10 focus:border-primary focus:outline-none"
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {/* Filtro de Período */}
          <div className="relative">
            <button
              ref={dateButtonRef}
              onClick={() => setShowDateMenu((v) => !v)}
              className="flex items-center gap-2 glass-medium text-white font-medium px-4 py-2 rounded-lg"
            >
              <Calendar className="w-4 h-4" />
              <span>Período: {getDateLabel()}</span>
            </button>
            {DateMenuPortal}
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || appliedFiltersCount > 0
                ? 'glass-light text-white'
                : 'glass-medium text-white/70 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {appliedFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {appliedFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="space-y-4">
              {/* Status Filters */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'no_prazo', label: 'No Prazo', color: 'green' },
                    { key: 'atencao', label: 'Atenção', color: 'yellow' },
                    { key: 'atrasado', label: 'Atrasado', color: 'orange' },
                    { key: 'critico', label: 'Crítico', color: 'red' },
                    { key: 'atingido', label: 'Atingido', color: 'blue' }
                  ].map((status) => {
                    const isSelected = filters.status?.includes(status.key as any);
                    return (
                      <button
                        key={status.key}
                        onClick={() => handleStatusFilter(status.key)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          isSelected
                            ? `bg-${status.color}-600 text-white`
                            : 'glass-light text-white/70 hover:text-white'
                        }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Ordenar por
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'progress_percentage', label: 'Progresso' },
                    { key: 'days_remaining', label: 'Dias Restantes' },
                    { key: 'current_cpl', label: 'CPL Atual' },
                    { key: 'adset_name', label: 'Nome' }
                  ].map((sort) => {
                    const isSelected = filters.sort_by === sort.key;
                    return (
                      <button
                        key={sort.key}
                        onClick={() => handleSortChange(sort.key)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                          isSelected
                            ? 'glass-light text-white'
                            : 'glass-medium text-white/70 hover:text-white'
                        }`}
                      >
                        {sort.label}
                        {isSelected && (
                          <span className="text-xs">
                            {filters.sort_order === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Filters */}
              {appliedFiltersCount > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Limpar Filtros ({appliedFiltersCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhuma meta encontrada
          </h3>
          <p className="text-white/60">
            Não há adsets com metas configuradas que correspondam aos filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((item) => (
            <AdsetGoalCard
              key={item.adset_id}
              item={item}
              onEdit={(adset_id) => {
                // TODO: Implementar modal de edição
                console.log('Edit goal for adset:', adset_id);
              }}
              onViewDetails={(adset_id) => {
                // TODO: Implementar navegação para detalhes
                console.log('View details for adset:', adset_id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
} 