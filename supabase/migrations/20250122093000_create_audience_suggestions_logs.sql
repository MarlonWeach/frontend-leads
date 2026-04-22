-- Migration: Create audience_suggestions_logs table for PBI 25 - Task 25-6
-- Idempotente para remoto com schema já aplicado.

CREATE TABLE IF NOT EXISTS public.audience_suggestions_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR,
  campaign_id VARCHAR,
  type VARCHAR(16) NOT NULL, -- ajuste, exclusao, expansao, reducao
  segment VARCHAR(128),
  suggestion TEXT NOT NULL,
  justification TEXT,
  impact VARCHAR(32), -- ex: '+15% leads', '-10% CPL'
  status VARCHAR(16) NOT NULL DEFAULT 'pendente', -- pendente, aceita, rejeitada
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audience_suggestions_adset_id ON public.audience_suggestions_logs(adset_id);
CREATE INDEX IF NOT EXISTS idx_audience_suggestions_campaign_id ON public.audience_suggestions_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_audience_suggestions_status ON public.audience_suggestions_logs(status);

COMMENT ON TABLE public.audience_suggestions_logs IS 'Logs of audience optimization suggestions for adsets/campaigns.';
COMMENT ON COLUMN public.audience_suggestions_logs.type IS 'ajuste, exclusao, expansao, reducao';
COMMENT ON COLUMN public.audience_suggestions_logs.status IS 'pendente, aceita, rejeitada';
