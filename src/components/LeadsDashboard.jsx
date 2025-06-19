'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, Phone, Mail, MessageCircle, 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, 
  Eye, Edit, Trash2, Plus, BarChart3, TrendingUp,
  UserCheck, UserX, Star
} from 'lucide-react';
import { useLeadsData, useLeadActions, useLeadExport } from '../hooks/useLeadsData';
import { useAdvertiserFilter } from '../hooks/useAdvertisersData';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';
import { SectionTransition } from './ui/transitions';

export default function LeadsDashboard() {
  // Estados de filtro
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    campaign_id: 'all',
    advertiser_id: 'all',
    date_range: '30d'
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

  const trends = data?.trends || [];

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
          <p className="text-red-600 mb-4">Erro ao carregar leads: {typeof error === 'string' ? error : error?.message || 'Erro desconhecido'}</p>
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

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => (
    <motion.div
      className="bg-glass rounded-2xl shadow-glass backdrop-blur-lg p-6 flex flex-col items-center"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="mb-2 text-primary"><Icon className="h-8 w-8" /></div>
      <div className="font-bold text-primary text-[clamp(2rem,4vw,3.5rem)] leading-tight break-words">{value}</div>
      <div className="text-sublabel text-primary-text mt-1">{title}</div>
      {subtitle && <div className="text-xs text-secondary-text mt-1">{subtitle}</div>}
    </motion.div>
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
    <SectionTransition direction="up" duration={600} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-header font-bold text-white mb-2">Leads</h1>
          <p className="text-sublabel-refined text-white/70">
            Gerencie e acompanhe seus leads
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filters.date_range}
            onChange={(e) => setFilters({...filters, date_range: e.target.value})}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button
            onClick={handleExportCSV}
                          className="px-4 py-2 bg-cta text-white rounded-2xl hover:bg-cta/80 transition-colors shadow-cta-glow"
            disabled={updating}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="Total de Leads"
          value={metrics.total_leads}
          subtitle="Todos os períodos"
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Novos Leads"
          value={metrics.new_leads}
          subtitle="Aguardando contato"
          icon={Clock}
          color="primary"
        />
        <MetricCard
          title="Convertidos"
          value={metrics.converted_leads}
          subtitle={`${metrics.conversion_rate}% taxa de conversão`}
          icon={CheckCircle}
          color="primary"
        />
        <MetricCard
          title="Esta Semana"
          value={metrics.this_week}
          subtitle={`${metrics.today} hoje`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Filtros */}
      <div className="glass-card backdrop-blur-lg p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar leads por nome, email ou telefone..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="all">Todos os status</option>
                <option value="new">Novos</option>
                <option value="contacted">Contactados</option>
                <option value="qualified">Qualificados</option>
                <option value="converted">Convertidos</option>
                <option value="unqualified">Desqualificados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de tendências */}
      <div className="glass-card backdrop-blur-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-header font-semibold text-white">Tendências de Leads</h2>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sublabel-refined bg-primary text-white rounded-md">
              Novos
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              Convertidos
            </button>
            <button className="px-3 py-1 text-sublabel-refined bg-white/10 text-white rounded-md hover:bg-white/20">
              Taxa de Conversão
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {trends.length > 0 ? (
            trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-accent to-primary rounded-t-lg transition-all duration-300 hover:opacity-80"
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

      {/* Lista de Leads */}
      <div className="glass-card backdrop-blur-lg p-8">
        <h2 className="text-header font-semibold text-white mb-6">Lista de Leads</h2>
        
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-sublabel-refined text-white/70">Nenhum lead cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const statusConfig = getStatusConfig(lead.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <StatusIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sublabel-refined font-medium text-white">{lead.full_name || 'Lead sem nome'}</h3>
                      <p className="text-xs text-white/70">{lead.email || 'Email não informado'}</p>
                      {lead.phone && <p className="text-xs text-white/70">{lead.phone}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sublabel-refined font-medium text-white">
                        {formatDate(lead.created_time)}
                      </p>
                      <p className="text-xs text-white/70">Data de criação</p>
                    </div>
                    
                    {lead.campaign_name && (
                      <div className="text-right">
                        <p className="text-sublabel-refined font-medium text-white">
                          {lead.campaign_name}
                        </p>
                        <p className="text-xs text-white/70">Campanha</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowModal(true);
                      }}
                      className="p-2 text-white/70 hover:text-primary transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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
    </SectionTransition>
  );
}