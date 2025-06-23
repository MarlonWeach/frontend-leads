const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const migration = `
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
`;

async function applyMigration() {
  try {
    console.log('Aplicando migração para adicionar colunas à tabela campaigns...');
    
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
    
    // Testar se as colunas foram adicionadas
    console.log('Testando inserção...');
    const { error: testError } = await supabase
      .from('campaigns')
      .insert({
        id: 'test_campaign_' + Date.now(),
        name: 'Test Campaign',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        objective: 'LEADS'
      });
    
    if (testError) {
      console.log('Erro no teste:', testError);
    } else {
      console.log('Teste de inserção bem-sucedido!');
      // Limpar o registro de teste
      await supabase.from('campaigns').delete().like('id', 'test_campaign_%');
    }
    
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration(); 