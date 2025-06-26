'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdsData } from '../../src/hooks/useAdsData';
import { useCampaignsList } from '../../src/hooks/useCampaignsList';
import { useAdsetsList } from '../../src/hooks/useAdsetsList';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import Button from '../../src/components/ui/button.jsx';
import { ArrowUpDown, Filter, RefreshCw, Image, Video, FileText, Eye, MousePointer, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import MainLayout from '../../src/components/MainLayout';
import AdCreativePreview from '../../src/components/ui/AdCreativePreview';
import AdCreativeModal from '../../src/components/ui/AdCreativeModal';
import { formatInTimeZone } from 'date-fns-tz';
import ReactDOM from 'react-dom';

export default function AdsPage() {
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    campaignId: '',
    adsetId: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [showAdsetMenu, setShowAdsetMenu] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const dateMenuRef = useRef(null);
  const campaignMenuRef = useRef(null);
  const adsetMenuRef = useRef(null);

  const { ads, loading, error, metrics, refreshAds, isFetching } = useAdsData(filters);
  const { campaigns, loading: campaignsLoading } = useCampaignsList();
  const { adsets, loading: adsetsLoading } = useAdsetsList(filters.campaignId);

  // Presets de data com timezone São Paulo
  const SAO_PAULO_TZ = 'America/Sao_Paulo';
  
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
  ];

  const [selectedPreset, setSelectedPreset] = useState(2); // Últimos 7 dias por padrão

  useEffect(() => {
    // Ao montar, aplicar o preset "Últimos 7 dias"
    const range = datePresets[2].getRange();
    setFilters(prev => ({
      ...prev,
      startDate: range.start,
      endDate: range.end
    }));
  }, []);

  // Resetar filtro de adset quando campanha mudar
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      adsetId: ''
    }));
  }, [filters.campaignId]);

  const applyDatePreset = (presetIndex) => {
    const preset = datePresets[presetIndex];
    const range = preset.getRange();
    setFilters(prev => ({
      ...prev,
      startDate: range.start,
      endDate: range.end
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

  const handleExpandCreative = (ad) => {
    setSelectedAd(ad);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAd(null);
  };

  const sortedAds = [...(ads || [])].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return formatInTimeZone(new Date(dateString), 'America/Sao_Paulo', 'dd/MM/yyyy');
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

  // Função para obter nome da campanha selecionada
  const getCampaignLabel = () => {
    if (!filters.campaignId) return 'Todas as campanhas';
    const campaign = campaigns.find(c => c.id === filters.campaignId);
    return campaign ? campaign.name : filters.campaignId;
  };

  // Função para obter nome do adset selecionado
  const getAdsetLabel = () => {
    if (!filters.adsetId) return 'Todos os adsets';
    const adset = adsets.find(a => a.id === filters.adsetId);
    return adset ? adset.name : filters.adsetId;
  };

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
    { value: 'PAUSED', label: 'Pausado' },
  ];

  const statusLabel = {
    'ACTIVE': 'Ativo',
    'INACTIVE': 'Inativo',
    'PAUSED': 'Pausado',
  };

  const statusBtnRef = useRef(null);
  const presetBtnRef = useRef(null);
  const campaignBtnRef = useRef(null);
  const adsetBtnRef = useRef(null);
  const [statusMenuPos, setStatusMenuPos] = useState(null);
  const [presetMenuPos, setPresetMenuPos] = useState(null);
  const [campaignMenuPos, setCampaignMenuPos] = useState(null);
  const [adsetMenuPos, setAdsetMenuPos] = useState(null);
  const [pendingStatusMenu, setPendingStatusMenu] = useState(false);
  const [pendingPresetMenu, setPendingPresetMenu] = useState(false);
  const [pendingCampaignMenu, setPendingCampaignMenu] = useState(false);
  const [pendingAdsetMenu, setPendingAdsetMenu] = useState(false);

  // Ao clicar, apenas marca como pendente
  const openStatusMenu = () => {
    setPendingStatusMenu(true);
  };
  const openPresetMenu = () => {
    setPendingPresetMenu(true);
  };
  const openCampaignMenu = () => {
    setPendingCampaignMenu(true);
  };
  const openAdsetMenu = () => {
    setPendingAdsetMenu(true);
  };

  // Quando pendente, calcula a posição e só então mostra o menu
  useEffect(() => {
    if (pendingStatusMenu && statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect();
      setStatusMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowStatusMenu(true);
      setPendingStatusMenu(false);
    }
  }, [pendingStatusMenu]);

  useEffect(() => {
    if (pendingPresetMenu && presetBtnRef.current) {
      const rect = presetBtnRef.current.getBoundingClientRect();
      setPresetMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowDateMenu(true);
      setPendingPresetMenu(false);
    }
  }, [pendingPresetMenu]);

  useEffect(() => {
    if (pendingCampaignMenu && campaignBtnRef.current) {
      const rect = campaignBtnRef.current.getBoundingClientRect();
      setCampaignMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowCampaignMenu(true);
      setPendingCampaignMenu(false);
    }
  }, [pendingCampaignMenu]);

  useEffect(() => {
    if (pendingAdsetMenu && adsetBtnRef.current) {
      const rect = adsetBtnRef.current.getBoundingClientRect();
      setAdsetMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowAdsetMenu(true);
      setPendingAdsetMenu(false);
    }
  }, [pendingAdsetMenu]);

  // Ao fechar, limpa a posição
  useEffect(() => {
    if (!showStatusMenu) setStatusMenuPos(null);
  }, [showStatusMenu]);
  useEffect(() => {
    if (!showDateMenu) setPresetMenuPos(null);
  }, [showDateMenu]);
  useEffect(() => {
    if (!showCampaignMenu) setCampaignMenuPos(null);
  }, [showCampaignMenu]);
  useEffect(() => {
    if (!showAdsetMenu) setAdsetMenuPos(null);
  }, [showAdsetMenu]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Anúncios</h1>
            <p className="text-white/70 text-lg">Análise detalhada de anúncios individuais</p>
          </div>
          <Button 
            onClick={refreshAds} 
            disabled={loading || isFetching}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="backdrop-blur-md bg-white/10 border border-white/20 overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-blue-400" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {/* Status */}
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Status
                </label>
                <Button
                  ref={statusBtnRef}
                  onClick={openStatusMenu}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center justify-between backdrop-blur-sm relative"
                >
                  <span>{statusLabel[filters.status] || 'Todos'}</span>
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
                
                {showStatusMenu && statusMenuPos !== null && ReactDOM.createPortal(
                  <div
                    className="bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 backdrop-blur-md"
                    style={{
                      position: 'absolute',
                      top: statusMenuPos.top,
                      left: statusMenuPos.left,
                      width: statusMenuPos.width,
                      minWidth: 180,
                      zIndex: 9999
                    }}
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setFilters(prev => ({ ...prev, status: option.value })); setShowStatusMenu(false); }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              {/* Campanha */}
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Campanha
                </label>
                <Button
                  ref={campaignBtnRef}
                  onClick={openCampaignMenu}
                  disabled={campaignsLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center justify-between backdrop-blur-sm relative"
                >
                  <span className="truncate">{getCampaignLabel()}</span>
                  <ArrowUpDown className="w-4 h-4 flex-shrink-0" />
                </Button>
                
                {showCampaignMenu && campaignMenuPos !== null && ReactDOM.createPortal(
                  <div
                    className="bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 backdrop-blur-md max-h-60 overflow-y-auto"
                    style={{
                      position: 'absolute',
                      top: campaignMenuPos.top,
                      left: campaignMenuPos.left,
                      width: campaignMenuPos.width,
                      minWidth: 200,
                      zIndex: 9999
                    }}
                  >
                    <button
                      onClick={() => { setFilters(prev => ({ ...prev, campaignId: '' })); setShowCampaignMenu(false); }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg"
                    >
                      Todas as campanhas
                    </button>
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => { setFilters(prev => ({ ...prev, campaignId: campaign.id })); setShowCampaignMenu(false); }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors last:rounded-b-lg"
                      >
                        {campaign.name}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              {/* AdSet */}
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  AdSet
                </label>
                <Button
                  ref={adsetBtnRef}
                  onClick={openAdsetMenu}
                  disabled={adsetsLoading || !filters.campaignId}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center justify-between backdrop-blur-sm relative"
                >
                  <span className="truncate">{getAdsetLabel()}</span>
                  <ArrowUpDown className="w-4 h-4 flex-shrink-0" />
                </Button>
                
                {showAdsetMenu && adsetMenuPos !== null && ReactDOM.createPortal(
                  <div
                    className="bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 backdrop-blur-md max-h-60 overflow-y-auto"
                    style={{
                      position: 'absolute',
                      top: adsetMenuPos.top,
                      left: adsetMenuPos.left,
                      width: adsetMenuPos.width,
                      minWidth: 200,
                      zIndex: 9999
                    }}
                  >
                    <button
                      onClick={() => { setFilters(prev => ({ ...prev, adsetId: '' })); setShowAdsetMenu(false); }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg"
                    >
                      Todos os adsets
                    </button>
                    {adsets.map((adset) => (
                      <button
                        key={adset.id}
                        onClick={() => { setFilters(prev => ({ ...prev, adsetId: adset.id })); setShowAdsetMenu(false); }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors last:rounded-b-lg"
                      >
                        {adset.name}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              {/* Presets de Data */}
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Presets
                </label>
                <Button
                  ref={presetBtnRef}
                  onClick={openPresetMenu}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center justify-between backdrop-blur-sm relative"
                >
                  <span>{getDateLabel()}</span>
                  <Calendar className="w-4 h-4" />
                </Button>
                
                {showDateMenu && presetMenuPos !== null && ReactDOM.createPortal(
                  <div
                    className="bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 backdrop-blur-md"
                    style={{
                      position: 'absolute',
                      top: presetMenuPos.top,
                      left: presetMenuPos.left,
                      width: presetMenuPos.width,
                      minWidth: 180,
                      zIndex: 9999
                    }}
                  >
                    {datePresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyDatePreset(index)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Agregadas */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] overflow-visible">
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Total de Ads</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(metrics.totalAds)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Image className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Gasto Total</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(metrics.totalSpend)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Impressões</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(metrics.totalImpressions)}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Leads</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(metrics.totalLeads)}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-full">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ads */}
        <Card className="backdrop-blur-md bg-white/10 border border-white/20 overflow-x-auto min-h-[600px] w-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-white">Lista de Anúncios</CardTitle>
            {loading && <p className="text-sm text-white/70">Carregando...</p>}
            {error && <p className="text-sm text-red-400">Erro: {error}</p>}
            {!loading && !error && (
              <p className="text-sm text-white/70">
                {sortedAds.length} ads encontrados
              </p>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="w-full">
              <table className="w-full min-w-full divide-y divide-white/20">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Nome do Anúncio
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      ad_id
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Criativo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('campaign_name')}>
                      <div className="flex items-center gap-2">
                        Campanha
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('adset_name')}>
                      <div className="flex items-center gap-2">
                        AdSet
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('spend')}>
                      <div className="flex items-center gap-2">
                        Gasto
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('impressions')}>
                      <div className="flex items-center gap-2">
                        Impressões
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('clicks')}>
                      <div className="flex items-center gap-2">
                        Cliques
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('leads')}>
                      <div className="flex items-center gap-2">
                        Leads
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('ctr')}>
                      <div className="flex items-center gap-2">
                        CTR
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('cpc')}>
                      <div className="flex items-center gap-2">
                        CPC
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('cpm')}>
                      <div className="flex items-center gap-2">
                        CPM
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {loading ? (
                    <tr><td colSpan={12} className="text-center py-12 text-white/70">Carregando...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={12} className="text-center py-12 text-red-400">Erro: {error}</td></tr>
                  ) : sortedAds.length === 0 ? (
                    <tr><td colSpan={12} className="text-center py-12 text-white/70">Nenhum ad encontrado</td></tr>
                  ) : (
                    sortedAds.map((ad) => (
                      <tr key={ad.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {ad.name || 'Nome não disponível'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {ad.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AdCreativePreview 
                            ad={ad} 
                            onExpand={() => handleExpandCreative(ad)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {ad.campaign_name || 'Campanha não encontrada'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {ad.adset_name || 'AdSet não encontrado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatCurrency(ad.spend)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatNumber(ad.impressions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatNumber(ad.clicks)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatNumber(ad.leads)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatPercentage(ad.ctr)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatCurrency(ad.cpc)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {formatCurrency(ad.cpm)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Criativo */}
        {selectedAd && (
          <AdCreativeModal
            ad={selectedAd}
            isOpen={showModal}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </MainLayout>
  );
} 