-- Migration: Create adset_goals table for PBI 25 - Task 25-1
-- Idempotente: remoto pode já ter a tabela (histórico de migrações desalinhado).

CREATE TABLE IF NOT EXISTS public.adset_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  adset_name VARCHAR, -- Cache do nome para facilitar queries
  budget_total DECIMAL(10,2) NOT NULL,
  cpl_target DECIMAL(8,2) NOT NULL,
  volume_contracted INTEGER NOT NULL,
  volume_captured INTEGER DEFAULT 0,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_adset_goals_adset_id ON public.adset_goals(adset_id);
CREATE INDEX IF NOT EXISTS idx_adset_goals_dates ON public.adset_goals(contract_start_date, contract_end_date);
CREATE INDEX IF NOT EXISTS idx_adset_goals_end_date ON public.adset_goals(contract_end_date);

DO $$ BEGIN
  ALTER TABLE public.adset_goals ADD CONSTRAINT valid_dates
    CHECK (contract_end_date > contract_start_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.adset_goals ADD CONSTRAINT positive_budget
    CHECK (budget_total > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.adset_goals ADD CONSTRAINT positive_cpl
    CHECK (cpl_target > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.adset_goals ADD CONSTRAINT positive_volume
    CHECK (volume_contracted > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.adset_goals ADD CONSTRAINT valid_captured_volume
    CHECK (volume_captured >= 0 AND volume_captured <= volume_contracted);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_adset_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_adset_goals_updated_at ON public.adset_goals;
CREATE TRIGGER trigger_update_adset_goals_updated_at
  BEFORE UPDATE ON public.adset_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_adset_goals_updated_at();

COMMENT ON TABLE public.adset_goals IS 'Contractual goals and targets per adset for optimization system';
COMMENT ON COLUMN public.adset_goals.adset_id IS 'Meta API adset ID';
COMMENT ON COLUMN public.adset_goals.budget_total IS 'Total budget allocated for the contract period in BRL';
COMMENT ON COLUMN public.adset_goals.cpl_target IS 'Target cost per lead in BRL';
COMMENT ON COLUMN public.adset_goals.volume_contracted IS 'Total number of leads contracted for the period';
COMMENT ON COLUMN public.adset_goals.volume_captured IS 'Number of leads already captured by client (manually updated)';
COMMENT ON COLUMN public.adset_goals.contract_start_date IS 'Start date of the contract period';
COMMENT ON COLUMN public.adset_goals.contract_end_date IS 'End date of the contract period';
