'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SectionTransition } from '../src/components/ui/transitions';
import { BarChart3, Info, Eye, MousePointer, DollarSign, AlertCircle, Clock, RefreshCw, Brain } from 'lucide-react';
import { Tooltip } from '../src/components/Tooltip';
import { Card } from '../src/components/ui/card';
import MainLayout from '../src/components/MainLayout';
import { useCampaignsData } from '../src/hooks/useCampaignsData';
import IndividualAnalysis from '../src/components/ai/IndividualAnalysis';

const periodOptions = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' }
];

export default function CampaignsPageWrapper() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CampaignsPage />
    </Suspense>
  );
}

function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('active');
  
  // Estado para análise individual
  const [analysisItem, setAnalysisItem] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const applyDateFilter = useCallback((period) => {
    // Usar timezone brasileiro (UTC-3) para cálculos corretos
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case '7d':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // Últimos 7 dias incluindo hoje
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case '30d':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29); // Últimos 30 dias incluindo hoje
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      default:
        // Default para últimos 7 dias
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }

    // Converter para UTC para a Meta API
    const startUTC = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
    const endUTC = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));

    console.log('🗓️ Período selecionado:', period);
    console.log('🗓️ Data local início:', startDate.toLocaleString('pt-BR'));
    console.log('🗓️ Data local fim:', endDate.toLocaleString('pt-BR'));
    console.log('🗓️ Data UTC início:', startUTC.toISOString());
    console.log('🗓️ Data UTC fim:', endUTC.toISOString());

    setDateFrom(startUTC.toISOString());
    setDateTo(endUTC.toISOString());
  }, []);

  useEffect(() => {
    const period = searchParams.get('period') || '7d';
    setSelectedPeriod(period);
    applyDateFilter(period);
  }, [searchParams, applyDateFilter]);

  const handleFilterClick = useCallback((preset) => {
    setSelectedPeriod(preset);
    router.push(`/campaigns?period=${preset}`);
    applyDateFilter(preset);
  }, [router, applyDateFilter]);

  // Função para abrir análise individual
  const handleAnalysisClick = (campaign) => {
    setAnalysisItem({
      id: campaign.id,
      name: campaign.name,
      type: 'campaign',
      data: campaign
    });
    setIsAnalysisOpen(true);
  };

  // Usar o novo hook para buscar dados da Meta API
  const { campaigns: allCampaigns, loading, error, lastUpdate, refetch } = useCampaignsData(dateFrom, dateTo);

  // Aplicar filtro de status
  const campaigns = statusFilter === 'active' 
    ? allCampaigns.filter(campaign => campaign.is_active)
    : allCampaigns;

  // Ordenar campanhas por investimento (do maior para o menor)
  const sortedCampaigns = [...campaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0));

  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
  };

  const formatNumberShort = (num) => {
    if (num === null || num === undefined) return '';
    if (typeof num === 'string') num = Number(num.toString().replace(/\D/g, ''));
    if (isNaN(num)) return '';
    if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString('pt-BR');
  };

  // Estados de loading e erro melhorados
  if (loading) {
    return (
      <MainLayout title="Campanhas" breadcrumbs={[{ name: 'Campanhas', href: '/campaigns' }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sublabel-refined text-white">Carregando campanhas da Meta API...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Campanhas" breadcrumbs={[{ name: 'Campanhas', href: '/campaigns' }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="text-header text-white mb-2">Erro ao carregar campanhas</h2>
            <p className="text-sublabel-refined text-white/70 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/80 transition-colors"
            >
              Tentar novamente
            </button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Campanhas" breadcrumbs={[{ name: 'Campanhas', href: '/campaigns' }]}> 
      <SectionTransition direction="up" duration={600} className="space-y-8">
        {/* Filtros de período e status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterClick(opt.value)}
                  className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-colors shadow-glass backdrop-blur-lg
                    ${selectedPeriod === opt.value
                      ? 'bg-primary text-white'
                      : 'glass-card text-white hover:bg-white/10'}
                  `}
                  data-testid={`period-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Separador */}
            <div className="h-6 w-px bg-white/20"></div>
            
            {/* Filtro de Status */}
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-all duration-200 backdrop-blur-lg
                  ${statusFilter === 'active'
                    ? 'bg-accent text-white shadow-accent-glow'
                    : 'glass-card text-white/80 hover:glass-medium'}
                `}
                data-testid="filter-campaigns-active"
              >
                Apenas Ativas
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-2xl text-sublabel-refined font-medium transition-all duration-200 backdrop-blur-lg
                  ${statusFilter === 'all'
                    ? 'bg-accent text-white shadow-accent-glow'
                    : 'glass-card text-white/80 hover:glass-medium'}
                `}
                data-testid="filter-campaigns-all"
              >
                Todas
              </button>
            </div>
            
            <div className="text-sublabel-refined text-white glass-card px-3 py-2 rounded-2xl shadow-glass backdrop-blur-lg">
              <span className="font-medium text-white">Período:</span> <span className="text-white">Últimos {periodOptions.find(p => p.value === selectedPeriod)?.label}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => refetch()}
              className="glass-card p-2 rounded-2xl hover:glass-medium transition-all duration-200"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </button>
            <div className="text-sublabel-refined text-white/70 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Nunca'}
            </div>
          </div>
        </div>

        {/* Contador e título */}
        <div className="flex items-center justify-between">
          <h3 className="text-header font-bold text-primary-text">
            Campanhas da Meta API
            <span className="ml-2 text-sublabel-refined text-accent">
              ({campaigns.length} {statusFilter === 'active' ? 'ativa' + (campaigns.length !== 1 ? 's' : '') : 'total'})
            </span>
          </h3>
          {campaigns.length === 0 && (
            <span className="text-sublabel-refined text-white/60">
              {statusFilter === 'active' ? 'Nenhuma campanha ativa encontrada' : 'Nenhuma campanha encontrada'}
            </span>
          )}
        </div>

        {/* Grid de cards de campanhas com design system */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] auto-rows-fr">
          {sortedCampaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              className="glass-card card-metric cursor-pointer relative group"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              data-testid={`campaign-${campaign.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {/* Botão de análise de IA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalysisClick(campaign);
                }}
                className="absolute top-2 right-2 p-2 bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-900/40 hover:border-blue-500/40 hover:scale-110 z-10"
                title="Análise de IA"
              >
                <Brain className="w-4 h-4" />
              </button>
              
              <div className="card-metric-content">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-metric-label text-primary-text truncate flex-1">
                    {campaign.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${campaign.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-xs text-white/60">
                      {campaign.effective_status}
                    </span>
                  </div>
                </div>
                
                <span className="text-metric-value text-primary">
                  {formatNumber(campaign.leads)} leads
                </span>
                
                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  <div className="text-metric-subinfo text-secondary-text">
                    Investimento:<br/>
                    <span className="text-accent font-semibold">{formatCurrency(campaign.spend)}</span>
                  </div>
                  <div className="text-metric-subinfo text-secondary-text">
                    CPL:<br/>
                    <span className="text-accent font-semibold">{formatCurrency(campaign.cpl)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                  <div className="text-metric-subinfo text-secondary-text text-center">
                    <Eye className="h-3 w-3 inline mr-1" />
                    {formatNumberShort(campaign.impressions)}
                  </div>
                  <div className="text-metric-subinfo text-secondary-text text-center">
                    <MousePointer className="h-3 w-3 inline mr-1" />
                    {formatNumberShort(campaign.clicks)}
                  </div>
                  <div className="text-metric-subinfo text-secondary-text text-center">
                    CTR: {campaign.ctr.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="card-metric-icon">
                <BarChart3 className="h-7 w-7 text-primary" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Estatísticas resumidas */}
        {campaigns.length > 0 && (
          <Card className="p-6 mt-8">
            <h4 className="text-header font-semibold text-white mb-4">Resumo do Período</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-metric-value text-primary">
                  {formatNumber(campaigns.reduce((sum, c) => sum + c.leads, 0))}
                </div>
                <div className="text-metric-label text-white/70">Total de Leads</div>
              </div>
              <div className="text-center">
                <div className="text-metric-value text-accent">
                  {formatCurrency(campaigns.reduce((sum, c) => sum + c.spend, 0))}
                </div>
                <div className="text-metric-label text-white/70">Investimento Total</div>
              </div>
              <div className="text-center">
                <div className="text-metric-value text-primary">
                  {formatNumberShort(campaigns.reduce((sum, c) => sum + c.impressions, 0))}
                </div>
                <div className="text-metric-label text-white/70">Impressões</div>
              </div>
              <div className="text-center">
                <div className="text-metric-value text-primary">
                  {formatNumberShort(campaigns.reduce((sum, c) => sum + c.clicks, 0))}
                </div>
                <div className="text-metric-label text-white/70">Cliques</div>
              </div>
            </div>
          </Card>
        )}
      </SectionTransition>

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
            startDate: dateFrom,
            endDate: dateTo
          }}
        />
      )}
    </MainLayout>
  );
} 