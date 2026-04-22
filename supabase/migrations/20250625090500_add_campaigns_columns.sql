-- Adicionar colunas necessárias à tabela campaigns existente
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS created_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS objective VARCHAR(100),
ADD COLUMN IF NOT EXISTS special_ad_categories JSONB,
ADD COLUMN IF NOT EXISTS special_ad_category_country JSONB,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stop_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_budget INTEGER,
ADD COLUMN IF NOT EXISTS lifetime_budget INTEGER,
ADD COLUMN IF NOT EXISTS budget_remaining INTEGER,
ADD COLUMN IF NOT EXISTS spend_cap INTEGER;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_effective_status ON campaigns(effective_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_time ON campaigns(created_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_time ON campaigns(updated_time); 