ALTER TABLE adset_insights ADD COLUMN IF NOT EXISTS account_id text;
-- Permitir nulo para compatibilidade retroativa 