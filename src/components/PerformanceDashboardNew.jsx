'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users, Filter, Download, Calendar, AlertCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Dados simulados baseados em campanhas reais
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
    { name: 'Test Drive Campanha A', spend: 1500.50, leads: 85, impressions: 45000, clicks: 1200, cpl: 17.65 },
    { name: 'Lead Gen Campanha B', spend: 2200.75, leads: 120, impressions: 65000, clicks: 1800, cpl: 18.33 },
    { name: 'Retargeting Campanha C', spend: 890.25, leads: 45, impressions: 28000, clicks: 750, cpl: 19.78 }
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
    // Simular geração de CSV
    const csvData = mockData.campaignComparison.map(campaign => ({
      'Campanha': campaign.name,
      'Gasto': campaign.spend.toFixed(2),
      'Leads': campaign.leads,
      'Impressões': campaign.impressions,
      'Cliques': campaign.clicks,
      'CPL': campaign.cpl.toFixed(2)
    }));
    
    const csvContent = [
      Object.keys(csvData[0]),
      ...csvData.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MetricCard = ({ title, value, icon: Icon, trend, format = 'number', isAlert = false }) => {
    const formattedValue = format === 'currency' ? formatCurrency(value) :
                          format === 'percentage' ? `${value.toFixed(2)}%` :
                          formatNumber(Math.round(value));

    return (
      <div className={`bg-white rounded-lg shadow-md p-4 border transition-all duration-200 hover:shadow-lg ${isAlert ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs font-medium text-gray-600">{title}</p>
              {isAlert && <AlertCircle className="h-3 w-3 text-orange-500" />}
            </div>
            <p className="text-lg font-bold text-gray-900 leading-tight">{formattedValue}</p>
          </div>
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center">
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
    name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
    value: campaign.spend
  }));

  // Alertas automáticos baseados em performance
  const alerts = [
    ...(mockData.aggregatedMetrics.cpl > 15 ? ['CPL acima da meta (>R$15)'] : []),
    ...(mockData.aggregatedMetrics.ctr < 2 ? ['CTR baixo (<2%)'] : []),
    ...(mockData.campaignComparison.some(c => c.cpl > 20) ? ['Algumas campanhas com CPL muito alto'] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Performance</h1>
              <p className="text-gray-600">Acompanhe o desempenho das suas campanhas de Lead Ads</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-sm font-medium text-gray-900">Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Alertas de Performance</h3>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index}>• {alert}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PAUSED">Pausadas</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">20/05 - 26/05/2025</span>
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
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

        {/* Cards de Métricas Secundárias */}
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
            isAlert={mockData.aggregatedMetrics.ctr < 2}
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
            isAlert={mockData.aggregatedMetrics.cpl > 15}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Tendência */}
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
                  formatter={(value) => [
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

          {/* Distribuição de Gastos */}
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

        {/* Tabela de Performance por Campanha */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Campanha</h3>
          
          {/* Gráfico de Barras */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={mockData.campaignComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tickFormatter={(name) => name.length > 15 ? name.substring(0, 15) + '...' : name}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'spend' ? formatCurrency(value) :
                    name === 'cpl' ? formatCurrency(value) :
                    formatNumber(value),
                    name === 'spend' ? 'Gasto' :
                    name === 'leads' ? 'Leads' : 'CPL'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="spend" fill="#0088FE" name="Gasto" />
                <Bar yAxisId="right" dataKey="leads" fill="#00C49F" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela Detalhada */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Campanha</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Gasto</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Impressões</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cliques</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Leads</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">CPL</th>
                </tr>
              </thead>
              <tbody>
                {mockData.campaignComparison.map((campaign, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{campaign.name}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(campaign.spend)}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(campaign.impressions)}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(campaign.clicks)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">{campaign.leads}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${campaign.cpl > 20 ? 'text-red-600' : campaign.cpl < 15 ? 'text-green-600' : 'text-gray-900'}`}>
                      {formatCurrency(campaign.cpl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}