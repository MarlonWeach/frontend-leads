-- Migration: Create lead_quality_logs table for PBI 25 - Task 25-5
-- Idempotente para remoto com schema já aplicado.

CREATE TABLE IF NOT EXISTS public.lead_quality_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR NOT NULL,
  adset_id VARCHAR,
  old_score NUMERIC(5,2),
  new_score NUMERIC(5,2),
  reason VARCHAR(32) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_quality_logs_lead_id ON public.lead_quality_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quality_logs_adset_id ON public.lead_quality_logs(adset_id);
CREATE INDEX IF NOT EXISTS idx_lead_quality_logs_timestamp ON public.lead_quality_logs(timestamp);

COMMENT ON TABLE public.lead_quality_logs IS 'Logs of quality score changes and reasons for each lead.';
COMMENT ON COLUMN public.lead_quality_logs.reason IS 'Reason for score change (conversion, update, penalty, manual, etc)';
