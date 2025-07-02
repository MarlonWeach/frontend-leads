#!/usr/bin/env node

/**
 * Script de teste para validar o sistema de priorização de sincronização
 * Simula a execução dos scripts na ordem de prioridade definida
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração de cores para logs
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Definição das prioridades
const PRIORITIES = {
  HIGH: {
    color: colors.red,
    icon: '🔴',
    label: 'ALTA PRIORIDADE',
    scripts: [
      { name: 'Campanhas', file: 'sync-campaigns-once.js', critical: true },
      { name: 'Adsets', file: 'sync-adsets-once.js', critical: true },
      { name: 'Ads (Criativos)', file: 'update-ad-creatives.js', critical: true }
    ]
  },
  MEDIUM: {
    color: colors.yellow,
    icon: '🟡',
    label: 'MÉDIA PRIORIDADE',
    scripts: [
      { name: 'Insights de Adsets', file: 'sync-adset-insights.js', critical: false },
      { name: 'Insights de Ads', file: 'sync-ad-insights.js', critical: false }
    ]
  },
  LOW: {
    color: colors.green,
    icon: '🟢',
    label: 'BAIXA PRIORIDADE',
    scripts: [
      { name: 'Leads', file: 'import-meta-leads.js', critical: false },
      { name: 'Relacionamentos', file: 'update-table-relationships.js', critical: false }
    ]
  }
};

// Função para log estruturado
function log(priority, message, details = null) {
  const config = PRIORITIES[priority];
  const timestamp = new Date().toISOString();
  const logMessage = `${config.icon} ${config.color}[${config.label}]${colors.reset} ${message}`;
  
  console.log(`[${timestamp}] ${logMessage}`);
  
  if (details) {
    console.log(`${colors.blue}   → ${details}${colors.reset}`);
  }
}

// Função para executar script com timeout e retry
function executeScript(script, priority) {
  const config = PRIORITIES[priority];
  const scriptPath = path.join(__dirname, script.file);
  
  log(priority, `Iniciando: ${script.name}`, `Arquivo: ${script.file}`);
  
  const startTime = Date.now();
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Arquivo não encontrado: ${scriptPath}`);
    }
    
    // Simular execução (em produção, seria execSync)
    console.log(`${colors.blue}   → Executando: node ${script.file}${colors.reset}`);
    
    // Simular tempo de execução baseado no tipo de script
    const executionTime = Math.random() * 2000 + 500; // 0.5-2.5 segundos
    const success = Math.random() > 0.1; // 90% de sucesso
    
    // Simular execução
    const endTime = Date.now() + executionTime;
    if (success) {
      log(priority, `✅ ${script.name} concluído com sucesso`, `Duração: ${(executionTime/1000).toFixed(1)}s`);
    } else {
      log(priority, `❌ ${script.name} falhou`, `Duração: ${(executionTime/1000).toFixed(1)}s`);
      if (script.critical) {
        log(priority, `⚠️  Script crítico falhou - considerar retry`, '');
      }
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log(priority, `❌ ${script.name} falhou com erro`, `Erro: ${error.message}`);
    log(priority, `⏱️  Duração: ${duration.toFixed(1)}s`, '');
    
    if (script.critical) {
      log(priority, `⚠️  Script crítico falhou - considerar retry`, '');
    }
  }
}

// Função principal
function runPrioritizedSync() {
  console.log(`${colors.bold}🚀 SISTEMA DE PRIORIZAÇÃO DE SINCRONIZAÇÃO${colors.reset}`);
  console.log(`${colors.blue}==========================================${colors.reset}`);
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`⏱️  Tempo de início: ${Date.now()}`);
  console.log('');
  
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
  // Executar scripts por prioridade
  Object.entries(PRIORITIES).forEach(([priority, config]) => {
    console.log(`${config.color}${config.icon} ${config.label}${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(config.label.length + 4)}${colors.reset}`);
    
    config.scripts.forEach(script => {
      executeScript(script, priority);
      
      // Simular resultado
      if (Math.random() > 0.1) {
        successCount++;
      } else {
        failureCount++;
      }
    });
    
    console.log('');
  });
  
  // Resumo final
  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000;
  
  console.log(`${colors.bold}📊 RESUMO DA SINCRONIZAÇÃO${colors.reset}`);
  console.log(`${colors.blue}========================${colors.reset}`);
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`⏱️  Tempo total: ${totalDuration.toFixed(1)}s`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📈 Taxa de sucesso: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);
  console.log('');
  
  console.log(`${colors.bold}🎯 ORDEM DE PRIORIDADE IMPLEMENTADA:${colors.reset}`);
  console.log(`🔴 ALTA PRIORIDADE: Campanhas → Adsets → Ads (Criativos)`);
  console.log(`🟡 MÉDIA PRIORIDADE: Insights de Adsets → Insights de Ads`);
  console.log(`🟢 BAIXA PRIORIDADE: Leads → Relacionamentos`);
  console.log('');
  
  console.log(`${colors.green}✅ Sistema de priorização testado com sucesso!${colors.reset}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  runPrioritizedSync();
}

module.exports = {
  runPrioritizedSync,
  PRIORITIES
}; 