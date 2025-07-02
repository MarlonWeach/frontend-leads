# Testes com OpenAI Real

Este documento explica como executar testes usando a API real do OpenAI ao invés de mocks.

## 🎯 Por que usar OpenAI real?

- **Testes mais confiáveis**: Valida a integração real com a API
- **Detecção de problemas**: Identifica mudanças na API ou prompts
- **Qualidade das respostas**: Verifica se as respostas são úteis e relevantes

## ⚠️ Considerações Importantes

### Custos
- **Cada teste gera custos** na sua conta OpenAI
- **Estimativa**: ~$0.01-0.05 por execução de teste
- **Recomendação**: Use apenas quando necessário

### Rate Limits
- A API tem limites de requisições por minuto
- Testes podem falhar se exceder os limites
- Use timeouts adequados

### Dados Sensíveis
- Evite usar dados reais de clientes
- Use dados de teste fictícios
- Não logue respostas completas da API

## 🚀 Como Usar

### 1. Configurar API Key

```bash
# Opção 1: Variável de ambiente
export OPENAI_API_KEY=sua_chave_aqui

# Opção 2: Arquivo .env (não commitar)
echo "OPENAI_API_KEY=sua_chave_aqui" >> .env
```

### 2. Executar Testes

```bash
# Todos os testes com OpenAI real
npm run test:ai:real

# Apenas testes unitários de AI
npm run test:ai:real:unit

# Todos os testes de AI
npm run test:ai:real:all

# Teste específico
OPENAI_API_KEY=sua_chave npm test test/integration/ai-real.test.ts
```

### 3. Script Automatizado

```bash
# Usar o script que verifica a configuração
./scripts/test-with-openai.sh

# Teste específico
./scripts/test-with-openai.sh test/unit/ai-modules.test.ts
```

## 📋 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run test:ai:real` | Script principal com verificações |
| `npm run test:ai:real:unit` | Testes unitários de AI |
| `npm run test:ai:real:all` | Todos os testes de AI |
| `./scripts/test-with-openai.sh` | Script bash com validações |

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Obrigatório
OPENAI_API_KEY=sua_chave_aqui

# Opcional - para debug
DEBUG=true
NODE_ENV=test
```

### Configurações de Teste

```typescript
// test/config/openai-test-config.ts
export const OPENAI_TEST_CONFIG = {
  realOpenAIConfig: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.3,
    timeout: 30000, // 30 segundos
  }
};
```

## 📊 Comparação: Mock vs Real

| Aspecto | Mock | OpenAI Real |
|---------|------|-------------|
| **Velocidade** | ⚡ Rápido (~100ms) | 🐌 Lento (~2-5s) |
| **Custo** | 💰 Gratuito | 💸 ~$0.01-0.05 |
| **Confiabilidade** | ⚠️ Limitada | ✅ Alta |
| **Detecção de Bugs** | ❌ Não detecta | ✅ Detecta |
| **Qualidade das Respostas** | ❌ Fixa | ✅ Dinâmica |

## 🧪 Exemplos de Teste

### Teste com OpenAI Real

```typescript
describe('AI Integration Tests (Real OpenAI)', () => {
  beforeAll(() => {
    useRealOpenAI = setupTestEnvironment();
  });

  it('should analyze performance data', async () => {
    const analysis = await analyzePerformance(mockData);
    
    if (useRealOpenAI) {
      // Com OpenAI real, esperamos respostas mais elaboradas
      expect(analysis.analysis.length).toBeGreaterThan(50);
    } else {
      // Com mocks, verificamos estrutura básica
      expect(analysis).toHaveProperty('analysis');
    }
  }, useRealOpenAI ? 30000 : 5000); // Timeout maior para OpenAI real
});
```

### Teste Condicional

```typescript
it('should detect anomalies', async () => {
  const anomalies = await detectAnomalies(campaignData);
  
  if (useRealOpenAI) {
    // Validações mais rigorosas com OpenAI real
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].message).toContain('budget');
  } else {
    // Validações básicas com mocks
    expect(Array.isArray(anomalies)).toBe(true);
  }
});
```

## 🛠️ Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"

```bash
# Solução: Configure a variável de ambiente
export OPENAI_API_KEY=sua_chave_aqui
```

### Erro: "Rate limit exceeded"

```bash
# Solução: Aguarde alguns minutos e tente novamente
# Ou use mocks temporariamente
npm test  # Usa mocks por padrão
```

### Erro: "Timeout"

```typescript
// Solução: Aumente o timeout
it('test', async () => {
  // seu teste
}, 60000); // 60 segundos
```

### Testes Falhando com OpenAI Real

1. **Verifique a API key**: Teste em outro lugar
2. **Verifique rate limits**: Aguarde alguns minutos
3. **Verifique prompts**: Pode ter mudanças na API
4. **Use mocks temporariamente**: Para desenvolvimento

## 📈 Monitoramento de Custos

### Estimativa de Custos

```bash
# Por execução de teste
- Teste unitário: ~$0.01
- Teste de integração: ~$0.02-0.05
- Suite completa: ~$0.10-0.20

# Por mês (desenvolvimento ativo)
- 10 execuções/dia: ~$3-6/mês
- 50 execuções/dia: ~$15-30/mês
```

### Dicas para Economizar

1. **Use mocks para desenvolvimento**: `npm test`
2. **Use OpenAI real apenas para validação**: Antes de commits
3. **Configure alertas de custo**: No dashboard OpenAI
4. **Use API key de teste**: Se disponível

## 🔄 Fluxo de Trabalho Recomendado

### Desenvolvimento Diário
```bash
# Use mocks (rápido e gratuito)
npm test
```

### Antes de Commits
```bash
# Valide com OpenAI real
npm run test:ai:real:unit
```

### Antes de Deploy
```bash
# Teste completo com OpenAI real
npm run test:ai:real:all
```

## 📝 Logs e Debug

### Habilitar Logs

```bash
# Para debug detalhado
DEBUG=true npm run test:ai:real:unit
```

### Logs Disponíveis

- ✅ Requisições para OpenAI
- ❌ Respostas completas (segurança)
- ✅ Tempo de resposta
- ✅ Status da requisição
- ✅ Erros e timeouts

## 🎯 Próximos Passos

1. **Configure sua API key**
2. **Execute um teste simples**: `npm run test:ai:real:unit`
3. **Monitore os custos**
4. **Integre no seu fluxo de trabalho**

---

**💡 Dica**: Comece com testes unitários simples antes de executar suites completas para validar a configuração e estimar custos. 