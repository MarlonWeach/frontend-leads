#!/bin/bash

# Exemplo de como executar testes com OpenAI real
# 
# IMPORTANTE: Substitua 'sua_chave_aqui' pela sua API key real
# ⚠️  CUIDADO: Testes com OpenAI real geram custos!

echo "🧪 Exemplo: Testes com OpenAI Real"
echo ""

# Exemplo 1: Executar com API key inline
echo "📝 Exemplo 1: API key inline"
echo "OPENAI_API_KEY=sua_chave_aqui npm run test:ai:real:unit"
echo ""

# Exemplo 2: Configurar variável de ambiente
echo "📝 Exemplo 2: Variável de ambiente"
echo "export OPENAI_API_KEY=sua_chave_aqui"
echo "npm run test:ai:real:unit"
echo ""

# Exemplo 3: Usar script automatizado
echo "📝 Exemplo 3: Script automatizado"
echo "OPENAI_API_KEY=sua_chave_aqui ./scripts/test-with-openai.sh"
echo ""

# Exemplo 4: Teste específico
echo "📝 Exemplo 4: Teste específico"
echo "OPENAI_API_KEY=sua_chave_aqui npm test test/integration/ai-real.test.ts"
echo ""

echo "💡 Dicas:"
echo "- Comece com testes unitários simples"
echo "- Monitore os custos no dashboard OpenAI"
echo "- Use mocks para desenvolvimento diário"
echo "- Use OpenAI real apenas para validação"
echo ""

echo "📊 Estimativa de custos:"
echo "- Teste unitário: ~$0.01"
echo "- Teste de integração: ~$0.02-0.05"
echo "- Suite completa: ~$0.10-0.20"
echo ""

echo "🔗 Obter API key: https://platform.openai.com/api-keys" 