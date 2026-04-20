-- Migration: Create adset_progress_tracking table for PBI 25 - Task 25-3
-- Idempotente para remoto com schema já aplicado.

CREATE TABLE IF NOT EXISTS public.adset_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  leads_captured INTEGER NOT NULL,
  daily_target NUMERIC(8,2) NOT NULL,
  status VARCHAR(16) NOT NULL, -- on_track, behind, ahead, at_risk, completed
  deviation_pct NUMERIC(6,2) NOT NULL,
  alert_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (adset_id, date)
);

CREATE INDEX IF NOT EXISTS idx_adset_progress_tracking_adset_id ON public.adset_progress_tracking(adset_id);
CREATE INDEX IF NOT EXISTS idx_adset_progress_tracking_date ON public.adset_progress_tracking(date);

COMMENT ON TABLE public.adset_progress_tracking IS 'Daily progress tracking for adset goals';
COMMENT ON COLUMN public.adset_progress_tracking.status IS 'on_track, behind, ahead, at_risk, completed';
