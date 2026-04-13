#!/usr/bin/env node
/**
 * Script para Validar o SQL de Recuperação
 * Verifica se o arquivo contém apenas SQL válido
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, '..', 'supabase-recovery.sql');

console.log('🔍 Validando arquivo SQL...\n');

if (!fs.existsSync(sqlFile)) {
  console.error('❌ Arquivo supabase-recovery.sql não encontrado!');
  console.log('💡 Execute: node scripts/restore-supabase-tables.js --generate-sql');
  process.exit(1);
}

const content = fs.readFileSync(sqlFile, 'utf8');

// Verificar se há código JavaScript/TypeScript
// IMPORTANTE: CREATE FUNCTION é SQL válido, não JavaScript!
const jsPatterns = [
  /^import\s+.*from/i,  // import no início da linha
  /^require\s*\(/i,      // require no início da linha
  /^export\s+/i,         // export no início da linha
  /^const\s+\w+\s*=/i,   // const no início da linha
  /^let\s+\w+\s*=/i,     // let no início da linha
  /^var\s+\w+\s*=/i,     // var no início da linha
  /module\.exports/i,
  /process\.env/i,
  /\.env\.local/i
];

let hasErrors = false;

console.log('Verificando padrões JavaScript/TypeScript...');
for (const pattern of jsPatterns) {
  const matches = content.match(pattern);
  if (matches) {
    console.error(`❌ Encontrado código não-SQL: ${pattern}`);
    console.error(`   Linhas com problema:`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        console.error(`   Linha ${index + 1}: ${line.trim().substring(0, 80)}`);
      }
    });
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Arquivo SQL contém código inválido!');
  console.log('\n💡 Solução:');
  console.log('   1. Regenere o arquivo: node scripts/restore-supabase-tables.js --generate-sql');
  console.log('   2. Ou limpe manualmente o arquivo antes de executar no Supabase');
  process.exit(1);
}

// Verificar estrutura básica
const hasCreateTable = /CREATE\s+TABLE/i.test(content);
const hasComments = /^--/.test(content);

if (!hasCreateTable) {
  console.warn('⚠️  Arquivo não contém comandos CREATE TABLE');
}

// Estatísticas
const lines = content.split('\n');
const sqlCommands = content.match(/CREATE\s+(TABLE|INDEX|FUNCTION|VIEW|TRIGGER)/gi) || [];
const comments = lines.filter(line => line.trim().startsWith('--')).length;

console.log('\n✅ Arquivo SQL válido!');
console.log('\n📊 Estatísticas:');
console.log(`   Total de linhas: ${lines.length}`);
console.log(`   Comandos SQL: ${sqlCommands.length}`);
console.log(`   Linhas de comentário: ${comments}`);
console.log(`   Tamanho: ${(content.length / 1024).toFixed(2)} KB`);

console.log('\n📋 Próximos passos:');
console.log('   1. Copie o arquivo supabase-recovery.sql');
console.log('   2. Cole no Supabase Dashboard > SQL Editor');
console.log('   3. Execute o script');
console.log('\n💡 Dica: Use este comando para copiar (macOS):');
console.log('   cat supabase-recovery.sql | pbcopy');

