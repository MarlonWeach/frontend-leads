'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdsetsData } from '../../src/hooks/useAdsetsData';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import Button from '../../src/components/ui/button';
import { ArrowUpDown, Filter, RefreshCw } from 'lucide-react';
import MainLayout from '../../src/components/MainLayout';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';

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

  const breadcrumbs = [
    { name: 'AdSets', href: '/adsets' }
  ];

  const SAO_PAULO_TZ = 'America/Sao_Paulo';

  const getYesterdaySP = () => {
    // Obter agora em SP
    const now = new Date();
    // Converter para o início do dia em SP
    const todaySP = formatInTimeZone(now, SAO_PAULO_TZ, 'yyyy-MM-dd');
    const todaySPDate = new Date(todaySP + 'T00:00:00-03:00');
    // Subtrair 1 dia
    todaySPDate.setDate(todaySPDate.getDate() - 1);
    // Formatar para yyyy-MM-dd em SP
    return formatInTimeZone(todaySPDate, SAO_PAULO_TZ, 'yyyy-MM-dd');
  };

  const datePresets = [
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
  ];
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
  }, []);

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

  const paginatedAdsets = sortedAdsets.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedAdsets.length / ITEMS_PER_PAGE);

  // Função para exibir label resumida do filtro de data
  const getDateLabel = () => {
    if (selectedPreset !== null) {
      const preset = datePresets[selectedPreset];
      const range = preset.getRange();
      // Usar formatInTimeZone para garantir o timezone correto
      const startLabel = formatInTimeZone(new Date(range.start + 'T00:00:00-03:00'), SAO_PAULO_TZ, 'dd/MM/yyyy');
      const endLabel = formatInTimeZone(new Date(range.end + 'T00:00:00-03:00'), SAO_PAULO_TZ, 'dd/MM/yyyy');
      if (range.start === range.end) {
        return `${preset.label}: ${startLabel}`;
      }
      return `${preset.label}: ${startLabel} - ${endLabel}`;
    }
    return 'Selecione o período';
  };

  if (error) {
    return (
      <MainLayout title="AdSets" breadcrumbs={breadcrumbs}>
        <div className="text-center py-8">
          <h2 className="text-header text-error mb-2">Erro ao carregar adsets</h2>
          <p className="text-sublabel-refined text-white/70 mb-4">{error.message}</p>
          <Button onClick={() => refreshAdsets()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-medium">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{formatNumber(metrics.totalAdsets)}</div>
              <div className="text-sm text-white/70">Total de AdSets</div>
            </CardContent>
          </Card>
          <Card className="glass-medium">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalSpend)}</div>
              <div className="text-sm text-white/70">Gasto Total</div>
            </CardContent>
          </Card>
          <Card className="glass-medium">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{formatNumber(metrics.totalLeads)}</div>
              <div className="text-sm text-white/70">Leads Totais</div>
            </CardContent>
          </Card>
          <Card className="glass-medium">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{formatNumber(metrics.totalImpressions)}</div>
              <div className="text-sm text-white/70">Impressões Totais</div>
            </CardContent>
          </Card>
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
    </MainLayout>
  );
} 