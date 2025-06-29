const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyAIMigrations() {
  console.log('🚀 Aplicando migrações das tabelas de IA...\n');

  try {
    // 1. Criar tabela ai_analysis_logs
    console.log('1. Criando tabela ai_analysis_logs...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });

    if (logsError) {
      console.log('❌ Erro ao criar ai_analysis_logs:', logsError.message);
    } else {
      console.log('✅ Tabela ai_analysis_logs criada com sucesso');
    }

    // 2. Criar índices para ai_analysis_logs
    console.log('\n2. Criando índices para ai_analysis_logs...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_analysis_type ON ai_analysis_logs(analysis_type);
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_status ON ai_analysis_logs(status);
      `
    });

    if (indexError) {
      console.log('❌ Erro ao criar índices:', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso');
    }

    // 3. Criar trigger para updated_at
    console.log('\n3. Criando trigger para updated_at...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });

    if (triggerError) {
      console.log('❌ Erro ao criar trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger criado com sucesso');
    }

    // 4. Criar tabela ai_anomalies
    console.log('\n4. Criando tabela ai_anomalies...');
    const { error: anomaliesError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });

    if (anomaliesError) {
      console.log('❌ Erro ao criar ai_anomalies:', anomaliesError.message);
    } else {
      console.log('✅ Tabela ai_anomalies criada com sucesso');
    }

    // 5. Criar índices para ai_anomalies
    console.log('\n5. Criando índices para ai_anomalies...');
    const { error: anomaliesIndexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_ai_anomalies_type ON ai_anomalies(type);
        CREATE INDEX IF NOT EXISTS idx_ai_anomalies_severity ON ai_anomalies(severity);
        CREATE INDEX IF NOT EXISTS idx_ai_anomalies_created_at ON ai_anomalies(created_at);
        CREATE INDEX IF NOT EXISTS idx_ai_anomalies_resolved ON ai_anomalies(resolved);
        CREATE INDEX IF NOT EXISTS idx_ai_anomalies_confidence ON ai_anomalies(confidence);
      `
    });

    if (anomaliesIndexError) {
      console.log('❌ Erro ao criar índices de anomalias:', anomaliesIndexError.message);
    } else {
      console.log('✅ Índices de anomalias criados com sucesso');
    }

    // 6. Criar trigger para ai_anomalies
    console.log('\n6. Criando trigger para ai_anomalies...');
    const { error: anomaliesTriggerError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });

    if (anomaliesTriggerError) {
      console.log('❌ Erro ao criar trigger de anomalias:', anomaliesTriggerError.message);
    } else {
      console.log('✅ Trigger de anomalias criado com sucesso');
    }

    // 7. Inserir dados de teste
    console.log('\n7. Inserindo dados de teste...');
    const { data: testData, error: testError } = await supabase
      .from('ai_analysis_logs')
      .insert({
        analysis_type: 'performance',
        campaign_ids: ['test-campaign-1', 'test-campaign-2'],
        date_range: { startDate: '2025-01-01', endDate: '2025-01-07' },
        tokens_used: 150,
        cost_estimated: 0.0045,
        model_used: 'gpt-4',
        status: 'completed',
        metadata: { test: true, source: 'migration' }
      })
      .select();

    if (testError) {
      console.log('❌ Erro ao inserir dados de teste:', testError.message);
    } else {
      console.log('✅ Dados de teste inseridos com sucesso');
      console.log('   - ID do log:', testData[0].id);
    }

    console.log('\n🎉 Migrações aplicadas com sucesso!');
    console.log('\n📋 Resumo das tabelas criadas:');
    console.log('   - ai_analysis_logs: Log de análises de IA');
    console.log('   - ai_anomalies: Anomalias detectadas pela IA');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

applyAIMigrations(); 