'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdsData } from '../../src/hooks/useAdsData';
import { useCampaignsList } from '../../src/hooks/useCampaignsList';
import { useAdsetsList } from '../../src/hooks/useAdsetsList';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import Button from '../../src/components/ui/button';
import { ArrowUpDown, Filter, RefreshCw, Image, Video, FileText, Eye, MousePointer, DollarSign, TrendingUp, Calendar, Brain } from 'lucide-react';
import MainLayout from '../../src/components/MainLayout';
import AdCreativePreview from '../../src/components/ui/AdCreativePreview';
import AdCreativeModal from '../../src/components/ui/AdCreativeModal';
import IndividualAnalysis from '../../src/components/ai/IndividualAnalysis';
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
  
  // Estado para análise individual
  const [analysisItem, setAnalysisItem] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

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

  // Função para abrir análise individual
  const handleAnalysisClick = (ad) => {
    setAnalysisItem({
      id: ad.id,
      name: ad.name,
      type: 'ad',
      data: ad
    });
    setIsAnalysisOpen(true);
  };

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

  // Funções para abrir menus
  const openStatusMenu = () => {
    setShowDateMenu(false);
    setShowCampaignMenu(false);
    setShowAdsetMenu(false);
  };

  const openPresetMenu = () => {
    setShowDateMenu(!showDateMenu);
    setShowCampaignMenu(false);
    setShowAdsetMenu(false);
  };

  const openCampaignMenu = () => {
    setShowDateMenu(false);
    setShowCampaignMenu(!showCampaignMenu);
    setShowAdsetMenu(false);
  };

  const openAdsetMenu = () => {
    setShowDateMenu(false);
    setShowCampaignMenu(false);
    setShowAdsetMenu(!showAdsetMenu);
  };

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setShowDateMenu(false);
      }
      if (campaignMenuRef.current && !campaignMenuRef.current.contains(event.target)) {
        setShowCampaignMenu(false);
      }
      if (adsetMenuRef.current && !adsetMenuRef.current.contains(event.target)) {
        setShowAdsetMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (error) {
    return (
      <MainLayout title="Anúncios" breadcrumbs={[{ name: 'Anúncios', href: '/ads' }]}>
        <div className="text-center py-8">
          <div className="text-red-400 text-lg font-medium mb-4">{error}</div>
          <Button onClick={() => refreshAds()}>
            Tentar novamente
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Anúncios" breadcrumbs={[{ name: 'Anúncios', href: '/ads' }]}>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-header text-white mb-2">Anúncios</h1>
          <p className="text-sublabel-refined text-white/70">Gerencie e analise seus anúncios</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro de Status */}
          <div className="relative">
            <Button
              onClick={openStatusMenu}
              className="flex items-center gap-2 glass-medium"
            >
              <Filter className="w-4 h-4" />
              Status: {filters.status || 'Todos'}
            </Button>
            {showDateMenu && (
              <div className="absolute z-50 mt-2 bg-white/95 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
                <div className="p-2">
                  {['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'].map((status) => (
                    <button
                      key={status}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        filters.status === status ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-100'
                      }`}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status }));
                        setShowDateMenu(false);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtro de Data */}
          <div className="relative" ref={dateMenuRef}>
            <Button
              onClick={openPresetMenu}
              className="flex items-center gap-2 glass-medium"
            >
              <Calendar className="w-4 h-4" />
              {getDateLabel()}
            </Button>
            {showDateMenu && (
              <div className="absolute z-50 mt-2 bg-white/95 rounded-lg shadow-lg border border-gray-200 min-w-[300px]">
                <div className="p-2">
                  {datePresets.map((preset, index) => (
                    <button
                      key={preset.label}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedPreset === index ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-100'
                      }`}
                      onClick={() => applyDatePreset(index)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtro de Campanha */}
          <div className="relative" ref={campaignMenuRef}>
            <Button
              onClick={openCampaignMenu}
              className="flex items-center gap-2 glass-medium"
              disabled={campaignsLoading}
            >
              <Filter className="w-4 h-4" />
              {getCampaignLabel()}
            </Button>
            {showCampaignMenu && (
              <div className="absolute z-50 mt-2 bg-white/95 rounded-lg shadow-lg border border-gray-200 min-w-[300px] max-h-[400px] overflow-y-auto">
                <div className="p-2">
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-800 hover:bg-blue-100"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, campaignId: '' }));
                      setShowCampaignMenu(false);
                    }}
                  >
                    Todas as campanhas
                  </button>
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        filters.campaignId === campaign.id ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-100'
                      }`}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, campaignId: campaign.id }));
                        setShowCampaignMenu(false);
                      }}
                    >
                      {campaign.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtro de AdSet */}
          <div className="relative" ref={adsetMenuRef}>
            <Button
              onClick={openAdsetMenu}
              className="flex items-center gap-2 glass-medium"
              disabled={adsetsLoading || !filters.campaignId}
            >
              <Filter className="w-4 h-4" />
              {getAdsetLabel()}
            </Button>
            {showAdsetMenu && (
              <div className="absolute z-50 mt-2 bg-white/95 rounded-lg shadow-lg border border-gray-200 min-w-[300px] max-h-[400px] overflow-y-auto">
                <div className="p-2">
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-800 hover:bg-blue-100"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, adsetId: '' }));
                      setShowAdsetMenu(false);
                    }}
                  >
                    Todos os adsets
                  </button>
                  {adsets.map((adset) => (
                    <button
                      key={adset.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        filters.adsetId === adset.id ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-blue-100'
                      }`}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, adsetId: adset.id }));
                        setShowAdsetMenu(false);
                      }}
                    >
                      {adset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botão de Atualizar */}
          <Button
            onClick={() => refreshAds()}
            disabled={loading || isFetching}
            className="flex items-center gap-2 glass-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      IA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {loading ? (
                    <tr><td colSpan={13} className="text-center py-12 text-white/70">Carregando...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={13} className="text-center py-12 text-red-400">Erro: {error}</td></tr>
                  ) : sortedAds.length === 0 ? (
                    <tr><td colSpan={13} className="text-center py-12 text-white/70">Nenhum ad encontrado</td></tr>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleAnalysisClick(ad)}
                            className="p-1 bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded hover:bg-blue-900/40 hover:border-blue-500/40 transition-all duration-200"
                            title="Análise de IA"
                          >
                            <Brain className="w-3 h-3" />
                          </button>
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
      </div>
    </MainLayout>
  );
} 