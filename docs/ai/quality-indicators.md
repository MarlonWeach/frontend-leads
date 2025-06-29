# Indicadores de Qualidade - Leads Automotivos

## Visão Geral

Este documento define os indicadores de qualidade específicos para leads automotivos gerados via Lead Ads da Meta. Estes indicadores são utilizados pela Inteligência Artificial para avaliar, classificar e otimizar a qualidade dos leads recebidos.

**Última atualização**: Junho 2025  
**Versão**: 1.0  
**Aplicação**: Sistema de IA para análise e otimização de leads

---

## 1. Sistema de Scoring de Qualidade

### 1.1 Escala de Qualidade (0-100)

#### Qualidade Excelente (90-100 pontos)
- **Características**: Lead altamente qualificado, alta probabilidade de conversão
- **Ação**: Contato imediato (< 5 minutos)
- **Prioridade**: Máxima
- **Expectativa de Conversão**: 25-40%

#### Qualidade Alta (75-89 pontos)
- **Características**: Lead bem qualificado, boa probabilidade de conversão
- **Ação**: Contato prioritário (< 15 minutos)
- **Prioridade**: Alta
- **Expectativa de Conversão**: 15-25%

#### Qualidade Média (50-74 pontos)
- **Características**: Lead moderadamente qualificado, probabilidade média
- **Ação**: Contato normal (< 30 minutos)
- **Prioridade**: Média
- **Expectativa de Conversão**: 8-15%

#### Qualidade Baixa (25-49 pontos)
- **Características**: Lead pouco qualificado, baixa probabilidade
- **Ação**: Contato secundário (< 2 horas)
- **Prioridade**: Baixa
- **Expectativa de Conversão**: 3-8%

#### Qualidade Muito Baixa (0-24 pontos)
- **Características**: Lead não qualificado, provável fraude ou erro
- **Ação**: Verificação manual antes do contato
- **Prioridade**: Mínima
- **Expectativa de Conversão**: < 3%

### 1.2 Critérios de Pontuação

#### Dados Pessoais (0-25 pontos)
- **Nome Completo Válido** (0-10 pontos)
  - 10 pontos: Nome e sobrenome reais, sem caracteres especiais
  - 5 pontos: Nome válido mas incompleto
  - 0 pontos: Nome genérico ("teste", "abc", "123")

- **Telefone Válido** (0-10 pontos)
  - 10 pontos: DDD válido, formato correto, não repetido
  - 5 pontos: Formato correto mas DDD suspeito
  - 0 pontos: Telefone inválido ou repetido

- **Email Válido** (0-5 pontos)
  - 5 pontos: Formato correto, domínio real
  - 0 pontos: Email temporário ou inválido

#### Intenção de Compra (0-30 pontos)
- **Período de Compra** (0-15 pontos)
  - 15 pontos: "Imediato" ou "1 mês"
  - 10 pontos: "3 meses"
  - 5 pontos: "6 meses"
  - 0 pontos: "Apenas informações" ou "Não definido"

- **Tipo de Interesse** (0-15 pontos)
  - 15 pontos: "Test drive" ou "Compra"
  - 10 pontos: "Financiamento" ou "Seminovo"
  - 5 pontos: "Informações gerais"
  - 0 pontos: "Apenas curiosidade"

#### Comportamento (0-25 pontos)
- **Tempo de Preenchimento** (0-10 pontos)
  - 10 pontos: 30-120 segundos
  - 5 pontos: 15-30 segundos ou 2-5 minutos
  - 0 pontos: < 15 segundos ou > 5 minutos

- **Horário de Conversão** (0-10 pontos)
  - 10 pontos: 8h-18h (horário comercial)
  - 5 pontos: 18h-22h (horário noturno)
  - 0 pontos: 22h-8h (horário de baixa atividade)

- **Dispositivo** (0-5 pontos)
  - 5 pontos: Mobile (maior conversão)
  - 3 pontos: Desktop
  - 0 pontos: Tablet (menor conversão)

#### Contexto Geográfico (0-20 pontos)
- **Proximidade da Concessionária** (0-15 pontos)
  - 15 pontos: < 10km
  - 10 pontos: 10-30km
  - 5 pontos: 30-50km
  - 0 pontos: > 50km

- **Região de Atuação** (0-5 pontos)
  - 5 pontos: Região atendida
  - 0 pontos: Região não atendida

---

## 2. Indicadores de Fraude e Qualidade Baixa

### 2.1 Red Flags (Desqualificação Automática)

#### Dados Obviamente Falsos
- **Nomes Genéricos**: "teste", "abc", "123", "usuário", "admin"
- **Telefones Inválidos**: DDD inexistente, formato incorreto
- **Emails Temporários**: 10minutemail, temp-mail, guerrillamail
- **Dados Repetidos**: Mesmo telefone/email múltiplas vezes

#### Comportamento Suspeito
- **Preenchimento Muito Rápido**: < 10 segundos
- **Preenchimento Muito Lento**: > 10 minutos
- **Horários Estranhos**: 2h-6h da manhã
- **Padrão de IP**: Muitos leads do mesmo IP

#### Indicadores de Bot
- **Dados Sequenciais**: Nomes como "user1", "user2", "user3"
- **Padrão Repetitivo**: Mesma estrutura de dados
- **Falta de Interação**: Sem movimentos de mouse ou scroll
- **Tempo Consistente**: Mesmo tempo de preenchimento sempre

### 2.2 Indicadores de Tráfego Incentivado

#### Características Específicas
- **CPL Muito Baixo**: < 50% do benchmark da categoria
- **Volume Muito Alto**: > 300% do volume normal
- **Qualidade Inconsistente**: Variação > 50% na qualidade
- **Horários Concentrados**: Muitos leads em horários específicos

#### Padrões de Dados
- **Emails Similares**: Padrão de domínios temporários
- **Telefones Sequenciais**: Números consecutivos
- **Nomes Padronizados**: Estrutura similar nos nomes
- **Localizações Concentradas**: Mesma região geográfica

### 2.3 Indicadores de Competição

#### Sinais de Concorrência
- **Leads de Teste**: Dados de agências ou consultores
- **Pesquisa de Preços**: Interesse apenas em comparação
- **Múltiplas Marcas**: Interesse em várias marcas simultaneamente
- **Comportamento de Espionagem**: Padrões de coleta de informações

---

## 3. Métricas de Validação

### 3.1 Validação em Tempo Real

#### Verificação de Dados
- **Formato de Telefone**: Validação de DDD e estrutura
- **Formato de Email**: Validação de sintaxe e domínio
- **Nome Completo**: Verificação de caracteres válidos
- **Localização**: Confirmação de região atendida

#### Verificação de Comportamento
- **Tempo de Sessão**: Duração da visita antes da conversão
- **Interações**: Cliques, scrolls, movimentos de mouse
- **Páginas Visitadas**: Navegação antes do formulário
- **Dispositivo**: Tipo e características do dispositivo

### 3.2 Validação Pós-Conversão

#### Primeiro Contato
- **Tempo de Resposta**: Velocidade do primeiro contato
- **Taxa de Atendimento**: % de leads que atendem o telefone
- **Qualidade da Conversa**: Interesse demonstrado no contato
- **Agendamento**: % que aceitam agendar test drive

#### Follow-up
- **Comparecimento**: % que comparecem ao agendamento
- **Interesse Mantido**: % que mantêm interesse após contato
- **Qualificação**: Confirmação de dados e interesse
- **Conversão**: % que avançam na jornada de compra

---

## 4. Indicadores de Performance por Categoria

### 4.1 Veículos Econômicos

#### Indicadores de Qualidade
- **CPL Ideal**: R$ 15-35
- **Taxa de Conversão Esperada**: 8-15%
- **Tempo de Resposta Ideal**: < 5 minutos
- **Qualidade Mínima Aceitável**: 60 pontos

#### Características Específicas
- **Público**: Primeira compra, troca por economia
- **Urgência**: Média (1-3 meses)
- **Sensibilidade a Preço**: Alta
- **Influência Familiar**: Média

### 4.2 Veículos Premium

#### Indicadores de Qualidade
- **CPL Ideal**: R$ 45-80
- **Taxa de Conversão Esperada**: 15-25%
- **Tempo de Resposta Ideal**: < 3 minutos
- **Qualidade Mínima Aceitável**: 75 pontos

#### Características Específicas
- **Público**: Troca por upgrade, segunda compra
- **Urgência**: Baixa (2-6 meses)
- **Sensibilidade a Preço**: Média
- **Influência Familiar**: Baixa

### 4.3 SUVs

#### Indicadores de Qualidade
- **CPL Ideal**: R$ 35-60
- **Taxa de Conversão Esperada**: 12-20%
- **Tempo de Resposta Ideal**: < 5 minutos
- **Qualidade Mínima Aceitável**: 70 pontos

#### Características Específicas
- **Público**: Famílias, troca por espaço
- **Urgência**: Média (1-4 meses)
- **Sensibilidade a Preço**: Média
- **Influência Familiar**: Alta

### 4.4 Veículos Comerciais

#### Indicadores de Qualidade
- **CPL Ideal**: R$ 25-50
- **Taxa de Conversão Esperada**: 20-35%
- **Tempo de Resposta Ideal**: < 10 minutos
- **Qualidade Mínima Aceitável**: 80 pontos

#### Características Específicas
- **Público**: Empresários, frotas
- **Urgência**: Variável (3-12 meses)
- **Sensibilidade a Preço**: Alta
- **Influência Familiar**: Baixa

---

## 5. Algoritmo de Classificação Automática

### 5.1 Processo de Scoring

#### Etapa 1: Validação Básica
```javascript
// Exemplo de algoritmo de scoring
function calculateLeadScore(leadData) {
  let score = 0;
  
  // Dados pessoais (0-25 pontos)
  score += validateName(leadData.name); // 0-10
  score += validatePhone(leadData.phone); // 0-10
  score += validateEmail(leadData.email); // 0-5
  
  // Intenção de compra (0-30 pontos)
  score += validatePurchaseTimeline(leadData.timeline); // 0-15
  score += validateInterest(leadData.interest); // 0-15
  
  // Comportamento (0-25 pontos)
  score += validateFillTime(leadData.fillTime); // 0-10
  score += validateHour(leadData.hour); // 0-10
  score += validateDevice(leadData.device); // 0-5
  
  // Contexto geográfico (0-20 pontos)
  score += validateProximity(leadData.location); // 0-15
  score += validateRegion(leadData.region); // 0-5
  
  return Math.min(score, 100);
}
```

#### Etapa 2: Verificação de Red Flags
```javascript
function checkRedFlags(leadData) {
  const redFlags = [];
  
  if (isGenericName(leadData.name)) redFlags.push('generic_name');
  if (isInvalidPhone(leadData.phone)) redFlags.push('invalid_phone');
  if (isTemporaryEmail(leadData.email)) redFlags.push('temp_email');
  if (isDuplicateData(leadData)) redFlags.push('duplicate_data');
  if (isSuspiciousBehavior(leadData)) redFlags.push('suspicious_behavior');
  
  return redFlags;
}
```

#### Etapa 3: Classificação Final
```javascript
function classifyLead(score, redFlags) {
  if (redFlags.length > 2) return 'REJECTED';
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'LOW';
  return 'VERY_LOW';
}
```

### 5.2 Ajustes Dinâmicos

#### Aprendizado Contínuo
- **Feedback de Vendedores**: Avaliação da qualidade real
- **Taxa de Conversão**: Ajuste baseado em resultados
- **Tempo de Resposta**: Otimização baseada em performance
- **Sazonalidade**: Ajustes temporais

#### Adaptação por Campanha
- **Categoria de Veículo**: Benchmarks específicos
- **Região Geográfica**: Padrões locais
- **Público-Alvo**: Características demográficas
- **Criativo**: Influência do material visual

---

## 6. Monitoramento e Alertas

### 6.1 Alertas de Qualidade

#### Alertas Críticos
- **Qualidade Média < 50%**: Investigação imediata
- **Taxa de Rejeição > 30%**: Revisão de campanha
- **CPL < 50% do benchmark**: Suspeita de fraude
- **Volume > 300% do normal**: Verificação de tráfego

#### Alertas de Atenção
- **Qualidade Média < 70%**: Otimização necessária
- **Taxa de Rejeição > 20%**: Monitoramento
- **CPL < 75% do benchmark**: Investigação
- **Volume > 200% do normal**: Verificação

#### Alertas Informativos
- **Qualidade Média < 80%**: Melhoria recomendada
- **Taxa de Rejeição > 10%**: Acompanhamento
- **CPL < 90% do benchmark**: Tendência
- **Volume > 150% do normal**: Crescimento

### 6.2 Relatórios de Qualidade

#### Relatório Diário
- **Qualidade média**: Score médio dos leads
- **Distribuição**: % por categoria de qualidade
- **Red flags**: Quantidade e tipos de problemas
- **Tendências**: Comparação com dias anteriores

#### Relatório Semanal
- **Performance por campanha**: Qualidade por campanha
- **Análise de padrões**: Identificação de tendências
- **Otimizações**: Sugestões de melhoria
- **ROI**: Impacto da qualidade no retorno

#### Relatório Mensal
- **Benchmarks**: Comparação com metas
- **Evolução**: Progresso ao longo do tempo
- **Insights**: Análises profundas
- **Recomendações**: Ações estratégicas

---

## 7. Integração com IA

### 7.1 Uso nos Prompts de IA

#### Contexto de Qualidade
```javascript
// Exemplo de prompt com contexto de qualidade
const qualityContext = `
Contexto de Qualidade Automotiva:
- CPL ideal para ${category}: R$ ${cplRange}
- Qualidade mínima aceitável: ${minQuality} pontos
- Taxa de conversão esperada: ${conversionRate}%
- Tempo de resposta ideal: < ${responseTime} minutos

Lead atual:
- Score de qualidade: ${leadScore} pontos
- Categoria: ${leadCategory}
- Red flags: ${redFlags.join(', ')}
`;
```

#### Análise Inteligente
- **Comparação com Benchmarks**: Análise contextualizada
- **Identificação de Padrões**: Detecção de tendências
- **Sugestões de Otimização**: Recomendações específicas
- **Predição de Performance**: Forecasting baseado em qualidade

### 7.2 Otimização Automática

#### Ajustes de Campanha
- **Segmentação**: Refinamento baseado em qualidade
- **Criativos**: Otimização baseada em performance
- **Horários**: Ajuste baseado em qualidade por período
- **Orçamento**: Redistribuição baseada em ROI

#### Aprendizado Contínuo
- **Feedback Loop**: Melhoria baseada em resultados
- **Adaptação Dinâmica**: Ajustes automáticos
- **Personalização**: Otimização individualizada
- **Predição**: Antecipação de problemas

---

## 8. Implementação Técnica

### 8.1 Configuração no Sistema

#### Parâmetros de Configuração
```javascript
const qualityConfig = {
  // Pesos dos critérios
  weights: {
    personalData: 0.25,
    purchaseIntent: 0.30,
    behavior: 0.25,
    geographic: 0.20
  },
  
  // Thresholds de alerta
  thresholds: {
    critical: 50,
    warning: 70,
    info: 80
  },
  
  // Categorias de veículo
  categories: {
    economic: { minQuality: 60, idealCpl: [15, 35] },
    premium: { minQuality: 75, idealCpl: [45, 80] },
    suv: { minQuality: 70, idealCpl: [35, 60] },
    commercial: { minQuality: 80, idealCpl: [25, 50] }
  }
};
```

#### Integração com APIs
- **Meta API**: Dados de campanhas e anúncios
- **CRM**: Informações de leads e vendas
- **Analytics**: Métricas de conversão
- **Geolocalização**: Dados de proximidade

### 8.2 Monitoramento em Tempo Real

#### Dashboard de Qualidade
- **Score em Tempo Real**: Qualidade dos leads atuais
- **Alertas Automáticos**: Notificações de problemas
- **Tendências**: Gráficos de evolução
- **Comparações**: Benchmark vs. atual

#### Relatórios Automáticos
- **Relatório Diário**: Resumo diário de qualidade
- **Relatório Semanal**: Análise semanal detalhada
- **Relatório Mensal**: Visão estratégica mensal
- **Alertas Especiais**: Notificações de anomalias

---

## 9. Conclusão

Este sistema de indicadores de qualidade fornece uma base sólida para:

- **Avaliação Objetiva**: Métricas quantificáveis de qualidade
- **Detecção de Fraude**: Identificação automática de problemas
- **Otimização Contínua**: Melhoria baseada em dados
- **Integração com IA**: Contexto rico para análises inteligentes

A implementação consistente destes indicadores garante que a IA possa fornecer análises precisas e sugestões relevantes para otimização de campanhas automotivas.

---

**Próximos Passos**:
1. Implementar o sistema de scoring no código
2. Configurar alertas e monitoramento
3. Integrar com os sistemas de IA existentes
4. Validar com dados reais de campanhas
5. Ajustar parâmetros baseado em feedback 