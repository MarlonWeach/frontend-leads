'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users, Filter, Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Dados temporários para testar
const mockData = {
  aggregatedMetrics: {
    spend: 4591.50,
    impressions: 138000,
    clicks: 3750,
    leads: 250,
    cpm: 33.27,
    ctr: 2.72,
    cpc: 1.22,
    cpl: 18.37
  },
  trendData: [
    { date: '2025-05-20', spend: 600, impressions: 18000, clicks: 480, leads: 32 },
    { date: '2025-05-21', spend: 650, impressions: 19500, clicks: 520, leads: 35 },
    { date: '2025-05-22', spend: 700, impressions: 21000, clicks: 560, leads: 38 },
    { date: '2025-05-23', spend: 550, impressions: 16500, clicks: 440, leads: 28 },
    { date: '2025-05-24', spend: 620, impressions: 18600, clicks: 495, leads: 33 },
    { date: '2025-05-25', spend: 680, impressions: 20400, clicks: 540, leads: 36 },
    { date: '2025-05-26', spend: 640, impressions: 19200, clicks: 510, leads: 34 }
  ],
  campaignComparison: [
    { name: 'Test Drive A', spend: 1500, leads: 85, cpl: 17.65 },
    { name: 'Lead Gen B', spend: 2200, leads: 120, cpl: 18.33 },
    { name: 'Retargeting C', spend: 891, leads: 45, cpl: 19.80 }
  ]
};

export default function PerformanceDashboard() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7d'
  });
  const [selectedMetric, setSelectedMetric] = useState('spend');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleExport = () => {
    alert('Exportação iniciada! (funcionalidade em desenvolvimento)');
  };

  const MetricCard = ({ title, value, icon: Icon, trend, format = 'number' }) => {
    const formattedValue = format === 'currency' ? formatCurrency(value) :
                          format === 'percentage' ? `${value.toFixed(2)}%` :
                          formatNumber(Math.round(value));

    return (
      <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200 h-32">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-lg font-bold text-gray-900">{formattedValue}</p>
          </div>
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-2">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={`text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs anterior</span>
          </div>
        )}
      </div>
    );
  };

  const spendDistribution = mockData.campaignComparison.map(campaign => ({
    name: campaign.name,
    value: campaign.spend
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Performance</h1>
          <p className="text-gray-600">Acompanhe o desempenho das suas campanhas de Lead Ads</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PAUSED">Pausadas</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            <button 
              onClick={handleExport}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* CARDS LADO A LADO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Gasto Total"
            value={mockData.aggregatedMetrics.spend}
            icon={DollarSign}
            format="currency"
            trend={5.2}
          />
          <MetricCard
            title="Impressões"
            value={mockData.aggregatedMetrics.impressions}
            icon={Eye}
            trend={-2.1}
          />
          <MetricCard
            title="Cliques"
            value={mockData.aggregatedMetrics.clicks}
            icon={MousePointer}
            trend={8.7}
          />
          <MetricCard
            title="Leads"
            value={mockData.aggregatedMetrics.leads}
            icon={Users}
            trend={12.3}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="CPM"
            value={mockData.aggregatedMetrics.cpm}
            icon={Eye}
            format="currency"
            trend={-1.5}
          />
          <MetricCard
            title="CTR"
            value={mockData.aggregatedMetrics.ctr}
            icon={MousePointer}
            format="percentage"
            trend={3.2}
          />
          <MetricCard
            title="CPC"
            value={mockData.aggregatedMetrics.cpc}
            icon={DollarSign}
            format="currency"
            trend={-4.1}
          />
          <MetricCard
            title="Custo por Lead"
            value={mockData.aggregatedMetrics.cpl}
            icon={Users}
            format="currency"
            trend={-6.8}
          />
        </div>

        {/* Resto dos gráficos... */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tendência de Performance</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="spend">Gasto</option>
                <option value="impressions">Impressões</option>
                <option value="clicks">Cliques</option>
                <option value="leads">Leads</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                  formatter={(value, name) => [
                    selectedMetric === 'spend' ? formatCurrency(value) : formatNumber(value),
                    selectedMetric === 'spend' ? 'Gasto' :
                    selectedMetric === 'impressions' ? 'Impressões' :
                    selectedMetric === 'clicks' ? 'Cliques' : 'Leads'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Gastos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {spendDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Campanha</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={mockData.campaignComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'spend' ? formatCurrency(value) :
                  name === 'cpl' ? formatCurrency(value) :
                  formatNumber(value),
                  name === 'spend' ? 'Gasto' :
                  name === 'leads' ? 'Leads' : 'Custo por Lead'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="spend" fill="#0088FE" name="Gasto" />
              <Bar yAxisId="right" dataKey="leads" fill="#00C49F" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
