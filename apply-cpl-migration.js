const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyCPLMigration() {
  console.log('🚀 Aplicando migração da coluna CPL...\n');

  try {
    // 1. Adicionar coluna CPL
    console.log('1. Adicionando coluna CPL...');
    const { error: alterError } = await supabase
      .from('adset_insights')
      .select('id')
      .limit(1);
    
    if (alterError) {
      console.log('❌ Erro ao verificar tabela:', alterError.message);
      console.log('\n💡 Execute o seguinte SQL no Supabase Dashboard > SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(`
-- Adicionar coluna CPL (Cost Per Lead) à tabela adset_insights
ALTER TABLE adset_insights 
ADD COLUMN IF NOT EXISTS cpl DECIMAL(10,4);

-- Atualizar registros existentes calculando CPL = spend / leads
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
`);
      console.log('='.repeat(80));
      return;
    }

    console.log('✅ Tabela adset_insights acessível');
    
    // 2. Verificar se a coluna já existe
    console.log('2. Verificando se a coluna CPL já existe...');
    const { data: testData, error: testError } = await supabase
      .from('adset_insights')
      .select('cpl')
      .limit(1);

    if (testError && testError.message.includes('cpl')) {
      console.log('❌ Coluna CPL não existe. Execute o SQL acima no Supabase Dashboard.');
    } else {
      console.log('✅ Coluna CPL já existe!');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

applyCPLMigration(); 