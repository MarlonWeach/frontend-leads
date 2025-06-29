const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAITables() {
  console.log('🚀 Verificando tabelas de IA...\n');

  try {
    // Verificar tabela ai_analysis_logs
    console.log('1. Verificando tabela ai_analysis_logs...');
    const { data: logsData, error: logsError } = await supabase
      .from('ai_analysis_logs')
      .select('*')
      .limit(1);

    if (logsError) {
      console.log('❌ Tabela ai_analysis_logs não existe ou erro:', logsError.message);
      console.log('\n💡 Execute o seguinte SQL no Supabase Dashboard > SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(`
-- Copie e cole este SQL no Supabase Dashboard > SQL Editor

-- 1. Criar tabela ai_analysis_logs
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL,
  campaign_ids TEXT[],
  date_range JSONB,
  tokens_used INTEGER,
  cost_estimated DECIMAL(10,4),
  model_used TEXT DEFAULT 'gpt-4',
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_analysis_type ON ai_analysis_logs(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_status ON ai_analysis_logs(status);

-- 3. Criar trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_logs_updated_at 
  BEFORE UPDATE ON ai_analysis_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Criar tabela ai_anomalies
CREATE TABLE IF NOT EXISTS ai_anomalies (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    affected_campaigns TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar índices para ai_anomalies
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_type ON ai_anomalies(type);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_severity ON ai_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_created_at ON ai_anomalies(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_resolved ON ai_anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_confidence ON ai_anomalies(confidence);

-- 6. Criar trigger para ai_anomalies
CREATE OR REPLACE FUNCTION update_ai_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_anomalies_updated_at
    BEFORE UPDATE ON ai_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_anomalies_updated_at();
      `);
      console.log('='.repeat(80));
    } else {
      console.log('✅ Tabela ai_analysis_logs existe e está funcionando');
      console.log(`   - Registros encontrados: ${logsData?.length || 0}`);
    }

    // Verificar tabela ai_anomalies
    console.log('\n2. Verificando tabela ai_anomalies...');
    const { data: anomaliesData, error: anomaliesError } = await supabase
      .from('ai_anomalies')
      .select('*')
      .limit(1);

    if (anomaliesError) {
      console.log('❌ Tabela ai_anomalies não existe ou erro:', anomaliesError.message);
    } else {
      console.log('✅ Tabela ai_anomalies existe e está funcionando');
      console.log(`   - Registros encontrados: ${anomaliesData?.length || 0}`);
    }

    // Se ambas as tabelas existem, testar inserção
    if (!logsError && !anomaliesError) {
      console.log('\n3. Testando inserção de dados...');
      const { data: testData, error: testError } = await supabase
        .from('ai_analysis_logs')
        .insert({
          analysis_type: 'performance',
          campaign_ids: ['test-campaign-1'],
          date_range: { startDate: '2025-01-01', endDate: '2025-01-07' },
          tokens_used: 150,
          cost_estimated: 0.0045,
          model_used: 'gpt-4',
          status: 'completed',
          metadata: { test: true, source: 'verification' }
        })
        .select();

      if (testError) {
        console.log('❌ Erro ao inserir dados de teste:', testError.message);
      } else {
        console.log('✅ Inserção de dados funcionou corretamente');
        console.log('   - ID do log:', testData[0].id);
        
        // Limpar dados de teste
        await supabase
          .from('ai_analysis_logs')
          .delete()
          .eq('id', testData[0].id);
        console.log('   - Dados de teste removidos');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createAITables(); 