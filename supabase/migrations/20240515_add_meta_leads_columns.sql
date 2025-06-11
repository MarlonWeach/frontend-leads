-- Adiciona colunas faltantes à tabela meta_leads
ALTER TABLE meta_leads
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS lead_count INTEGER,
ADD COLUMN IF NOT EXISTS spend NUMERIC,
ADD COLUMN IF NOT EXISTS impressions INTEGER,
ADD COLUMN IF NOT EXISTS clicks INTEGER,
ADD COLUMN IF NOT EXISTS ad_name TEXT,
ADD COLUMN IF NOT EXISTS adset_name TEXT;

-- Opcional: Adicionar NOT NULL e DEFAULT para `created_time` se for um problema
-- ALTER TABLE meta_leads ALTER COLUMN created_time SET NOT NULL; 