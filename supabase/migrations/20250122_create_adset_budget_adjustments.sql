-- Migration: Create adset_budget_adjustments table for PBI 25 - Task 25-4
-- Created: 2025-01-22
-- Purpose: Store all budget adjustment logs for adsets (20% rule, audit)

CREATE TABLE adset_budget_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id VARCHAR NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  old_budget NUMERIC(12,2) NOT NULL,
  new_budget NUMERIC(12,2) NOT NULL,
  percent_change NUMERIC(5,2) NOT NULL,
  user_id VARCHAR NOT NULL,
  reason VARCHAR(32) NOT NULL, -- atraso_meta, estrategia, correcao_erro, manual
  status VARCHAR(16) NOT NULL, -- success, blocked, error
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_adjustments_adset_id ON adset_budget_adjustments(adset_id);
CREATE INDEX idx_budget_adjustments_timestamp ON adset_budget_adjustments(timestamp);

COMMENT ON TABLE adset_budget_adjustments IS 'Logs of all budget adjustments for adsets (20% rule, audit)';
COMMENT ON COLUMN adset_budget_adjustments.reason IS 'atraso_meta, estrategia, correcao_erro, manual';
COMMENT ON COLUMN adset_budget_adjustments.status IS 'success, blocked, error'; 