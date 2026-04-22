-- Migration: Create adset_progress_alerts table for PBI 25 - Task 25-3
-- Idempotente para remoto com schema já aplicado.

CREATE TABLE IF NOT EXISTS public.adset_progress_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(24) NOT NULL, -- behind, ahead, at_risk, completed
  severity VARCHAR(12) NOT NULL, -- info, warning, error, critical
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adset_progress_alerts_adset_id ON public.adset_progress_alerts(adset_id);
CREATE INDEX IF NOT EXISTS idx_adset_progress_alerts_date ON public.adset_progress_alerts(date);

COMMENT ON TABLE public.adset_progress_alerts IS 'Persistent alerts for adset progress deviations';
COMMENT ON COLUMN public.adset_progress_alerts.type IS 'behind, ahead, at_risk, completed';
