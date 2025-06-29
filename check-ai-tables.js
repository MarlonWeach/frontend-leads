const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAITables() {
  console.log('🔍 Verificando tabelas de IA no Supabase...\n');

  try {
    // Verificar tabela ai_analysis_logs
    console.log('1. Verificando tabela ai_analysis_logs...');
    const { data: logsData, error: logsError } = await supabase
      .from('ai_analysis_logs')
      .select('*')
      .limit(1);

    if (logsError) {
      console.log('❌ Erro ao acessar ai_analysis_logs:', logsError.message);
    } else {
      console.log('✅ Tabela ai_analysis_logs existe e está acessível');
      console.log(`   - Registros encontrados: ${logsData?.length || 0}`);
    }

    // Verificar tabela ai_anomalies
    console.log('\n2. Verificando tabela ai_anomalies...');
    const { data: anomaliesData, error: anomaliesError } = await supabase
      .from('ai_anomalies')
      .select('*')
      .limit(1);

    if (anomaliesError) {
      console.log('❌ Erro ao acessar ai_anomalies:', anomaliesError.message);
    } else {
      console.log('✅ Tabela ai_anomalies existe e está acessível');
      console.log(`   - Registros encontrados: ${anomaliesData?.length || 0}`);
    }

    // Testar inserção de log
    console.log('\n3. Testando inserção de log...');
    const testLog = {
      analysis_type: 'performance',
      campaign_ids: ['test-campaign'],
      date_range: { startDate: '2025-01-01', endDate: '2025-01-07' },
      tokens_used: 100,
      cost_estimated: 0.003,
      model_used: 'gpt-4',
      status: 'completed',
      metadata: { test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('ai_analysis_logs')
      .insert(testLog)
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir log de teste:', insertError.message);
    } else {
      console.log('✅ Inserção de log funcionou corretamente');
      console.log('   - ID do log inserido:', insertData[0].id);
      
      // Limpar log de teste
      await supabase
        .from('ai_analysis_logs')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   - Log de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkAITables(); 