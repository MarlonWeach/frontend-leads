'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, MousePointer, Calendar } from 'lucide-react';
import LineChartAnimated from './ui/AnimatedBarChart';
import { Card } from './ui/card';
import FilterContainer from './filters/FilterContainer';

// Função para abreviar números
function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(num).toLocaleString('pt-BR');
}

// Função para formatar moeda
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

// Função para formatar porcentagem
function formatPercentage(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((value || 0) / 100);
}

const PerformanceDashboard = ({ data }) => {
  const [dateRange, setDateRange] = useState('7d');

  // Calcular métricas agregadas dos dados do gráfico
  const aggregatedMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalLeads: 0,
        ctr: 0,
        conversionRate: 0,
        cpc: 0,
        cpm: 0
      };
    }

    const totals = data.reduce((acc, item) => ({
      spend: acc.spend + (Number(item.spend) || 0),
      impressions: acc.impressions + (Number(item.impressions) || 0),
      clicks: acc.clicks + (Number(item.clicks) || 0),
      leads: acc.leads + (Number(item.leads) || 0)
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

    return {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalLeads: totals.leads,
      ctr,
      conversionRate,
      cpc,
      cpm
    };
  }, [data]);

  return (
    <div className="p-6 space-y-8">
      {/* Header com filtro de período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-header font-bold text-white mb-2">Performance</h1>
          <p className="text-sublabel-refined text-white/70">Análise detalhada de performance e métricas</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filtros avançados */}
          <FilterContainer onFiltersChange={(filters) => {
            console.log('Filtros aplicados:', filters);
            // Aqui você integraria com a lógica de dados
          }} />
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 glass-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-lg border-0"
          >
            <option value="7d" className="bg-gray-800">Últimos 7 dias</option>
            <option value="30d" className="bg-gray-800">Últimos 30 dias</option>
            <option value="90d" className="bg-gray-800">Últimos 90 dias</option>
          </select>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center gap-2 shadow-primary-glow">
            <Calendar className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Investimento Total */}
        <Card className="p-6 interactive" interactive>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-white/70 mb-2">Investimento Total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(aggregatedMetrics.totalSpend)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex items-center text-xs text-white/60">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span>+12.5% vs período anterior</span>
          </div>
        </Card>

        {/* Impressões */}
        <Card className="p-6 interactive" interactive>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-white/70 mb-2">Impressões</p>
              <p className="text-2xl font-bold text-white">
                {formatNumberShort(aggregatedMetrics.totalImpressions)}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center text-xs text-white/60">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span>+8.2% vs período anterior</span>
          </div>
        </Card>

        {/* Cliques */}
        <Card className="p-6 interactive" interactive>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-white/70 mb-2">Cliques</p>
              <p className="text-2xl font-bold text-white">
                {formatNumberShort(aggregatedMetrics.totalClicks)}
              </p>
            </div>
            <MousePointer className="h-8 w-8 text-orange-500" />
          </div>
          <div className="flex items-center text-xs text-white/60">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span>CTR: {formatPercentage(aggregatedMetrics.ctr)}</span>
          </div>
        </Card>

        {/* Leads */}
        <Card className="p-6 interactive" interactive>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sublabel-refined text-white/70 mb-2">Leads Gerados</p>
              <p className="text-2xl font-bold text-white">
                {formatNumberShort(aggregatedMetrics.totalLeads)}
              </p>
            </div>
            <Users className="h-8 w-8 text-pink-500" />
          </div>
          <div className="flex items-center text-xs text-white/60">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            <span>+15.3% vs período anterior</span>
          </div>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 interactive" interactive>
          <div className="text-center">
            <p className="text-sublabel-refined text-white/70 mb-3">CPC (Custo por Clique)</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(aggregatedMetrics.cpc)}
            </p>
            <div className="flex items-center justify-center text-xs text-white/60 mt-2">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              <span>-5.2% vs período anterior</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 interactive" interactive>
          <div className="text-center">
            <p className="text-sublabel-refined text-white/70 mb-3">CPM (Custo por Mil)</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(aggregatedMetrics.cpm)}
            </p>
            <div className="flex items-center justify-center text-xs text-white/60 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-orange-500" />
              <span>+3.1% vs período anterior</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 interactive" interactive>
          <div className="text-center">
            <p className="text-sublabel-refined text-white/70 mb-3">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-white">
              {formatPercentage(aggregatedMetrics.conversionRate)}
            </p>
            <div className="flex items-center justify-center text-xs text-white/60 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>+2.8% vs período anterior</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de performance */}
      <Card className="p-6">
        <h3 className="text-header font-semibold text-white mb-6">Tendências de Performance (Últimos 7 dias)</h3>
        <LineChartAnimated 
          data={data} 
          width={800} 
          height={400} 
          title=""
        />
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
