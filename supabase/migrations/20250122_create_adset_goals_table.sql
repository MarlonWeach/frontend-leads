-- Migration: Create adset_goals table for PBI 25 - Task 25-1
-- Created: 2025-01-22
-- Purpose: Store contractual goals per adset (budget, CPL target, volume, dates)

CREATE TABLE adset_goals (
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

-- Indexes
CREATE UNIQUE INDEX idx_adset_goals_adset_id ON adset_goals(adset_id);
CREATE INDEX idx_adset_goals_dates ON adset_goals(contract_start_date, contract_end_date);
CREATE INDEX idx_adset_goals_active ON adset_goals(contract_end_date) WHERE contract_end_date >= CURRENT_DATE;

-- Constraints
ALTER TABLE adset_goals ADD CONSTRAINT valid_dates 
  CHECK (contract_end_date > contract_start_date);

ALTER TABLE adset_goals ADD CONSTRAINT positive_budget 
  CHECK (budget_total > 0);

ALTER TABLE adset_goals ADD CONSTRAINT positive_cpl 
  CHECK (cpl_target > 0);

ALTER TABLE adset_goals ADD CONSTRAINT positive_volume 
  CHECK (volume_contracted > 0);

ALTER TABLE adset_goals ADD CONSTRAINT valid_captured_volume 
  CHECK (volume_captured >= 0 AND volume_captured <= volume_contracted);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_adset_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_adset_goals_updated_at
  BEFORE UPDATE ON adset_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_adset_goals_updated_at();

-- Comments for documentation
COMMENT ON TABLE adset_goals IS 'Contractual goals and targets per adset for optimization system';
COMMENT ON COLUMN adset_goals.adset_id IS 'Meta API adset ID';
COMMENT ON COLUMN adset_goals.budget_total IS 'Total budget allocated for the contract period in BRL';
COMMENT ON COLUMN adset_goals.cpl_target IS 'Target cost per lead in BRL';
COMMENT ON COLUMN adset_goals.volume_contracted IS 'Total number of leads contracted for the period';
COMMENT ON COLUMN adset_goals.volume_captured IS 'Number of leads already captured by client (manually updated)';
COMMENT ON COLUMN adset_goals.contract_start_date IS 'Start date of the contract period';
COMMENT ON COLUMN adset_goals.contract_end_date IS 'End date of the contract period'; 