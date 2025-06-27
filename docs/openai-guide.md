# Guia Completo da OpenAI - Dashboard de Lead Ads

## Índice
1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Funcionalidades de IA](#funcionalidades-de-ia)
4. [Limitações Técnicas](#limitações-técnicas)
5. [Estrutura de Custos](#estrutura-de-custos)
6. [Boas Práticas](#boas-práticas)
7. [Monitoramento](#monitoramento)
8. [FAQ](#faq)
9. [Troubleshooting](#troubleshooting)

## Visão Geral

O dashboard utiliza a **OpenAI GPT-4** para fornecer análises inteligentes de campanhas de Lead Ads, incluindo:

- 📊 **Análise de Performance**: Explicações em linguagem natural sobre métricas
- 🔍 **Detecção de Anomalias**: Identificação automática de padrões suspeitos
- 💡 **Sugestões de Otimização**: Recomendações baseadas em dados históricos
- 🤖 **Assistente Virtual**: Chat para tirar dúvidas sobre campanhas

### Benefícios
- ✅ Redução de 80% no tempo de análise manual
- ✅ Detecção proativa de problemas
- ✅ Insights acionáveis em português brasileiro
- ✅ Suporte 24/7 via assistente virtual

## Configuração

### 1. Obter Chave da API

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Faça login ou crie uma conta
3. Navegue para **API Keys**
4. Clique em **Create new secret key**
5. Copie a chave (ela só será exibida uma vez)

### 2. Configurar no Projeto

Adicione a chave no arquivo `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### 3. Verificar Configuração

O sistema testará automaticamente a conexão na primeira utilização. Você pode verificar o status em:
- Dashboard → Página Performance → Painel de IA

## Funcionalidades de IA

### 1. Análise de Performance 📊

**O que faz**: Analisa métricas de campanhas e explica variações em linguagem natural.

**Como usar**:
1. Acesse `/performance`
2. Clique no painel "Análise Inteligente"
3. Selecione "Análise de Performance"
4. Aguarde a análise (3-5 segundos)

**Exemplo de saída**:
```
📈 Análise dos Últimos 7 Dias

Suas campanhas geraram 368 leads com investimento de R$ 15.309, 
resultando em um CPL médio de R$ 41,60. 

DESTAQUES:
• A campanha "SUV Premium" teve o melhor desempenho com CPL de R$ 35,20
• O CTR geral de 1,17% está acima da média do setor (0,9%)
• Recomendo aumentar o orçamento da campanha de melhor performance

ATENÇÃO:
• A campanha "Econômico SP" teve queda de 23% no CTR esta semana
• Considere revisar os criativos ou ajustar a segmentação
```

### 2. Detecção de Anomalias 🔍

**O que faz**: Identifica padrões suspeitos como tráfego incentivado, conversões manuais ou fraudes.

**Tipos de anomalia detectadas**:
- 🚨 **Tráfego Incentivado**: CTR anormalmente alto + baixa qualidade
- ⚠️ **Conversões Manuais**: Padrões suspeitos de timing
- 🔴 **Leads Duplicados**: Mesmo telefone/email em curto período
- 📈 **Picos de Custo**: Gastos acima do esperado
- 📉 **Queda de Performance**: Redução brusca de métricas

**Configuração de Sensibilidade**:
- **Baixa**: Detecta apenas anomalias críticas
- **Média**: Balanceamento entre precisão e recall (recomendado)
- **Alta**: Detecta anomalias sutis (pode gerar falsos positivos)

### 3. Sugestões de Otimização 💡

**O que faz**: Analisa dados históricos e sugere melhorias específicas.

**Tipos de sugestão**:
- 🎯 **Segmentação**: Ajustes de público-alvo
- 🎨 **Criativos**: Melhorias em copies e imagens
- 💰 **Orçamento**: Redistribuição de verba
- ⏰ **Timing**: Melhores horários e dias
- 🧪 **A/B Test**: Testes para otimização

**Níveis de Impacto**:
- 🟢 **Baixo**: Melhorias incrementais (5-15%)
- 🟡 **Médio**: Otimizações significativas (15-30%)
- 🔴 **Alto**: Mudanças transformadoras (30%+)

### 4. Assistente Virtual 🤖

**O que faz**: Responde perguntas sobre campanhas em linguagem natural.

**Exemplos de perguntas**:
- "Por que o CPL aumentou esta semana?"
- "Qual campanha teve melhor performance?"
- "Como melhorar a taxa de conversão?"
- "Quais leads são suspeitos hoje?"

**Sugestões rápidas disponíveis**:
- 📊 Resumo de performance
- 🔍 Verificar anomalias
- 💡 Sugestões de melhoria
- 📈 Análise de tendências

## Limitações Técnicas

### 1. Rate Limits (Limites de Taxa)

| Modelo | Requests/min | Tokens/min | Tokens/dia |
|--------|-------------|------------|------------|
| GPT-4 | 500 | 30,000 | 300,000 |
| GPT-3.5 | 3,500 | 160,000 | 1,000,000 |

**Mitigação implementada**:
- Cache de respostas por 5 minutos
- Retry automático com backoff exponencial
- Fallback para análise básica se limite atingido

### 2. Tamanho de Contexto

- **GPT-4**: Máximo 8,192 tokens (~6,000 palavras)
- **GPT-3.5**: Máximo 4,096 tokens (~3,000 palavras)

**Estratégia de otimização**:
- Resumo automático de dados extensos
- Priorização de métricas mais relevantes
- Chunking de análises grandes

### 3. Tempo de Resposta

- **Típico**: 2-5 segundos
- **Máximo**: 30 segundos (timeout)
- **Picos de tráfego**: Pode aumentar para 10-15 segundos

### 4. Disponibilidade

- **SLA OpenAI**: 99.9% uptime
- **Manutenções**: Raras, geralmente notificadas
- **Fallback**: Sistema continua funcionando sem IA

## Estrutura de Custos

### 1. Preços por Modelo (Dezembro 2024)

| Modelo | Input (por 1K tokens) | Output (por 1K tokens) |
|--------|---------------------|----------------------|
| GPT-4 | $0.03 | $0.06 |
| GPT-3.5 Turbo | $0.001 | $0.002 |

### 2. Estimativa de Uso Mensal

**Cenário Típico** (5 análises/dia):

| Funcionalidade | Tokens médios | Custo/uso | Custo mensal |
|---------------|---------------|-----------|--------------|
| Análise Performance | 1,500 | $0.075 | $11.25 |
| Detecção Anomalias | 800 | $0.040 | $6.00 |
| Sugestões Otimização | 1,200 | $0.060 | $9.00 |
| Chat Assistente | 600 | $0.030 | $4.50 |
| **TOTAL** | | | **$30.75** |

**Cenário Intenso** (20 análises/dia):
- Custo mensal estimado: **$123**

### 3. Estratégias de Redução de Custos

1. **Cache Inteligente** ✅
   - Respostas similares reutilizadas por 5 minutos
   - Redução de ~40% nos custos

2. **Otimização de Prompts** ✅
   - Prompts concisos e específicos
   - Redução de ~25% nos tokens

3. **Modelo Híbrido** (Futuro)
   - GPT-3.5 para análises simples
   - GPT-4 apenas para casos complexos
   - Redução estimada de ~60% nos custos

4. **Limites por Usuário** ✅
   - Máximo 100 requests/hora por usuário
   - Previne uso excessivo

### 4. Monitoramento de Custos

- **Dashboard**: Custos em tempo real
- **Alertas**: Email quando > $100/dia
- **Relatórios**: Breakdown mensal por funcionalidade
- **Budgets**: Limite configurável por mês

## Boas Práticas

### 1. Para Usuários

**✅ Faça**:
- Use análises para decisões estratégicas
- Verifique sugestões antes de implementar
- Reporte falsos positivos em anomalias
- Faça perguntas específicas no chat

**❌ Evite**:
- Solicitar análises desnecessárias
- Ignorar alertas de anomalias
- Implementar sugestões sem validação
- Fazer perguntas muito genéricas

### 2. Para Desenvolvedores

**✅ Faça**:
- Implemente cache para respostas similares
- Use timeouts apropriados (30s)
- Monitore rate limits e custos
- Valide entrada antes de enviar para IA

**❌ Evite**:
- Enviar dados sensíveis desnecessários
- Fazer requests síncronos longos
- Ignorar erros de rate limit
- Prompts excessivamente longos

### 3. Otimização de Performance

1. **Cache Estratégico**:
   ```javascript
   // Cache por tipo de análise + período
   const cacheKey = `analysis_${type}_${startDate}_${endDate}`;
   ```

2. **Prompts Eficientes**:
   ```javascript
   // Específico e direto
   const prompt = `Analise CPL: ${cpl} vs meta: ${target}. 
   Campanha: ${name}. Período: ${period}. 
   Explique variação em 2 parágrafos.`;
   ```

3. **Processamento Assíncrono**:
   ```javascript
   // Para análises longas
   const analysis = await processInBackground(data);
   ```

## Monitoramento

### 1. Métricas Importantes

**Performance**:
- Tempo médio de resposta
- Taxa de sucesso das requests
- Cache hit rate
- Tokens utilizados por dia

**Custos**:
- Gasto diário/mensal
- Custo por funcionalidade
- Projeção de gastos
- Comparação com budget

**Qualidade**:
- Feedback dos usuários
- Taxa de adoção de sugestões
- Precisão de anomalias
- Satisfação com chat

### 2. Alertas Configurados

- 🚨 **Crítico**: Custo > $200/dia
- ⚠️ **Aviso**: Rate limit atingido
- 📊 **Info**: 1000+ requests/dia
- 🔧 **Manutenção**: API indisponível

### 3. Dashboards

**Para Gestores**:
- Custo mensal vs budget
- ROI das funcionalidades de IA
- Adoção por usuário
- Principais insights gerados

**Para Desenvolvedores**:
- Performance das APIs
- Logs de erro detalhados
- Métricas de cache
- Distribuição de tokens

## FAQ

### Configuração e Setup

**P: Como obter uma chave da OpenAI?**
R: Acesse platform.openai.com, crie uma conta, vá em API Keys e gere uma nova chave. Você precisará adicionar um método de pagamento.

**P: A chave funciona imediatamente?**
R: Sim, mas pode haver um delay de alguns minutos. O sistema testará automaticamente a conexão.

**P: Preciso de conta paga?**
R: Sim, as funcionalidades requerem acesso à API paga da OpenAI. O crédito gratuito é limitado.

### Custos e Billing

**P: Quanto custa por mês?**
R: Varia conforme uso. Estimativa: $10-40/mês para uso típico (5 análises/dia). Veja seção de custos para detalhes.

**P: Como controlar gastos?**
R: Configure alertas no dashboard, use o cache inteligente e monitore o uso diário.

**P: Existe limite de uso?**
R: Sim, 100 requests/hora por usuário para evitar custos excessivos.

### Funcionalidades

**P: As análises são precisas?**
R: A IA fornece insights baseados em padrões dos dados, mas sempre valide antes de implementar sugestões.

**P: Como melhorar a qualidade das respostas?**
R: Seja específico nas perguntas, forneça contexto adequado e use dados de qualidade.

**P: O sistema funciona offline?**
R: Não, requer conexão com a API da OpenAI. Há fallback para análises básicas.

### Problemas Técnicos

**P: "Rate limit exceeded" - o que fazer?**
R: Aguarde alguns minutos e tente novamente. O sistema tem retry automático.

**P: Resposta muito lenta ou timeout?**
R: Pode ser pico de tráfego na OpenAI. Tente novamente em alguns minutos.

**P: Erro de autenticação?**
R: Verifique se a chave da API está correta no arquivo .env.local.

### Privacidade e Segurança

**P: Os dados são seguros?**
R: A OpenAI não treina modelos com dados via API. Veja política de privacidade da OpenAI.

**P: Dados sensíveis são enviados?**
R: Apenas métricas agregadas são enviadas, nunca dados pessoais de leads.

**P: Posso desativar a IA?**
R: Sim, remova a chave OPENAI_API_KEY do .env.local. O sistema funcionará sem IA.

## Troubleshooting

### Problemas Comuns

#### 1. Erro: "Invalid API Key"

**Sintomas**: Mensagem de erro de autenticação
**Causa**: Chave incorreta ou expirada
**Solução**:
```bash
# Verifique o arquivo .env.local
cat .env.local | grep OPENAI_API_KEY

# Deve mostrar:
OPENAI_API_KEY=sk-proj-...
```

#### 2. Erro: "Rate limit exceeded"

**Sintomas**: Muitas requests rejeitadas
**Causa**: Limite de requests/minuto atingido
**Solução**:
- Aguarde 1 minuto
- Sistema fará retry automático
- Considere upgrade do plano OpenAI

#### 3. Timeout nas Respostas

**Sintomas**: Análises não carregam
**Causa**: OpenAI sobrecarregada ou prompt muito longo
**Solução**:
- Tente novamente em alguns minutos
- Reduza o período de análise
- Contate suporte se persistir

#### 4. Qualidade Baixa das Análises

**Sintomas**: Respostas genéricas ou irrelevantes
**Causa**: Dados insuficientes ou prompt inadequado
**Solução**:
- Verifique se há dados suficientes no período
- Use períodos de 7+ dias para análises
- Reporte problemas específicos

#### 5. Custos Elevados

**Sintomas**: Gasto maior que esperado
**Causa**: Uso intensivo ou prompts ineficientes
**Solução**:
- Revise relatório de uso no dashboard
- Configure alertas de custo
- Otimize frequência de análises

### Logs e Debugging

**Localização dos logs**:
```bash
# Logs do servidor Next.js
tail -f .next/server.log

# Logs específicos da IA
grep "AI Service" .next/server.log
```

**Informações úteis para suporte**:
- Timestamp do erro
- Mensagem de erro completa
- Dados enviados (sem informações sensíveis)
- Modelo usado (GPT-4/GPT-3.5)

### Contato e Suporte

**Para problemas técnicos**:
- Verifique este guia primeiro
- Consulte logs do sistema
- Reporte com informações detalhadas

**Para problemas de billing**:
- Acesse dashboard.openai.com
- Verifique usage e billing
- Contate suporte da OpenAI se necessário

---

## Recursos Adicionais

- [Documentação Oficial OpenAI](https://platform.openai.com/docs)
- [Pricing OpenAI](https://openai.com/pricing)
- [Status da API](https://status.openai.com)
- [Comunidade OpenAI](https://community.openai.com)

---

**Última atualização**: Junho 2025  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento 