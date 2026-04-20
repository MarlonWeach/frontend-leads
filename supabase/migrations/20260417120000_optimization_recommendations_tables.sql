-- PBI 32 / Task 32-6: tabelas de recomendações assistidas e decisões (contrato 32-3).
-- Idempotente: remoto pode já ter tabelas sem linha correspondente em schema_migrations.
-- Acesso previsto: APIs Next.js com service_role; RLS habilitado sem políticas permissivas (PBI 29).

-- =============================================================================
-- optimization_recommendations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  competence_month TEXT,
  recommendation_type TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  generated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  action_payload JSONB NOT NULL,
  score_breakdown JSONB NOT NULL,
  evidence_summary TEXT NOT NULL,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  batch_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT optimization_recommendations_scope_check
    CHECK (scope IN ('account', 'adset')),
  CONSTRAINT optimization_recommendations_confidence_check
    CHECK (confidence_level IN ('high', 'medium', 'low')),
  CONSTRAINT optimization_recommendations_status_check
    CHECK (status IN ('active', 'applied', 'discarded', 'expired')),
  CONSTRAINT optimization_recommendations_type_check
    CHECK (recommendation_type IN (
      'budget_increase',
      'budget_decrease',
      'schedule_shift',
      'focus_adset'
    ))
);

CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_account_status_expires
  ON public.optimization_recommendations (meta_account_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_entity_generated
  ON public.optimization_recommendations (entity_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_batch
  ON public.optimization_recommendations (batch_id);

COMMENT ON TABLE public.optimization_recommendations IS
  'PBI 32: recomendações assistidas geradas pelo motor; TTL e status conforme task 32-3.';

-- =============================================================================
-- optimization_recommendation_decisions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.optimization_recommendation_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL
    REFERENCES public.optimization_recommendations (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason_code TEXT,
  note TEXT,
  decided_by UUID NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT optimization_recommendation_decisions_action_check
    CHECK (action IN ('apply', 'discard', 'defer'))
);

CREATE INDEX IF NOT EXISTS idx_optimization_decisions_recommendation
  ON public.optimization_recommendation_decisions (recommendation_id);

CREATE INDEX IF NOT EXISTS idx_optimization_decisions_decided_at
  ON public.optimization_recommendation_decisions (decided_at DESC);

COMMENT ON TABLE public.optimization_recommendation_decisions IS
  'PBI 32: auditoria de decisões humanas (apply/discard/defer) por recomendação.';

-- =============================================================================
-- updated_at (função já existente em migrações anteriores)
-- =============================================================================

DROP TRIGGER IF EXISTS tr_optimization_recommendations_updated_at ON public.optimization_recommendations;
CREATE TRIGGER tr_optimization_recommendations_updated_at
  BEFORE UPDATE ON public.optimization_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- RLS + grants (sem SELECT público amplo — alinhado PBI 29)
-- =============================================================================

ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_recommendation_decisions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.optimization_recommendations FROM PUBLIC;
REVOKE ALL ON public.optimization_recommendation_decisions FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.optimization_recommendations TO service_role;
GRANT SELECT, INSERT, DELETE ON public.optimization_recommendation_decisions TO service_role;
