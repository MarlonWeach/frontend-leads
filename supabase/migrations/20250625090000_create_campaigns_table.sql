-- Criar tabela campaigns para armazenar dados da Meta API
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    status VARCHAR(50),
    effective_status VARCHAR(50),
    created_time TIMESTAMP WITH TIME ZONE,
    updated_time TIMESTAMP WITH TIME ZONE,
    objective VARCHAR(100),
    special_ad_categories JSONB,
    special_ad_category_country JSONB,
    start_time TIMESTAMP WITH TIME ZONE,
    stop_time TIMESTAMP WITH TIME ZONE,
    daily_budget INTEGER,
    lifetime_budget INTEGER,
    budget_remaining INTEGER,
    spend_cap INTEGER,
    source_campaign_id VARCHAR(255),
    source_campaign_name TEXT,
    source_campaign_status VARCHAR(50),
    source_campaign_effective_status VARCHAR(50),
    source_campaign_created_time TIMESTAMP WITH TIME ZONE,
    source_campaign_updated_time TIMESTAMP WITH TIME ZONE,
    source_campaign_objective VARCHAR(100),
    source_campaign_special_ad_categories JSONB,
    source_campaign_special_ad_category_country JSONB,
    source_campaign_start_time TIMESTAMP WITH TIME ZONE,
    source_campaign_stop_time TIMESTAMP WITH TIME ZONE,
    source_campaign_daily_budget INTEGER,
    source_campaign_lifetime_budget INTEGER,
    source_campaign_budget_remaining INTEGER,
    source_campaign_spend_cap INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_effective_status ON campaigns(effective_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_time ON campaigns(created_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_time ON campaigns(updated_time);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 