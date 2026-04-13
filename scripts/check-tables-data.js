#!/usr/bin/env node
/**
 * Script para verificar quais tabelas têm dados e quais estão vazias
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'campaigns',
  'adsets',
  'ads',
  'ad_insights',
  'adset_insights',
  'meta_leads',
  'ad_creatives',
  'adset_goals',
  'ai_analysis_logs',
  'ai_anomalies',
  'audit_logs',
  'sync_status',
  'cache_stats',
  'alert_rules'
];

async function checkTable(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { table: tableName, count: null, error: error.message };
    }
    
    return { table: tableName, count: count || 0, error: null };
  } catch (error) {
    return { table: tableName, count: null, error: error.message };
  }
}

async function main() {
  console.log('🔍 Verificando dados nas tabelas...\n');
  
  const results = await Promise.all(tables.map(checkTable));
  
  const withData = [];
  const empty = [];
  const errors = [];
  
  results.forEach(result => {
    if (result.error) {
      errors.push(result);
    } else if (result.count > 0) {
      withData.push(result);
    } else {
      empty.push(result);
    }
  });
  
  console.log('✅ Tabelas COM dados:');
  withData.forEach(({ table, count }) => {
    console.log(`   ${table}: ${count.toLocaleString()} registros`);
  });
  
  console.log('\n❌ Tabelas VAZIAS (precisam sincronização):');
  empty.forEach(({ table }) => {
    console.log(`   ${table}`);
  });
  
  if (errors.length > 0) {
    console.log('\n⚠️  Tabelas com ERRO:');
    errors.forEach(({ table, error }) => {
      console.log(`   ${table}: ${error}`);
    });
  }
  
  console.log('\n📊 Resumo:');
  console.log(`   Com dados: ${withData.length}`);
  console.log(`   Vazias: ${empty.length}`);
  console.log(`   Erros: ${errors.length}`);
  
  if (empty.length > 0) {
    console.log('\n💡 Próximos passos:');
    console.log('   Execute os scripts de sincronização para as tabelas vazias:');
    
    const syncMap = {
      'campaigns': 'node scripts/sync-campaigns-once.js',
      'ads': 'node scripts/sync-ads-once.js',
      'ad_insights': 'node scripts/sync-ad-insights-account.js',
      'meta_leads': 'node scripts/sync-meta-leads.js',
      'ad_creatives': 'node scripts/update-ad-creatives.js',
      'adset_goals': '# Tabela de metas - preencher manualmente',
      'ai_analysis_logs': '# Tabela de logs de IA - preencher via uso do sistema',
      'ai_anomalies': '# Tabela de anomalias - preencher via uso do sistema',
      'audit_logs': '# Tabela de auditoria - preencher via scripts de auditoria'
    };
    
    empty.forEach(({ table }) => {
      const command = syncMap[table] || `# Verificar script para ${table}`;
      console.log(`   ${command}`);
    });
  }
}

main().catch(console.error);

