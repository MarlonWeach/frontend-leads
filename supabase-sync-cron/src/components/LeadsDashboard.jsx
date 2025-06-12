'use client';

import React, { useState } from 'react';
import { 
  Users, Search, Filter, Download, Phone, Mail, MessageCircle, 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, 
  Eye, Edit, Trash2, Plus, BarChart3, TrendingUp,
  UserCheck, UserX, Star
} from 'lucide-react';
import { useLeadsData, useLeadActions, useLeadExport } from '../hooks/useLeadsData';
import { useAdvertiserFilter } from '../hooks/useAdvertisersData';

export default function LeadsDashboard() {
  // Estados de filtro
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    campaign_id: 'all',
    advertiser_id: 'all',
    date_range: '7d'
  });

  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Hooks para dados e ações
  const { data, loading, error, refetch } = useLeadsData(filters);
  const { updateLeadStatus, addInteraction, updating } = useLeadActions();
  const { exportToCSV } = useLeadExport();
  const { advertisers: advertisersForFilter } = useAdvertiserFilter();

  // Estados locais derivados dos dados
  const leads = data?.leads || [];
  const metrics = data?.metrics || {
    total_leads: 0,
    new_leads: 0,
    contacted_leads: 0,
    qualified_leads: 0,
    converted_leads: 0,
    unqualified_leads: 0,
    conversion_rate: 0,
    today: 0,
    this_week: 0
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      await refetch();
      
      if (showModal && selectedLead?.id === leadId) {
        setShowModal(false);
        setSelectedLead(null);
      }
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportToCSV(leads);
    } catch (error) {
      alert('Erro ao exportar CSV: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      new: { label: 'Novo', color: 'bg-blue-100 text-blue-800', icon: Clock },
      contacted: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
      qualified: { label: 'Qualificado', color: 'bg-green-100 text-green-800', icon: UserCheck },
      converted: { label: 'Convertido', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      unqualified: { label: 'Desqualificado', color: 'bg-red-100 text-red-800', icon: UserX }
    };
    return configs[status] || configs.new;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando leads...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Erro ao carregar leads: {error}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 bg-${color}-50 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const LeadModal = ({ lead, onClose, onUpdateStatus }) => {
    if (!lead) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalhes do Lead</h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informações de Contato</h3>
                <div className="space-y-2">
                  <p><strong>Nome:</strong> {lead.full_name}</p>
                  <p><strong>Email:</strong> {lead.email}</p>
                  <p><strong>Telefone:</strong> {lead.phone}</p>
                  <p><strong>Data:</strong> {formatDate(lead.created_time)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Campanha & Status</h3>
                <div className="space-y-2">
                  <p><strong>Campanha:</strong> {lead.campaign_name}</p>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(lead.status).color}`}>
                      {getStatusConfig(lead.status).label}
                    </span>
                  </div>
                  {lead.quality_score && (
                    <div className="flex items-center gap-1">
                      <strong>Qualidade:</strong>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < lead.quality_score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dados do formulário */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Dados do Formulário</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {lead.form_data && typeof lead.form_data === 'object' ? (
                  Object.entries(lead.form_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                      <span>{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum dado adicional</p>
                )}
              </div>
            </div>

            {/* Interações */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Histórico de Interações</h3>
              {lead.lead_interactions && lead.lead_interactions.length > 0 ? (
                <div className="space-y-2">
                  {lead.lead_interactions.map(interaction => (
                    <div key={interaction.id} className="border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{interaction.title}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(interaction.created_at)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 capitalize">{interaction.interaction_type}</span>
                      {interaction.description && (
                        <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma interação registrada</p>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onUpdateStatus(lead.id, 'contacted')}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                disabled={updating}
              >
                <Phone className="h-4 w-4" />
                Marcar como Contatado
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'qualified')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                disabled={updating}
              >
                <UserCheck className="h-4 w-4" />
                Qualificar
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'converted')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4" />
                Converter
              </button>
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Mail className="h-4 w-4" />
                Enviar Email
              </a>
              <a
                href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel de Leads</h1>
              <p className="text-gray-600">Gerencie e qualifique seus leads de campanhas</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={updating}
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total de Leads"
            value={metrics.total_leads}
            subtitle="Todos os períodos"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Novos Leads"
            value={metrics.new_leads}
            subtitle="Aguardando contato"
            icon={Clock}
            color="yellow"
          />
          <MetricCard
            title="Convertidos"
            value={metrics.converted_leads}
            subtitle={`${metrics.conversion_rate}% taxa de conversão`}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Esta Semana"
            value={metrics.this_week}
            subtitle={`${metrics.today} hoje`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="contacted">Contatados</option>
              <option value="qualified">Qualificados</option>
              <option value="converted">Convertidos</option>
              <option value="unqualified">Desqualificados</option>
            </select>

            <select
              value={filters.advertiser_id}
              onChange={(e) => setFilters({...filters, advertiser_id: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Anunciantes</option>
              {advertisersForFilter.map(advertiser => (
                <option key={advertiser.id} value={advertiser.id}>
                  {advertiser.name}
                </option>
              ))}
            </select>

            <select
              value={filters.campaign_id}
              onChange={(e) => setFilters({...filters, campaign_id: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Campanhas</option>
              {[...new Set(leads.map(l => l.campaign_id))].filter(Boolean).map(campaignId => {
                const campaignLead = leads.find(l => l.campaign_id === campaignId);
                return (
                  <option key={campaignId} value={campaignId}>
                    {campaignLead?.campaign_name || campaignId}
                  </option>
                );
              })}
            </select>

            <select
              value={filters.date_range}
              onChange={(e) => setFilters({...filters, date_range: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Leads ({leads.length})
            </h3>
          </div>
          
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum lead encontrado</p>
              <p className="text-gray-400 text-sm">Tente ajustar os filtros ou aguarde novos leads</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campanha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => {
                    const statusConfig = getStatusConfig(lead.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.full_name || 'Nome não informado'}</p>
                            <p className="text-sm text-gray-500">{lead.form_data?.cidade || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-900">{lead.email || '-'}</p>
                            <p className="text-sm text-gray-500">{lead.phone || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            {lead.quality_score && (
                              <div className="flex">
                                {[...Array(lead.quality_score)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{lead.campaign_name || lead.campaign_id || '-'}</p>
                          <p className="text-sm text-gray-500">{lead.form_data?.interest || '-'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lead.created_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-gray-600 hover:text-gray-800 p-1"
                                title="Enviar email"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 p-1"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de detalhes */}
        {showModal && selectedLead && (
          <LeadModal
            lead={selectedLead}
            onClose={() => {
              setShowModal(false);
              setSelectedLead(null);
            }}
            onUpdateStatus={handleUpdateLeadStatus}
          />
        )}
      </div>
    </div>
  );
}