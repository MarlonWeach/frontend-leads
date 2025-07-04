'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAdsetsData } from '../../src/hooks/useAdsetsData';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import Button from '../../src/components/ui/button';
import { Filter, RefreshCw, Brain } from 'lucide-react';
import MainLayout from '../../src/components/MainLayout';
import { formatInTimeZone } from 'date-fns-tz';
import IndividualAnalysis from '../../src/components/ai/IndividualAnalysis';

export default function AdsetsPage() {
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    startDate: '',
    endDate: ''
  });
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [showDateMenu, setShowDateMenu] = useState(false);
  const dateMenuRef = useRef(null);
  
  // Estado para análise individual
  const [analysisItem, setAnalysisItem] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const breadcrumbs = [
    { name: 'AdSets', href: '/adsets' }
  ];

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
    { label: 'Hoje e ontem', getRange: () => {
      const now = new Date();
      const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
      const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
      const yestSPDate = new Date(todaySPDate);
      yestSPDate.setDate(todaySPDate.getDate() - 1);
      const yestSP = formatInTimeZone(yestSPDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
      return { start: yestSP, end: todaySP };
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
    { label: 'Last 14 days', getRange: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - 13);
      return {
        start: formatInTimeZone(past, SAO_PAULO_TZ, 'yyyy-MM-dd'),
        end: formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd')
      };
    }},
    { label: 'Last 28 days', getRange: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - 27);
      return {
        start: formatInTimeZone(past, SAO_PAULO_TZ, 'yyyy-MM-dd'),
        end: formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd')
      };
    }},
    { label: 'Last 30 days', getRange: () => {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - 29);
      return {
        start: formatInTimeZone(past, SAO_PAULO_TZ, 'yyyy-MM-dd'),
        end: formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd')
      };
    }},
  ], []);
  const [selectedPreset, setSelectedPreset] = useState(1);

  const { adsets, loading, error, metrics, refreshAdsets } = useAdsetsData({
    status: filters.status || null,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    limit: 1000
  });

  useEffect(() => {
    // Ao montar, aplicar o preset Yesterday
    const range = datePresets[1].getRange();
    setFilters(f => ({ ...f, startDate: range.start, endDate: range.end }));
    setSelectedPreset(1);
  }, [datePresets]);

  // Ordenação padrão por investimento (spend) decrescente
  useEffect(() => {
    setSortField('spend');
    setSortDirection('desc');
  }, []);

  // Função para abrir análise individual
  const handleAnalysisClick = (adset) => {
    setAnalysisItem({
      id: adset.id,
      name: adset.name,
      type: 'adset',
      data: adset
    });
    setIsAnalysisOpen(true);
  };



  const sortedAdsets = [...adsets].sort((a, b) => {
    let aValue, bValue;

    if (sortField === 'impressions') {
      aValue = parseInt(a.impressions) || 0;
      bValue = parseInt(b.impressions) || 0;
    } else if (sortField === 'spend') {
      aValue = parseFloat(a.spend) || 0;
      bValue = parseFloat(b.spend) || 0;
    } else if (sortField === 'leads') {
      aValue = parseInt(a.leads) || 0;
      bValue = parseInt(b.leads) || 0;
    } else if (sortField === 'clicks') {
      aValue = parseInt(a.clicks) || 0;
      bValue = parseInt(b.clicks) || 0;
    } else if (sortField === 'ctr') {
      aValue = parseFloat(a.ctr) || 0;
      bValue = parseFloat(b.ctr) || 0;
    } else if (sortField === 'cpm') {
      aValue = parseFloat(a.cpm) || 0;
      bValue = parseFloat(b.cpm) || 0;
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

  const paginatedAdsets = sortedAdsets.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedAdsets.length / ITEMS_PER_PAGE);

  // Função para exibir label resumida do filtro de data
  const getDateLabel = () => {
    if (selectedPreset !== null) {
      return datePresets[selectedPreset].label;
    }
    if (filters.startDate && filters.endDate) {
      if (filters.startDate === filters.endDate) {
        return filters.startDate;
      }
      return `${filters.startDate} - ${filters.endDate}`;
    }
    return 'Selecionar período';
  };

  if (error) {
    return (
      <MainLayout title="AdSets" breadcrumbs={breadcrumbs}>
        <div className="text-center py-8">
          <div className="text-red-400 text-lg font-medium mb-4">{error}</div>
          <Button onClick={() => refreshAdsets()}>
            Tentar novamente
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="AdSets" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-header text-white mb-2">AdSets</h1>
          <p className="text-sublabel-refined text-white/70">Gerencie e analise seus conjuntos de anúncios</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 md:w-56">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white/5 text-white/80 hover:bg-blue-700/80"
              onClick={() => setShowDateMenu(v => !v)}
              ref={dateMenuRef}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#888" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#888" strokeWidth="2"/></svg>
              <span>{getDateLabel()}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>
            </button>
            {showDateMenu && (
              <div className="absolute z-50 mt-2 flex bg-white/95 rounded-lg shadow-lg border border-gray-200" style={{ minWidth: 340 }}>
                <div className="flex flex-col gap-2 p-2 border-r border-gray-200 bg-white/90">
                  {datePresets.map((preset, idx) => (
                    <button
                      key={preset.label}
                      className={`text-left px-4 py-2 rounded-lg ${selectedPreset===idx ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-100'}`}
                      onClick={() => {
                        setSelectedPreset(idx);
                        const range = preset.getRange();
                        setFilters(f => ({ ...f, startDate: range.start, endDate: range.end }));
                        setPage(1);
                        setShowDateMenu(false);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  <label className="block text-xs mb-1 text-gray-700">Data Início</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border rounded px-2 py-1 mb-2"
                  />
                  <label className="block text-xs mb-1 text-gray-700">Data Fim</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border rounded px-2 py-1"
                  />
                  <button
                    className="mt-2 w-full bg-blue-600 text-white rounded px-3 py-1"
                    onClick={() => { setShowDateMenu(false); setSelectedPreset(null); setPage(1); }}
                  >Aplicar</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <Card className="glass-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/70">Status</label>
                    <select
                      className="w-full glass-light border border-white/10 rounded-xl px-3 py-2 text-white bg-transparent"
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bloco de métricas agregadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {/* Total de Leads */}
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/20 hover:bg-blue-900/40 hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-400 text-sm font-medium">Total de Leads</div>
              <span className="text-blue-400 font-bold">🔵</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(metrics?.totalLeads || 0)}
            </div>
          </div>
          {/* Investimento */}
          <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/20 hover:bg-green-900/40 hover:border-green-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400 text-sm font-medium">Investimento</div>
              <span className="text-green-400 font-bold">💸</span>
            </div>
            <div className="text-2xl font-bold text-white">
              R$ {metrics?.totalSpend ? metrics.totalSpend.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0'}
            </div>
          </div>
          {/* Impressões */}
          <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20 hover:bg-purple-900/40 hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-400 text-sm font-medium">Impressões</div>
              <span className="text-purple-400 font-bold">👁️</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(metrics?.totalImpressions || 0)}
            </div>
          </div>
          {/* Cliques */}
          <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/20 hover:bg-indigo-900/40 hover:border-indigo-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-indigo-400 text-sm font-medium">Cliques</div>
              <span className="text-indigo-400 font-bold">🖱️</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(metrics?.totalClicks || 0)}
            </div>
          </div>
          {/* CTR Médio */}
          <div className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-500/20 hover:bg-cyan-900/40 hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-cyan-400 text-sm font-medium">CTR Médio</div>
              <span className="text-cyan-400 font-bold">📈</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics?.averageCTR ? metrics.averageCTR.toFixed(2) + '%' : '0%'}
            </div>
          </div>
          {/* CPL Médio */}
          <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-500/20 hover:bg-orange-900/40 hover:border-orange-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-orange-400 text-sm font-medium">CPL Médio</div>
              <span className="text-orange-400 font-bold">💰</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics?.averageCPL ? 'R$ ' + metrics.averageCPL.toFixed(2) : 'R$ 0,00'}
            </div>
          </div>
        </div>

        <Card className="glass-medium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Lista de AdSets</span>
              <Button onClick={() => refreshAdsets()} disabled={loading} className="flex items-center gap-2 glass-medium">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Carregando adsets...</p>
              </div>
            ) : paginatedAdsets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum adset encontrado com os filtros aplicados.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* TABELA FORA DO CARD PARA RESPONSIVIDADE TOTAL */}
        {(!loading && paginatedAdsets.length > 0) && (
          <div className="w-screen max-w-none -mx-6 sm:mx-0 sm:w-full sm:max-w-full">
            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-xs md:text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="w-32 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Nome</th>
                    <th className="w-32 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Campanha</th>
                    <th className="w-20 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Status</th>
                    <th className="w-24 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Impressões</th>
                    <th className="w-20 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Cliques</th>
                    <th className="w-24 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Gasto</th>
                    <th className="w-20 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">Leads</th>
                    <th className="w-16 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">CTR</th>
                    <th className="w-20 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">CPM</th>
                    <th className="w-16 p-1 md:p-3 font-semibold text-white whitespace-nowrap text-xs md:text-sm truncate">IA</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAdsets.map((adset) => (
                    <tr key={adset.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="w-32 p-1 md:p-3 font-medium text-white break-words truncate max-w-xs">{adset.name}</td>
                      <td className="w-32 p-1 md:p-3 text-white/80 break-words truncate max-w-xs">{adset.campaign_name || '-'}</td>
                      <td className="w-20 p-1 md:p-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(adset.status)}`}>{adset.status}</span>
                      </td>
                      <td className="w-24 p-1 md:p-3 text-white truncate max-w-xs">{formatNumber(adset.impressions)}</td>
                      <td className="w-20 p-1 md:p-3 text-white truncate max-w-xs">{formatNumber(adset.clicks)}</td>
                      <td className="w-24 p-1 md:p-3 text-white truncate max-w-xs">{formatCurrency(adset.spend)}</td>
                      <td className="w-20 p-1 md:p-3 text-white truncate max-w-xs">{formatNumber(adset.leads)}</td>
                      <td className="w-16 p-1 md:p-3 text-white truncate max-w-xs">{adset.ctr ? `${parseFloat(adset.ctr).toFixed(2)}%` : '-'}</td>
                      <td className="w-20 p-1 md:p-3 text-white truncate max-w-xs">{adset.cpm ? formatCurrency(adset.cpm) : '-'}</td>
                      <td className="w-16 p-1 md:p-3">
                        <button
                          onClick={() => handleAnalysisClick(adset)}
                          className="p-1 bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded hover:bg-blue-900/40 hover:border-blue-500/40 transition-all duration-200"
                          title="Análise de IA"
                        >
                          <Brain className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <span className="text-white/70">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</Button>
            <Button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Próxima</Button>
          </div>
        </div>
      </div>

      {/* Modal de Análise Individual */}
      {analysisItem && (
        <IndividualAnalysis
          isOpen={isAnalysisOpen}
          onClose={() => {
            setIsAnalysisOpen(false);
            setAnalysisItem(null);
          }}
          item={analysisItem}
          dateRange={{
            startDate: filters.startDate,
            endDate: filters.endDate
          }}
        />
      )}
    </MainLayout>
  );
} 