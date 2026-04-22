-- Migration: Add quality_score to meta_leads table for PBI 25 - Task 25-5
-- Created: 2025-01-22
-- Purpose: Store quality score (0-100) for each lead

ALTER TABLE meta_leads
ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5,2);

COMMENT ON COLUMN meta_leads.quality_score IS 'Quality score (0-100) for each lead, calculated by scoring system.'; 