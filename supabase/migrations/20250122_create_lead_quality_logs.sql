-- Migration: Create lead_quality_logs table for PBI 25 - Task 25-5
-- Created: 2025-01-22
-- Purpose: Store logs of quality score changes and reasons for each lead

CREATE TABLE lead_quality_logs (
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

CREATE INDEX idx_lead_quality_logs_lead_id ON lead_quality_logs(lead_id);
CREATE INDEX idx_lead_quality_logs_adset_id ON lead_quality_logs(adset_id);
CREATE INDEX idx_lead_quality_logs_timestamp ON lead_quality_logs(timestamp);

COMMENT ON TABLE lead_quality_logs IS 'Logs of quality score changes and reasons for each lead.';
COMMENT ON COLUMN lead_quality_logs.reason IS 'Reason for score change (conversion, update, penalty, manual, etc)'; 