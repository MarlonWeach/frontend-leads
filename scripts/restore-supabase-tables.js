#!/usr/bin/env node
/**
 * Script de Recuperação de Tabelas do Supabase
 * 
 * Este script executa todas as migrations na ordem correta para recriar
 * as tabelas que foram deletadas acidentalmente.
 * 
 * IMPORTANTE: Este script NÃO restaura dados, apenas recria a estrutura.
 * Para restaurar dados, use os backups do Supabase Dashboard.
 * 
 * Uso: node scripts/restore-supabase-tables.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ordem das migrations (por data/prioridade)
// IMPORTANTE: Migrations vazias ou apenas com comentários serão filtradas automaticamente
const migrationOrder = [
  // 1. Tabelas base (devem ser criadas primeiro)
  '20250625090000_create_campaigns_table.sql',
  '20250627092000_add_ads_creative_fields.sql', // Cria ads se não existir
  '20250624_alter_adsets_add_insights.sql', // Assume que adsets já existe, mas adiciona colunas
  
  // 2. Tabelas de insights (dependem de campaigns, adsets, ads)
  '20250626090000_create_adset_insights_table.sql',
  '20250627090000_create_ad_insights_table.sql',
  
  // 3. Tabelas de sistema
  '20250621_create_sync_status_table.sql',
  '20240618_create_audit_logs_table.sql',
  '20250626092000_create_cache_stats_table.sql',
  
  // 4. Tabelas de IA
  '20250627090500_create_ai_analysis_logs_table.sql',
  '20250627091000_create_ai_anomalies_table.sql',
  
  // 5. Tabelas de metas e objetivos
  '20250122091000_create_adset_goals_table.sql',
  '20250122092000_create_adset_progress_tracking.sql',
  '20250122091500_create_adset_progress_alerts.sql',
  '20250122090500_create_adset_budget_adjustments.sql',
  
  // 6. Tabelas de alertas
  '20250122092500_create_alerts_system.sql',
  
  // 7. Tabelas de logs
  '20250122093000_create_audience_suggestions_logs.sql',
  '20250122093500_create_budget_adjustment_logs.sql',
  '20250122094000_create_lead_quality_logs.sql',
  '20250718_create_meta_activity_logs_table.sql',
  
  // 8. Tabelas auxiliares
  '20250129_create_ad_creatives_table.sql',
  
  // 9. Alterações e ajustes
  '20250625090500_add_campaigns_columns.sql',
  '20250626090500_add_account_id_to_adset_insights.sql',
  '20250626091000_add_adset_name_to_insights.sql',
  '20250626091500_recreate_adset_insights_columns.sql',
  '20250629_add_cpl_to_adset_insights.sql',
  // '20240515_add_meta_leads_columns.sql', // Removida - apenas comentário
  '20250122090000_add_quality_score_to_leads.sql',
  
  // 10. Funções (antes de views)
  '20250627091500_create_exec_sql_function.sql',
  '20250130100500_fix_function_search_paths.sql',
  '20240516140500_clean_duplicate_leads.sql', // Função para limpar duplicados
  
  // 11. Views (depois de tabelas e funções)
  // '20240516140000_create_leads_analysis_view.sql', // No-op — view removida
  
  // 12. RLS (Row Level Security) - deve ser o último
  '20250130100000_enable_rls_on_public_tables.sql',
];

// Tabelas base que precisam ser criadas manualmente se não existirem
// Nota: A estrutura completa de adsets será adicionada pela migration 20250624_alter_adsets_add_insights.sql
const baseTablesSQL = `
-- ============================================
-- TABELAS BASE (devem ser criadas primeiro)
-- ============================================

-- Criar tabela adsets se não existir (estrutura mínima)
-- As colunas adicionais serão adicionadas pela migration 20250624_alter_adsets_add_insights.sql
CREATE TABLE IF NOT EXISTS public.adsets (
    id VARCHAR(255) PRIMARY KEY,
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela meta_leads se não existir (estrutura básica)
-- Colunas adicionais podem ser adicionadas pela migration 20240515_add_meta_leads_columns.sql
CREATE TABLE IF NOT EXISTS public.meta_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(255) UNIQUE,
    ad_id VARCHAR(255),
    adset_id VARCHAR(255),
    campaign_id VARCHAR(255),
    form_id VARCHAR(255),
    created_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_adsets_id ON public.adsets(id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_lead_id ON public.meta_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_ad_id ON public.meta_leads(ad_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_adset_id ON public.meta_leads(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_campaign_id ON public.meta_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_leads_created_time ON public.meta_leads(created_time);
`;

async function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Arquivo não encontrado: ${filename}`);
    return null;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Garantir que o arquivo contém apenas SQL válido
  // Remover qualquer código JavaScript/TypeScript que possa ter sido incluído acidentalmente
  if (content.includes('import ') || content.includes('require(') || content.includes('export ')) {
    console.warn(`⚠️  Arquivo ${filename} contém código não-SQL, pulando...`);
    return null;
  }
  
  return content;
}

async function executeSQL(sql, description) {
  try {
    console.log(`\n📝 ${description}`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente via REST
      // Nota: Supabase REST API não suporta execução direta de SQL
      // Vamos usar uma abordagem diferente
      console.warn(`⚠️  Função exec_sql não disponível, tentando método alternativo...`);
      throw error;
    }
    
    console.log(`✅ ${description} - Sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Erro:`, error.message);
    return false;
  }
}

async function restoreTables() {
  console.log('🚀 Iniciando recuperação de tabelas do Supabase...\n');
  console.log('⚠️  ATENÇÃO: Este script recria apenas a ESTRUTURA das tabelas.');
  console.log('⚠️  Os DADOS precisam ser restaurados manualmente via Supabase Dashboard > Backups\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  // 1. Criar tabelas base primeiro
  console.log('\n📦 Passo 1: Criando tabelas base (adsets, meta_leads)...');
  try {
    // Dividir o SQL em comandos individuais
    const baseCommands = baseTablesSQL.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const cmd of baseCommands) {
      const sql = cmd.trim() + ';';
      if (sql.length > 5) {
        // Usar query direta para DDL
        const { error } = await supabase.from('_temp').select('*').limit(0);
        // Como não podemos executar DDL via REST, vamos instruir o usuário
        console.log('⚠️  Execute manualmente no Supabase Dashboard > SQL Editor:');
        console.log(sql);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao criar tabelas base:', error.message);
  }
  
  // 2. Executar migrations na ordem
  console.log('\n📦 Passo 2: Executando migrations...');
  
  for (const migrationFile of migrationOrder) {
    const sql = await readMigrationFile(migrationFile);
    
    if (!sql) {
      errorCount++;
      continue;
    }
    
    // Remover comentários que começam com -- no início da linha
    const cleanSQL = sql.split('\n')
      .filter(line => !line.trim().startsWith('--') || line.trim().length === 0)
      .join('\n');
    
    const success = await executeSQL(cleanSQL, `Executando ${migrationFile}`);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pequeno delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 Resumo da Recuperação:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('='.repeat(80));
  
  if (errorCount > 0) {
    console.log('\n⚠️  Algumas migrations falharam. Verifique os erros acima.');
    console.log('💡 Dica: Execute as migrations manualmente no Supabase Dashboard > SQL Editor');
  } else {
    console.log('\n✅ Recuperação concluída com sucesso!');
  }
  
  console.log('\n📋 Próximos passos:');
  console.log('1. Verifique se todas as tabelas foram criadas no Supabase Dashboard');
  console.log('2. Restaure os dados dos backups (se disponíveis)');
  console.log('3. Execute os scripts de sincronização para repovoar os dados da Meta API');
}

// Função alternativa: gerar script SQL completo para execução manual
async function generateRecoverySQL() {
  console.log('📝 Gerando script SQL completo para execução manual...\n');
  
  let fullSQL = `-- ============================================
-- Script de Recuperação de Tabelas do Supabase
-- ============================================
-- Gerado em: ${new Date().toISOString()}
-- 
-- IMPORTANTE: 
-- 1. Este script recria apenas a ESTRUTURA das tabelas
-- 2. Os DADOS precisam ser restaurados manualmente via Supabase Dashboard > Backups
-- 3. Execute este script no Supabase Dashboard > SQL Editor
-- 4. Após executar, rode os scripts de sincronização para repovoar os dados
--
-- ============================================
-- TABELAS BASE (devem ser criadas primeiro)
-- ============================================

${baseTablesSQL}

-- ============================================
-- MIGRATIONS (executar na ordem)
-- ============================================

`;
  
  let migrationCount = 0;
  for (const migrationFile of migrationOrder) {
    const sql = await readMigrationFile(migrationFile);
    
    if (sql && sql.trim().length > 0) {
      // Limpar o SQL: remover linhas vazias excessivas e garantir que termina com ;
      let cleanSQL = sql.trim();
      
      // Se a migration está vazia ou só tem comentários, pular
      const sqlWithoutComments = cleanSQL
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
        .join('\n');
      
      if (sqlWithoutComments.trim().length === 0) {
        console.log(`⏭️  Pulando ${migrationFile} (apenas comentários)`);
        continue;
      }
      
      migrationCount++;
      fullSQL += `\n-- ============================================\n`;
      fullSQL += `-- Migration ${migrationCount}: ${migrationFile}\n`;
      fullSQL += `-- ============================================\n\n`;
      fullSQL += cleanSQL;
      
      // Garantir que termina com quebra de linha
      if (!cleanSQL.endsWith('\n')) {
        fullSQL += '\n';
      }
      fullSQL += `\n`;
    } else {
      console.warn(`⚠️  Migration não encontrada ou inválida: ${migrationFile}`);
    }
  }
  
  fullSQL += `\n-- ============================================\n`;
  fullSQL += `-- FIM DO SCRIPT DE RECUPERAÇÃO\n`;
  fullSQL += `-- ============================================\n`;
  fullSQL += `-- Total de migrations executadas: ${migrationCount}\n`;
  fullSQL += `-- Data de geração: ${new Date().toISOString()}\n`;
  
  const outputPath = path.join(__dirname, '..', 'supabase-recovery.sql');
  fs.writeFileSync(outputPath, fullSQL, 'utf8');
  
  console.log(`✅ Script SQL gerado em: ${outputPath}`);
  console.log(`📊 Total de migrations incluídas: ${migrationCount}`);
  console.log('\n📋 Instruções para recuperação:');
  console.log('1. Abra o Supabase Dashboard (https://supabase.com/dashboard)');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em "SQL Editor" no menu lateral');
  console.log('4. Clique em "New query"');
  console.log('5. Cole o conteúdo completo do arquivo supabase-recovery.sql');
  console.log('6. Clique em "Run" ou pressione Ctrl+Enter');
  console.log('7. Aguarde a execução (pode levar alguns minutos)');
  console.log('8. Verifique se todas as tabelas foram criadas em "Table Editor"');
  console.log('\n💡 Próximos passos após recuperar a estrutura:');
  console.log('   - Verifique se há backups disponíveis no Supabase Dashboard > Backups');
  console.log('   - Se houver backups, restaure os dados');
  console.log('   - Execute os scripts de sincronização para repovoar dados da Meta API:');
  console.log('     * node scripts/sync-campaigns-once.js');
  console.log('     * node scripts/sync-adsets-once.js');
  console.log('     * node scripts/sync-ads-once.js');
  console.log('     * node scripts/sync-meta-leads.js');
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);
if (args.includes('--generate-sql')) {
  generateRecoverySQL().catch(console.error);
} else {
  restoreTables().catch(console.error);
}

