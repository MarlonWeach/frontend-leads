-- Migration: Add quality_score to leads table for PBI 25 - Task 25-5
-- Created: 2025-01-22
-- Purpose: Store quality score (0-100) for each lead

ALTER TABLE leads
ADD COLUMN quality_score NUMERIC(5,2);

COMMENT ON COLUMN leads.quality_score IS 'Quality score (0-100) for each lead, calculated by scoring system.'; 