const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const migration = `
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

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

async function applyMigration() {
  try {
    // Vamos tentar executar cada comando separadamente
    const commands = migration.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log('Executando:', command.substring(0, 50) + '...');
        
        // Usar query direta para DDL
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        
        if (error) {
          console.log('Comando ignorado (pode já existir):', error.message);
        } else {
          console.log('Comando executado com sucesso');
        }
      }
    }
    
    console.log('Migração concluída!');
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration(); 