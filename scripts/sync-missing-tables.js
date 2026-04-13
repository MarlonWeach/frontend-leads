#!/usr/bin/env node
/**
 * Script para Sincronizar Apenas as Tabelas que Estão Vazias
 * 
 * Executa apenas os scripts necessários para preencher as tabelas vazias,
 * na ordem correta respeitando as dependências.
 * 
 * Uso: node scripts/sync-missing-tables.js
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const path = require('path');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(icon, message, color = colors.reset) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${color}${icon} [${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

function executeScript(scriptName, description) {
  const scriptPath = path.join(__dirname, scriptName);
  
  log('🚀', `Iniciando: ${description}`, colors.blue);
  log('📝', `Executando: ${scriptName}`, colors.cyan);
  
  try {
    const startTime = Date.now();
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: process.env
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('✅', `${description} - Concluído em ${duration}s`, colors.green);
    return { success: true, duration };
  } catch (error) {
    log('❌', `${description} - Erro`, colors.red);
    return { success: false, error: error.message };
  }
}

async function main() {
  logSection('🔄 SINCRONIZAÇÃO DE TABELAS FALTANTES');
  
  // Scripts a executar na ordem correta
  const scriptsToRun = [
    {
      script: 'sync-campaigns-once.js',
      description: 'Sincronizar Campanhas (campaigns)',
      table: 'campaigns',
      critical: true,
      reason: 'Base para todas as outras tabelas'
    },
    {
      script: 'sync-ads-once.js',
      description: 'Sincronizar Anúncios (ads)',
      table: 'ads',
      critical: true,
      reason: 'Depende de adsets (já sincronizado)'
    },
    {
      script: 'sync-ad-insights-account.js',
      description: 'Sincronizar Insights de Ads (ad_insights)',
      table: 'ad_insights',
      critical: false,
      reason: 'Depende de ads'
    },
    {
      script: 'sync-meta-leads.js',
      description: 'Sincronizar Leads (meta_leads)',
      table: 'meta_leads',
      critical: false,
      reason: 'Dados de leads da Meta API'
    },
    {
      script: 'update-ad-creatives.js',
      description: 'Atualizar Criativos (ad_creatives)',
      table: 'ad_creatives',
      critical: false,
      reason: 'Dados de criativos dos anúncios'
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];
  
  for (const { script, description, table, critical, reason } of scriptsToRun) {
    logSection(`📦 ${description}`);
    log('ℹ️', `Tabela: ${table}`, colors.cyan);
    log('ℹ️', `Motivo: ${reason}`, colors.cyan);
    
    if (critical) {
      log('⚠️', 'Este script é CRÍTICO - deve ser executado com sucesso', colors.yellow);
    }
    
    const result = executeScript(script, description);
    results.push({ ...result, script, description, table, critical });
    
    if (result.success) {
      successCount++;
      log('✅', `${description} concluído com sucesso!`, colors.green);
    } else {
      errorCount++;
      if (critical) {
        log('❌', `ERRO CRÍTICO em ${description}!`, colors.red);
        log('⚠️', 'Scripts subsequentes podem falhar', colors.yellow);
      } else {
        log('⚠️', `${description} falhou, mas não é crítico`, colors.yellow);
      }
    }
    
    // Delay entre scripts para evitar rate limiting
    if (result.success) {
      log('⏳', 'Aguardando 3 segundos antes do próximo script...', colors.cyan);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Resumo final
  logSection('📊 RESUMO DA SINCRONIZAÇÃO');
  
  console.log(`${colors.green}✅ Scripts executados com sucesso: ${successCount}${colors.reset}`);
  if (errorCount > 0) {
    console.log(`${colors.red}❌ Scripts com erro: ${errorCount}${colors.reset}`);
  }
  
  console.log('\n📋 Detalhes:');
  results.forEach(({ script, description, success, duration, error, critical }) => {
    const icon = success ? '✅' : '❌';
    const color = success ? colors.green : colors.red;
    const status = success ? `Concluído em ${duration}s` : `Erro: ${error}`;
    const criticalMark = critical ? ' [CRÍTICO]' : '';
    console.log(`${color}${icon} ${description}${criticalMark}${colors.reset}`);
    console.log(`   ${status}`);
  });
  
  if (errorCount > 0) {
    console.log('\n⚠️  Scripts que falharam:');
    results
      .filter(r => !r.success)
      .forEach(({ script, description, critical }) => {
        console.log(`   ${colors.red}❌ ${description}${critical ? ' [CRÍTICO]' : ''}${colors.reset}`);
        console.log(`      Execute manualmente: node scripts/${script}`);
      });
  }
  
  console.log('\n' + '='.repeat(80));
  log('📋', 'Próximos passos:', colors.cyan);
  console.log('   1. Verifique os dados no Supabase Dashboard > Table Editor');
  console.log('   2. Execute: node scripts/check-tables-data.js para verificar novamente');
  if (errorCount > 0) {
    console.log('   3. Execute os scripts que falharam individualmente');
  }
  console.log('='.repeat(80) + '\n');
}

main().catch(error => {
  log('💥', `Erro fatal: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

