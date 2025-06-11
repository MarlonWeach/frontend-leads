-- Adiciona coluna lead_count na tabela meta_leads
ALTER TABLE meta_leads
ADD COLUMN IF NOT EXISTS lead_count INTEGER DEFAULT 1;

-- Atualiza registros existentes com base no raw_data
UPDATE meta_leads
SET lead_count = (
  SELECT (raw_data->'results'->0->'values'->0->>'value')::INTEGER
  FROM meta_leads m2
  WHERE m2.id = meta_leads.id
  AND raw_data->'results'->0->>'indicator' = 'actions:onsite_conversion.lead_grouped'
)
WHERE raw_data->'results'->0->>'indicator' = 'actions:onsite_conversion.lead_grouped';

-- Adiciona índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_meta_leads_lead_count ON meta_leads(lead_count);

-- Comentário na coluna
COMMENT ON COLUMN meta_leads.lead_count IS 'Número total de leads gerados pelo anúncio';

-- Limpa registros duplicados mantendo apenas o mais recente
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY created_time, ad_id, ad_name
           ORDER BY created_time DESC
         ) as rn
  FROM meta_leads
)
DELETE FROM meta_leads
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
); 