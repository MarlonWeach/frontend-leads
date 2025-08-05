'use client';

// Component: AdsetGoalCard.tsx
// PBI 25 - Task 25-11: Melhorar Interface do Dashboard de Metas

import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users,
  Settings,
  Play,
  Pause,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AdsetGoalDashboardItem } from '../../types/adsetGoalsDashboard';
import GoalStatusBadge from './GoalStatusBadge';
import GoalProgressBar from './GoalProgressBar';
import AlertIndicator, { useAlertSummary } from '../alerts/AlertIndicator';
import { useAdsetActions } from '../../hooks/useAdsetActions';
import { useState as useStateReact } from 'react';

// Modal simples para ajuste de budget
interface BudgetAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newBudget: number, reason: string) => void;
  currentBudget: number;
  loading: boolean;
}

function BudgetAdjustModal({ isOpen, onClose, onConfirm, currentBudget, loading }: BudgetAdjustModalProps) {
  const [newBudget, setNewBudget] = useState(currentBudget);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBudget > 0 && reason.trim()) {
      onConfirm(newBudget, reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-strong border border-white/20 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Ajustar Budget</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Novo Budget Diário
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={newBudget}
                onChange={(e) => setNewBudget(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 glass-light text-white placeholder-white/50 rounded-lg border border-white/10 focus:border-primary focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-white/60 mt-1">
              Budget atual: R$ {currentBudget.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Motivo do Ajuste
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 glass-light text-white placeholder-white/50 rounded-lg border border-white/10 focus:border-primary focus:outline-none"
              placeholder="Ex: Aumentar entrega para atingir meta"
              rows={3}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 glass-medium text-white/80 rounded-lg hover:text-white transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading || newBudget <= 0 || !reason.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para cadastro de meta
interface MetaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meta: any) => void;
}

// Função utilitária para salvar meta via API
async function saveAdsetGoal(adset_id: string, meta: any, isEdit: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    let res;
    if (isEdit) {
      res = await fetch(`/api/goals/${adset_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta)
      });
    } else {
      // Criação: precisa incluir adset_id no payload
      res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, adset_id })
      });
    }
    const data = await res.json();
    if (res.ok && !data.error) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Erro desconhecido' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido' };
  }
}

function MetaConfigModal({ isOpen, onClose, onSave, adsetId, isEdit, goal }: MetaConfigModalProps & { adsetId: string, isEdit: boolean, goal?: any }) {
  const [budget, setBudget] = useState<number | ''>('');
  const [cpl, setCpl] = useState<number | ''>('');
  const [volume, setVolume] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useStateReact(false);
  const [error, setError] = useStateReact<string | null>(null);
  const [success, setSuccess] = useStateReact(false);

  // Preencher campos ao abrir para edição
  React.useEffect(() => {
    if (isOpen && isEdit && goal) {
      setBudget(goal.budget_total || '');
      setCpl(goal.cpl_target || '');
      setVolume(goal.volume_contracted || '');
      setStartDate(goal.contract_start_date || '');
      setEndDate(goal.contract_end_date || '');
    } else if (isOpen && !isEdit) {
      setBudget('');
      setCpl('');
      setVolume('');
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen, isEdit, goal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (budget && cpl && volume && startDate && endDate) {
      setLoading(true);
      const meta = {
        budget_total: Number(budget),
        cpl_target: Number(cpl),
        volume_contracted: Number(volume),
        contract_start_date: startDate,
        contract_end_date: endDate
      };
      const result = await saveAdsetGoal(adsetId, meta, isEdit);
      setLoading(false);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSave(meta);
        }, 800);
      } else {
        setError(result.error || 'Erro ao salvar meta');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-strong border border-white/20 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Configurar Meta</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Budget Total (R$)</label>
            <input type="number" min="1" step="0.01" value={budget} onChange={e => setBudget(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 glass-light text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">CPL Alvo (R$)</label>
            <input type="number" min="1" step="0.01" value={cpl} onChange={e => setCpl(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 glass-light text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Volume Contratado (leads)</label>
            <input type="number" min="1" step="1" value={volume} onChange={e => setVolume(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 glass-light text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none" required />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/80 mb-1">Início</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 glass-light text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none" required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/80 mb-1">Fim</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 glass-light text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none" required />
            </div>
          </div>
          {error && <div className="text-red-400 text-xs font-semibold mt-2">{error}</div>}
          {success && <div className="text-green-400 text-xs font-semibold mt-2">Meta salva com sucesso!</div>}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 glass-medium text-white/80 rounded-lg hover:text-white transition-colors" disabled={loading}>Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50" disabled={!budget || !cpl || !volume || !startDate || !endDate || loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdsetGoalCard({ 
  item, 
  onEdit, 
  onViewDetails 
}: { item: AdsetGoalDashboardItem, onEdit?: (item: AdsetGoalDashboardItem) => void, onViewDetails?: (adset_id: string) => void }) {
  // Usar os dados reais agregados do backend
  const {
    adset_name,
    campaign_name,
    status,
    alerts,
    goal,
    // progress,
    // metrics,
    // Os campos abaixo serão calculados a partir dos dados reais
    // budget_total, cpl_target, volume_contracted, contract_start_date, contract_end_date, etc.
  } = item;

  // Dados agregados reais
  const totalLeads = item.goal?.volume_captured ?? (item.metrics as any)?.total_leads ?? null;
  const totalLeadsTarget = item.goal?.volume_contracted ?? null;
  const totalSpend = (item.metrics as any)?.total_spend ?? null;
  const totalImpressions = (item.metrics as any)?.total_impressions ?? null;
  const cplCurrent = item.metrics?.current_cpl ?? (totalSpend && totalLeads ? totalSpend / totalLeads : null);
  const cplTarget = item.goal?.cpl_target ?? null;
  const budgetTotal = item.goal?.budget_total ?? null;
  const budgetUtilization = budgetTotal && totalSpend ? (totalSpend / budgetTotal) * 100 : null;
  const progressPercentage = item.metrics?.progress_percentage ?? (totalLeads && totalLeadsTarget ? (totalLeads / totalLeadsTarget) * 100 : null);

  // Checar se há informações essenciais faltando
  const missingFields = [budgetTotal, cplTarget, totalLeadsTarget, item.goal?.contract_start_date, item.goal?.contract_end_date].some(v => v === null || v === undefined || isNaN(Number(v)));

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  // Modal de configuração de meta
  const [showMetaModal, setShowMetaModal] = useState(false);

  const { adjustBudget, pauseAdset, resumeAdset, loading } = useAdsetActions({
    onSuccess: (action, data) => {
      console.log(`${action} realizado com sucesso:`, data);
      if (onEdit) {
        onEdit(item);
      }
      // TODO: Trigger refresh dos dados
    }
  });

  const alertSummary = useAlertSummary(alerts);

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return '--';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return '--';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleBudgetAdjust = async (newBudget: number, reason: string) => {
    await adjustBudget(item.adset_id, newBudget, reason);
  };

  const isPaused = status === 'pausado';

  return (
    <>
      <div className="glass-medium rounded-lg border border-white/10 p-6 hover:glass-light transition-all duration-300">
        {/* Aviso de informações incompletas */}
        {alertSummary.length > 0 && (
          <div className="mb-3 p-2 rounded bg-yellow-700/80 text-yellow-100 text-xs font-semibold flex items-center gap-2">
            <AlertIndicator count={1} severity="warning" size="sm" />
            {alertSummary[0].latestMessage || 'Informações incompletas para este adset. Configure meta, budget e datas para acompanhamento completo.'}
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white truncate" title={adset_name}>
                {adset_name}
              </h3>
              {alertSummary.length > 0 && (
                <div className="flex gap-1">
                  {alertSummary.map((alert) => (
                    <AlertIndicator
                      key={alert.severity}
                      count={alert.count}
                      severity={alert.severity}
                      latestMessage={alert.latestMessage}
                      size="sm"
                      onClick={() => console.log('Show alert details:', alert)}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-white/60 truncate" title={campaign_name}>
              {campaign_name}
            </p>
          </div>
          <GoalStatusBadge status={status} />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">Progresso</span>
            <span className="text-sm font-semibold text-white">
              {formatNumber(progressPercentage)}%
            </span>
          </div>
          <GoalProgressBar 
            percentage={progressPercentage || 0}
            status={status}
          />
          {/* Progress section: mostrar leads acumulados (leads_in_goal_period) e meta */}
          <div className="flex justify-between mt-1 text-xs text-white/60">
            <span>{formatNumber(item.metrics?.leads_in_goal_period)} leads acumulados</span>
            <span>Meta: {formatNumber(totalLeadsTarget)}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60">CPL Atual</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {formatCurrency(cplCurrent)}
              </div>
              <div className="text-xs text-white/50">
                Meta: {formatCurrency(cplTarget)}
              </div>
            </div>

            <div>
              {/* Metrics Grid: mostrar leads_ontem e leads_needed_daily */}
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60">Leads/Dia</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {formatNumber(item.metrics?.leads_needed_daily)}
              </div>
              <div className="text-xs text-white/50">
                Ontem: {formatNumber(item.metrics?.leads_ontem)} | Média: {formatNumber(item.metrics?.daily_average_leads)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60">Custo</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {formatNumber(budgetUtilization)}%
              </div>
              <div className="text-xs text-white/50">
                {formatCurrency(totalSpend)} / {formatCurrency(budgetTotal)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60">Dias Rest.</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {formatNumber(item.metrics?.days_remaining)}
              </div>
              <div className="text-xs text-white/50">
                de {formatNumber(item.metrics?.days_total)} dias
              </div>
            </div>
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-2 mb-4 text-xs text-white/60">
          <Calendar className="w-3 h-3" />
          <span>
            {formatDate(goal?.contract_start_date)} - {formatDate(goal?.contract_end_date)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowBudgetModal(true)}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 glass-light text-white/80 hover:text-white rounded-lg transition-all disabled:opacity-50"
          >
            <Settings className="w-4 h-4" />
            Budget
          </button>

          <button
            onClick={() => isPaused ? resumeAdset(item.adset_id) : pauseAdset(item.adset_id)}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all disabled:opacity-50 ${
              isPaused 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Ativar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pausar
              </>
            )}
          </button>
        </div>
        {/* Botão de configuração de meta sempre visível, label muda conforme existência de meta */}
        <button
          onClick={() => setShowMetaModal(true)}
          className="w-full mb-3 px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
        >
          {item.goal ? 'Configuração' : 'Configurar Meta'}
        </button>
      </div>

      {/* Budget Adjust Modal */}
      <BudgetAdjustModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onConfirm={handleBudgetAdjust}
        currentBudget={budgetTotal && item.metrics?.days_total ? budgetTotal / item.metrics.days_total : 0}
        loading={loading}
      />
      {/* Modal de configuração de meta */}
      <MetaConfigModal
        isOpen={showMetaModal}
        onClose={() => setShowMetaModal(false)}
        onSave={Object.assign(
          (meta: any) => {
            setShowMetaModal(false);
            if (onEdit) onEdit(item); // Trigger refresh
          },
          { adsetId: item.adset_id, isEdit: !!item.goal }
        )}
        adsetId={item.adset_id}
        isEdit={!!item.goal}
        goal={item.goal}
      />
    </>
  );
} 