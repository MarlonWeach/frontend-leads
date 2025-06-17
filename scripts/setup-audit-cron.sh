#!/bin/bash

# Script para configurar auditoria automática diária
# Uso: ./scripts/setup-audit-cron.sh

set -e

echo "🔧 Configurando Auditoria Automática Diária"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o script de auditoria existe
if [ ! -f "scripts/audit-daily.js" ]; then
    echo "❌ Erro: Script de auditoria não encontrado"
    exit 1
fi

# Verificar se o .env.local existe
if [ ! -f ".env.local" ]; then
    echo "❌ Erro: Arquivo .env.local não encontrado"
    exit 1
fi

# Obter caminho absoluto do projeto
PROJECT_PATH=$(pwd)
echo "📁 Diretório do projeto: $PROJECT_PATH"

# Obter caminho do Node.js
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Erro: Node.js não encontrado no PATH"
    exit 1
fi
echo "🟢 Node.js encontrado em: $NODE_PATH"

# Criar diretório de logs se não existir
mkdir -p logs
echo "📁 Diretório de logs criado/verificado"

# Testar execução do script
echo "🧪 Testando execução do script..."
if npm run audit:run > /dev/null 2>&1; then
    echo "✅ Script de auditoria funcionando corretamente"
else
    echo "⚠️  Aviso: Script pode ter problemas (verifique logs)"
fi

# Gerar entrada do cron
CRON_ENTRY="0 3 * * * cd \"$PROJECT_PATH\" && $NODE_PATH scripts/audit-daily.js >> logs/audit-daily.log 2>&1"

echo ""
echo "📋 Entrada do Cron para adicionar:"
echo "=================================="
echo "$CRON_ENTRY"
echo ""

echo "📝 Instruções:"
echo "1. Execute: crontab -e"
echo "2. Adicione a linha acima"
echo "3. Salve e saia (Ctrl+X no nano, :wq no vim)"
echo ""

# Perguntar se quer adicionar automaticamente
read -p "🤔 Deseja adicionar automaticamente ao crontab? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Fazer backup do crontab atual
    crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # Adicionar nova entrada
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    echo "✅ Entrada adicionada ao crontab com sucesso!"
    echo "📅 Para verificar: crontab -l"
    echo "📅 Para remover: crontab -r"
else
    echo "ℹ️  Adicione manualmente a entrada do cron mostrada acima"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📊 Para monitorar:"
echo "   tail -f logs/audit-daily.log"
echo ""
echo "📊 Para verificar no Supabase:"
echo "   SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5;" 