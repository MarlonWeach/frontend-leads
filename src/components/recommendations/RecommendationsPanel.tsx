'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { OptimizationRecommendationRow } from '@/types/optimizationRecommendations';

const DEFAULT_META_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_META_ACCOUNT_ID?.replace(/^act_/i, '') || '256925527';

const TYPE_LABELS: Record<string, string> = {
  budget_increase: 'Aumentar orçamento',
  budget_decrease: 'Reduzir orçamento',
  schedule_shift: 'Ajustar horários',
  focus_adset: 'Foco neste adset',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const REASON_OPTIONS: { value: string; label: string }[] = [
  { value: 'agree_efficiency', label: 'Concordo — métricas fazem sentido' },
  { value: 'disagree_metrics', label: 'Discordo dos números / dados' },
  { value: 'strategy_change', label: 'Mudança de estratégia de campanha' },
  { value: 'need_more_time', label: 'Preciso de mais tempo para decidir' },
  { value: 'other', label: 'Outro (descrever abaixo)' },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function adsetDisplayName(row: OptimizationRecommendationRow): string {
  const resolved = row.adset_display_name?.trim();
  if (resolved) return resolved;
  const name = row.context_snapshot?.goal_context?.adset_name?.trim();
  if (name) return name;
  return `Adset ${row.entity_id}`;
}

export default function RecommendationsPanel() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [items, setItems] = useState<OptimizationRecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<{
    action: 'apply' | 'discard' | 'defer';
    row: OptimizationRecommendationRow;
  } | null>(null);
  const [reasonCode, setReasonCode] = useState('agree_efficiency');
  const [note, setNote] = useState('');

  const queryStatus = useMemo(
    () => (statusFilter === 'active' ? 'active' : 'active,applied,discarded,expired'),
    [statusFilter]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/optimization/recommendations?meta_account_id=${encodeURIComponent(
          DEFAULT_META_ACCOUNT_ID
        )}&status=${encodeURIComponent(queryStatus)}&limit=50`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `Erro ${res.status}`);
        setItems([]);
        return;
      }
      setItems(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [queryStatus]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const runGenerate = async (overwriteActive = false) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/optimization/recommendations/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_account_id: DEFAULT_META_ACCOUNT_ID,
          overwrite_active: overwriteActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `Erro ${res.status}`);
        return;
      }
      setInfo(
        overwriteActive
          ? 'Sugestões anteriores substituídas e nova rodada gerada.'
          : 'Nova rodada de sugestões gerada.'
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao gerar');
    } finally {
      setBusy(false);
    }
  };

  const clearAllActive = async () => {
    const confirmed = window.confirm('Descartar todas as recomendações ativas desta conta agora?');
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/optimization/recommendations/clear', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_account_id: DEFAULT_META_ACCOUNT_ID }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `Erro ${res.status}`);
        return;
      }
      const cleared = Number(json.cleared || 0);
      setInfo(
        cleared > 0
          ? `${cleared} recomendação(ões) ativa(s) foram descartadas.`
          : 'Não havia recomendações ativas para limpar.'
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao limpar recomendações');
    } finally {
      setBusy(false);
    }
  };

  const submitDecision = async () => {
    if (!modal) return;
    if (modal.action === 'discard' && reasonCode === 'other' && !note.trim()) {
      setError('Informe uma nota quando o motivo for “Outro”.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/optimization/recommendations/${modal.row.id}/decision`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modal.action,
          reason_code: reasonCode,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || json.code || `Erro ${res.status}`);
        return;
      }
      setModal(null);
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao registrar decisão');
    } finally {
      setBusy(false);
    }
  };

  const openModal = (row: OptimizationRecommendationRow, action: 'apply' | 'discard' | 'defer') => {
    setReasonCode(action === 'apply' ? 'agree_efficiency' : 'need_more_time');
    setNote('');
    setModal({ row, action });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-sm text-white/80">
          Conta piloto: <span className="font-mono text-white">{DEFAULT_META_ACCOUNT_ID}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              statusFilter === 'active' ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/80'
            }`}
          >
            Ativas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              statusFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/80'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runGenerate(false)}
            className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Gerar sugestões (motor v1)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runGenerate(true)}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Gerar sobrescrevendo ativas
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearAllActive()}
            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
          >
            Limpar ativas
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {info}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Nenhuma recomendação neste filtro. Use &quot;Gerar sugestões&quot; após configurar metas e insights.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-xs text-violet-100">
                    {TYPE_LABELS[row.recommendation_type] || row.recommendation_type}
                  </span>
                  <span className="ml-2 text-sm font-medium text-white/90">{adsetDisplayName(row)}</span>
                  {!row.adset_display_name?.trim() &&
                  !row.context_snapshot?.goal_context?.adset_name?.trim() ? null : (
                    <span className="ml-2 text-xs text-white/40 font-mono" title="ID na Meta">
                      {row.entity_id}
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">
                  Confiança {CONFIDENCE_LABELS[row.confidence_level] || row.confidence_level}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/90">{row.evidence_summary}</p>
              <p className="mt-1 text-xs text-white/50">
                Gerada {formatDate(row.generated_at)} · Expira {formatDate(row.expires_at)} ·{' '}
                <span className="uppercase">{row.status}</span>
              </p>
              {row.status === 'active' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal(row, 'apply')}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal(row, 'discard')}
                    className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal(row, 'defer')}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
                  >
                    Adiar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="max-w-md rounded-xl border border-white/10 bg-slate-900 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-white">
              {modal.action === 'apply' && 'Confirmar aplicação'}
              {modal.action === 'discard' && 'Confirmar descarte'}
              {modal.action === 'defer' && 'Adiar revisão'}
            </h3>
            <p className="mt-2 text-sm text-white/70">
              {modal.action === 'defer'
                ? 'A recomendação permanece ativa; registramos que você precisa de mais tempo.'
                : 'Escolha um motivo para auditoria.'}
            </p>
            <label className="mt-4 block text-xs text-white/60" htmlFor="reason-code">
              Motivo
            </label>
            <select
              id="reason-code"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
            >
              {REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs text-white/60" htmlFor="decision-note">
              Nota (opcional; obrigatória se motivo for Outro)
            </label>
            <textarea
              id="decision-note"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitDecision()}
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
