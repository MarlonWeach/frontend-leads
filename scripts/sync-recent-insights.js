#!/usr/bin/env node

// Script de conveniência para sincronizar insights recentes
// Uso: node scripts/sync-recent-insights.js [dias]

require('dotenv').config({ path: '.env.local' });

const { execSync } = require('child_process');
const path = require('path');

// Função para calcular datas
function getDateRange(days = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Ontem
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args[0]) || 7;
  
  const { startDate, endDate } = getDateRange(days);
  
  console.log('🚀 Script de Sincronização de Insights Recentes');
  console.log('==============================================');
  console.log(`📅 Período: ${startDate} a ${endDate} (últimos ${days} dias)`);
  console.log('');
  
  try {
    // 1. Sincronizar insights de adsets
    console.log('📊 1. Sincronizando insights de adsets...');
    execSync(`node scripts/sync-adset-insights.js --start-date ${startDate} --end-date ${endDate}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('');
    
    // 2. Verificar dados sincronizados
    console.log('🔍 2. Verificando dados sincronizados...');
    execSync(`node scripts/sync-adset-insights.js --check-data --start-date ${startDate} --end-date ${endDate}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('');
    console.log('✅ Sincronização concluída com sucesso!');
    console.log('📊 A página de performance agora deve exibir dados atualizados.');
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, getDateRange }; 