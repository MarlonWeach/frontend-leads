'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, MousePointer, BarChart3, Calendar, Download } from 'lucide-react';
import { usePerformanceData } from '../hooks/usePerformanceData';
import { Tooltip } from './Tooltip';

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card backdrop-blur-lg p-8 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-white/30 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, refetch }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <TrendingDown className="h-12 w-12 text-electric" />
      <h2 className="text-header text-white">Erro ao carregar performance</h2>
      <p className="text-sublabel-refined text-glow">{error?.message || 'Erro ao carregar dados de performance'}</p>
      <button
        onClick={() => refetch()}
        className="px-6 py-3 bg-electric text-background rounded-2xl hover:bg-violet transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export default function PerformanceDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const { data, isLoading, error, refetch } = usePerformanceData(dateRange);

  if (error) {
    return <ErrorState error={error} refetch={refetch} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const performance = data?.performance || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    conversionRate: 0
  };

  const trends = data?.trends || [];
  const topCampaigns = data?.topCampaigns || [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((value || 0) / 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-header font-bold text-violet mb-2">Performance</h1>
          <p className="text-sublabel-refined text-white/80">
            Análise detalhada de performance e métricas
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-violet/40 rounded-2xl text-violet focus:outline-none focus:ring-2 focus:ring-violet"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button className="px-4 py-2 bg-violet text-background rounded-2xl hover:bg-electric transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Investimento Total</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatCurrency(performance.spend)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-violet" />
          </div>
          <div className="flex items-center text-xs text-white/80">
            <TrendingUp className="h-3 w-3 mr-1 text-electric" />
            <span>+12.5% vs período anterior</span>
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Impressões</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(performance.impressions)}</p>
            </div>
            <Eye className="h-8 w-8 text-violet" />
          </div>
          <div className="flex items-center text-xs text-white/80">
            <TrendingUp className="h-3 w-3 mr-1 text-electric" />
            <span>+8.2% vs período anterior</span>
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Cliques</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(performance.clicks)}</p>
            </div>
            <MousePointer className="h-8 w-8 text-violet" />
          </div>
          <div className="flex items-center text-xs text-white/80">
            <TrendingUp className="h-3 w-3 mr-1 text-electric" />
            <span>CTR: {formatPercentage(performance.ctr)}</span>
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-violet mb-3">Leads Gerados</p>
              <p className="font-bold text-violet text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{formatNumber(performance.leads)}</p>
            </div>
            <Users className="h-8 w-8 text-violet" />
          </div>
          <div className="flex items-center text-xs text-white/80">
            <TrendingUp className="h-3 w-3 mr-1 text-electric" />
            <span>Conversão: {formatPercentage(performance.conversionRate)}</span>
          </div>
        </div>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card backdrop-blur-lg p-8">
          <div className="text-center">
            <p className="text-sublabel-refined text-glow mb-3">CPC (Custo por Clique)</p>
            <p className="text-header font-bold text-white">{formatCurrency(performance.cpc)}</p>
            <div className="flex items-center justify-center text-xs text-white/70 mt-2">
              <TrendingDown className="h-3 w-3 mr-1 text-violet" />
              <span>-5.2% vs período anterior</span>
            </div>
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="text-center">
            <p className="text-sublabel-refined text-glow mb-3">CPM (Custo por Mil)</p>
            <p className="text-header font-bold text-white">{formatCurrency(performance.cpm)}</p>
            <div className="flex items-center justify-center text-xs text-white/70 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-electric" />
              <span>+3.1% vs período anterior</span>
            </div>
          </div>
        </div>

        <div className="glass-card backdrop-blur-lg p-8">
          <div className="text-center">
            <p className="text-sublabel-refined text-glow mb-3">Taxa de Conversão</p>
            <p className="text-header font-bold text-white">{formatPercentage(performance.conversionRate)}</p>
            <div className="flex items-center justify-center text-xs text-white/70 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-electric" />
              <span>+2.8% vs período anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de tendências */}
      <div className="glass-card backdrop-blur-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-header font-semibold text-white">Tendências de Performance</h2>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sublabel-refined bg-electric text-background rounded-md">
              Investimento
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              Impressões
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              Cliques
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {trends.length > 0 ? (
            trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-electric to-violet rounded-t-lg transition-all duration-300 hover:opacity-80"
                  style={{ height: `${(trend.value / Math.max(...trends.map(t => t.value))) * 200}px` }}
                ></div>
                <p className="text-xs text-white/70 mt-2">{trend.date}</p>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sublabel-refined text-white/50">Dados de tendência não disponíveis</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Campanhas */}
      <div className="glass-card backdrop-blur-lg p-8">
        <h2 className="text-header font-semibold text-white mb-6">Top Campanhas</h2>
        
        {topCampaigns.length > 0 ? (
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-electric/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-electric">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-sublabel-refined font-medium text-white">{campaign.name}</h3>
                    <p className="text-xs text-white/70">ID: {campaign.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sublabel-refined font-medium text-white">
                      {formatCurrency(campaign.spend)}
                    </p>
                    <p className="text-xs text-white/70">Investimento</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sublabel-refined font-medium text-white">
                      {formatNumber(campaign.leads)}
                    </p>
                    <p className="text-xs text-white/70">Leads</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sublabel-refined font-medium text-white">
                      {formatPercentage(campaign.conversionRate)}
                    </p>
                    <p className="text-xs text-white/70">Conversão</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'ACTIVE'
                        ? 'bg-electric/20 text-electric'
                        : 'bg-violet/20 text-violet'
                    }`}>
                      {campaign.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-sublabel-refined text-white/70">
              Nenhuma campanha encontrada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
