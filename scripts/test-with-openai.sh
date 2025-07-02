#!/bin/bash

# Script para executar testes com OpenAI real
# Uso: ./scripts/test-with-openai.sh [test-file]

echo "🧪 Executando testes com OpenAI real..."
echo ""

# Verificar se OPENAI_API_KEY está configurada
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Erro: OPENAI_API_KEY não está configurada"
    echo ""
    echo "Para configurar:"
    echo "1. Obtenha sua API key em: https://platform.openai.com/api-keys"
    echo "2. Configure a variável de ambiente:"
    echo "   export OPENAI_API_KEY=sua_chave_aqui"
    echo ""
    echo "Ou execute diretamente:"
    echo "   OPENAI_API_KEY=sua_chave_aqui npm test"
    echo ""
    exit 1
fi

echo "✅ OPENAI_API_KEY configurada"
echo "⚠️  Cuidado: Testes podem gerar custos na API"
echo ""

# Configurar variáveis de ambiente para testes
export NODE_ENV=test
export DEBUG=true

# Executar testes
if [ -n "$1" ]; then
    echo "🎯 Executando teste específico: $1"
    npm test "$1"
else
    echo "🎯 Executando todos os testes"
    npm test
fi

echo ""
echo "✅ Testes concluídos!" 