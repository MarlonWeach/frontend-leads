"use client";

import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'PAUSED', label: 'Pausadas' },
  { value: 'DELETED', label: 'Excluídas' }
];

const SORT_OPTIONS = [
  { value: 'data_start_date', label: 'Data de Início' },
  { value: 'campaign_name', label: 'Nome da Campanha' },
  { value: 'leads', label: 'Leads' },
  { value: 'spend', label: 'Gasto' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpl', label: 'CPL' },
  { value: 'roi', label: 'ROI' }
];

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Decrescente' },
  { value: 'asc', label: 'Crescente' }
];

const DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  sortBy: 'data_start_date',
  sortOrder: 'desc',
  status: null,
  startDate: null,
  endDate: null
};

export default function PerformanceFilters({ 
  filters = DEFAULT_FILTERS, 
  onFiltersChange, 
  onClearFilters 
}) {
  const [localFilters, setLocalFilters] = useState(filters || DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sincronizar filtros locais com props
  useEffect(() => {
    setLocalFilters(filters || DEFAULT_FILTERS);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onClearFilters();
  };

  const hasActiveFilters = () => {
    return (
      localFilters?.status ||
      localFilters?.startDate ||
      localFilters?.endDate ||
      localFilters?.sortBy !== 'data_start_date' ||
      localFilters?.sortOrder !== 'desc'
    );
  };

  return (
    <div className="bg-card-background rounded-xl p-6 border border-card-border mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Filtros</h3>
        <div className="flex items-center space-x-3">
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              Limpar Filtros
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Filtros Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Status
              </label>
              <select
                value={localFilters?.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || null)}
                className="w-full px-3 py-2 bg-background-secondary border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Ordenar por
              </label>
              <select
                value={localFilters?.sortBy || 'data_start_date'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-background-secondary border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordem */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Ordem
              </label>
              <select
                value={localFilters?.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-background-secondary border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SORT_ORDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro de Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={localFilters?.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
                className="w-full px-3 py-2 bg-background-secondary border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Data de Fim
              </label>
              <input
                type="date"
                value={localFilters?.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
                className="w-full px-3 py-2 bg-background-secondary border border-card-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                handleFilterChange('startDate', sevenDaysAgo.toISOString().split('T')[0]);
                handleFilterChange('endDate', today.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                handleFilterChange('startDate', thirtyDaysAgo.toISOString().split('T')[0]);
                handleFilterChange('endDate', today.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => {
                handleFilterChange('startDate', null);
                handleFilterChange('endDate', null);
              }}
              className="px-3 py-1.5 text-sm bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
            >
              Todo o período
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 