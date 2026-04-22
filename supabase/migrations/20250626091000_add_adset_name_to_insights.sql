-- Adicionar coluna adset_name à tabela adset_insights
ALTER TABLE adset_insights 
ADD COLUMN IF NOT EXISTS adset_name TEXT;

-- Criar índice para otimizar consultas por nome
CREATE INDEX IF NOT EXISTS idx_adset_insights_name ON adset_insights(adset_name);

-- Comentário para documentação
COMMENT ON COLUMN adset_insights.adset_name IS 'Nome do adset para facilitar consultas e exibição'; 