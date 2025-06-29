-- Adicionar coluna CPL (Cost Per Lead) à tabela adset_insights
-- Esta coluna é fundamental para análises de performance e detecção de anomalias

ALTER TABLE adset_insights 
ADD COLUMN IF NOT EXISTS cpl DECIMAL(10,4);

-- Atualizar registros existentes calculando CPL = spend / leads
-- Apenas quando leads > 0 para evitar divisão por zero
UPDATE adset_insights 
SET cpl = CASE 
    WHEN leads > 0 THEN spend / leads 
    ELSE NULL 
END
WHERE cpl IS NULL;

-- Criar índice para otimizar consultas por CPL
CREATE INDEX IF NOT EXISTS idx_adset_insights_cpl ON adset_insights(cpl);

-- Adicionar comentário explicativo
COMMENT ON COLUMN adset_insights.cpl IS 'Cost Per Lead - Custo por lead gerado (spend / leads)'; 