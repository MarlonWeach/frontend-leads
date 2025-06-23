'use client';

import { useState } from 'react';
import { useAdsetsData } from '../../src/hooks/useAdsetsData';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { ArrowUpDown, Filter, RefreshCw } from 'lucide-react';

export default function AdsetsPage() {
  const [filters, setFilters] = useState({
    status: '',
    hasImpressions: false,
    startDate: '',
    endDate: ''
  });
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const { data: adsets = [], isLoading, error, refetch } = useAdsetsData({
    status: filters.status || null,
    hasImpressions: filters.hasImpressions,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAdsets = [...adsets].sort((a, b) => {
    let aValue, bValue;

    if (sortField === 'metrics') {
      aValue = a.metrics?.impressions || 0;
      bValue = b.metrics?.impressions || 0;
    } else if (sortField === 'spend') {
      aValue = a.metrics?.spend || 0;
      bValue = b.metrics?.spend || 0;
    } else if (sortField === 'leads') {
      aValue = a.metrics?.leads || 0;
      bValue = b.metrics?.leads || 0;
    } else {
      aValue = a[sortField] || '';
      bValue = b[sortField] || '';
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar adsets</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AdSets</h1>
        <p className="text-gray-600">Gerencie e analise seus conjuntos de anúncios</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Todos os status</option>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
                <option value="DELETED">Excluído</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data Início</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasImpressions}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasImpressions: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Com impressões (30 dias)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(adsets.length)}</div>
            <div className="text-sm text-gray-600">Total de AdSets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(adsets.reduce((sum, adset) => sum + (adset.metrics?.spend || 0), 0))}</div>
            <div className="text-sm text-gray-600">Gasto Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(adsets.reduce((sum, adset) => sum + (adset.metrics?.leads || 0), 0))}</div>
            <div className="text-sm text-gray-600">Leads Totais</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(adsets.reduce((sum, adset) => sum + (adset.metrics?.impressions || 0), 0))}</div>
            <div className="text-sm text-gray-600">Impressões Totais</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de AdSets</span>
            <Button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Carregando adsets...</p>
            </div>
          ) : sortedAdsets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum adset encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1"
                      >
                        Nome
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3">Campanha</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('metrics')}
                        className="flex items-center gap-1"
                      >
                        Impressões
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('spend')}
                        className="flex items-center gap-1"
                      >
                        Gasto
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('leads')}
                        className="flex items-center gap-1"
                      >
                        Leads
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </th>
                    <th className="text-left p-3">CTR</th>
                    <th className="text-left p-3">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAdsets.map((adset) => (
                    <tr key={adset.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{adset.name}</td>
                      <td className="p-3">{adset.campaigns?.name || '-'}</td>
                      <td className="p-3"><span className="inline-block px-2 py-1 rounded bg-gray-200 text-xs font-semibold">{adset.status}</span></td>
                      <td className="p-3">{formatNumber(adset.metrics?.impressions)}</td>
                      <td className="p-3">{formatCurrency(adset.metrics?.spend)}</td>
                      <td className="p-3">{formatNumber(adset.metrics?.leads)}</td>
                      <td className="p-3">{formatPercentage(adset.metrics?.ctr)}</td>
                      <td className="p-3">{formatCurrency(adset.metrics?.cpm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 