#!/usr/bin/env node
/**
 * Script Master para Sincronizar Todos os Dados da Meta API
 * 
 * Executa todos os scripts de sincronização na ordem correta,
 * respeitando as dependências entre as tabelas.
 * 
 * Ordem de execução:
 * 1. Campaigns (base - não depende de nada)
 * 2. Adsets (depende de campaigns)
 * 3. Ads (depende de adsets)
 * 4. Insights de Adsets (depende de adsets)
 * 5. Insights de Ads (depende de ads)
 * 6. Leads (pode ser feito em paralelo, mas melhor depois)
 * 7. Criativos e relacionamentos (opcional)
 * 
 * Uso: node scripts/sync-all-data.js
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
    return true;
  } catch (error) {
    log('❌', `${description} - Erro: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// Verificar variáveis de ambiente
function checkEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_META_ACCESS_TOKEN',
    'NEXT_PUBLIC_META_ACCOUNT_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌', `Variáveis de ambiente faltando: ${missing.join(', ')}`, colors.red);
    log('💡', 'Verifique o arquivo .env.local', colors.yellow);
    process.exit(1);
  }
  
  log('✅', 'Variáveis de ambiente configuradas', colors.green);
}

async function main() {
  logSection('🔄 SINCRONIZAÇÃO COMPLETA DE DADOS DA META API');
  
  // Verificar ambiente
  checkEnv();
  
  const scripts = [
    // FASE 1: Dados Base (ordem crítica)
    {
      script: 'sync-campaigns-once.js',
      description: 'Sincronizar Campanhas',
      phase: 1,
      critical: true
    },
    {
      script: 'sync-adsets-once.js',
      description: 'Sincronizar Adsets',
      phase: 1,
      critical: true
    },
    {
      script: 'sync-ads-once.js',
      description: 'Sincronizar Anúncios (Ads)',
      phase: 1,
      critical: true
    },
    
    // FASE 2: Insights (dependem dos dados base)
    {
      script: 'sync-adset-insights.js',
      description: 'Sincronizar Insights de Adsets',
      phase: 2,
      critical: false
    },
    {
      script: 'sync-ad-insights-account.js',
      description: 'Sincronizar Insights de Ads (conta, nivel ad — contagens de lead)',
      phase: 2,
      critical: false
    },
    
    // FASE 3: Dados Complementares
    {
      script: 'sync-meta-leads.js',
      description: 'Sincronizar Leads',
      phase: 3,
      critical: false
    },
    {
      script: 'update-ad-creatives.js',
      description: 'Atualizar Criativos de Anúncios',
      phase: 3,
      critical: false
    },
    {
      script: 'update-table-relationships.js',
      description: 'Atualizar Relacionamentos entre Tabelas',
      phase: 3,
      critical: false
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  let currentPhase = 0;
  
  for (const { script, description, phase, critical } of scripts) {
    // Mostrar separador de fase
    if (phase !== currentPhase) {
      currentPhase = phase;
      logSection(`FASE ${phase}: ${phase === 1 ? 'Dados Base' : phase === 2 ? 'Insights' : 'Dados Complementares'}`);
    }
    
    const success = executeScript(script, description);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
      
      if (critical) {
        log('⚠️', 'Script crítico falhou. Continuando com os próximos...', colors.yellow);
        log('💡', 'Você pode executar este script novamente depois', colors.cyan);
      }
    }
    
    // Pequeno delay entre scripts para evitar rate limiting
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Resumo final
  logSection('📊 RESUMO DA SINCRONIZAÇÃO');
  
  console.log(`${colors.green}✅ Scripts executados com sucesso: ${successCount}${colors.reset}`);
  if (errorCount > 0) {
    console.log(`${colors.red}❌ Scripts com erro: ${errorCount}${colors.reset}`);
  }
  console.log(`${colors.cyan}📊 Total de scripts: ${scripts.length}${colors.reset}`);
  
  if (errorCount === 0) {
    log('🎉', 'Sincronização completa concluída com sucesso!', colors.green);
  } else {
    log('⚠️', 'Alguns scripts falharam. Verifique os erros acima.', colors.yellow);
    log('💡', 'Você pode executar os scripts que falharam individualmente:', colors.cyan);
    scripts.forEach(({ script, description }) => {
      console.log(`   node scripts/${script}  # ${description}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  log('📋', 'Próximos passos:', colors.cyan);
  console.log('   1. Verifique os dados no Supabase Dashboard > Table Editor');
  console.log('   2. Execute os scripts que falharam individualmente, se necessário');
  console.log('   3. Configure a sincronização automática via GitHub Actions');
  console.log('='.repeat(80) + '\n');
}

// Executar
main().catch(error => {
  log('💥', `Erro fatal: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

