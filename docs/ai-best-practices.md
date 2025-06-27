# Boas Práticas de IA - Dashboard de Lead Ads

## Índice
1. [Princípios Fundamentais](#princípios-fundamentais)
2. [Otimização de Prompts](#otimização-de-prompts)
3. [Gerenciamento de Custos](#gerenciamento-de-custos)
4. [Performance e Cache](#performance-e-cache)
5. [Qualidade e Precisão](#qualidade-e-precisão)
6. [Segurança e Privacidade](#segurança-e-privacidade)
7. [Monitoramento e Alertas](#monitoramento-e-alertas)
8. [Desenvolvimento e Manutenção](#desenvolvimento-e-manutenção)

## Princípios Fundamentais

### 1. IA como Assistente, não Substituto
- ✅ Use IA para **acelerar análises**, não substituir julgamento humano
- ✅ **Valide sempre** as sugestões antes de implementar
- ✅ Mantenha **supervisão humana** em decisões críticas
- ❌ Nunca implemente sugestões automaticamente sem revisão

### 2. Dados de Qualidade = Insights de Qualidade
- ✅ Garanta **dados limpos e consistentes**
- ✅ Use **períodos representativos** (mínimo 7 dias)
- ✅ Verifique **completude dos dados** antes da análise
- ❌ Não analise períodos com dados incompletos

### 3. Contexto é Fundamental
- ✅ Forneça **contexto específico** do setor automotivo
- ✅ Inclua **informações sazonais** relevantes
- ✅ Considere **eventos externos** que afetam performance
- ❌ Não faça análises genéricas sem contexto

## Otimização de Prompts

### 1. Estrutura de Prompts Eficientes

**✅ Bom Exemplo**:
```
Contexto: Campanha de lead ads para test drive de SUVs premium
Período: Últimos 7 dias (21-27/06/2025)
Dados: CPL atual R$ 45,20 vs meta R$ 35,00 (+29%)
CTR: 1,2% vs benchmark 0,9%
Conversões: 125 leads

Analise: Por que o CPL está acima da meta apesar do bom CTR?
Foque em: Segmentação, qualidade do tráfego, horários de veiculação
Resposta: 2 parágrafos, português brasileiro, tom profissional
```

**❌ Exemplo Ruim**:
```
Analise minha campanha e me diga o que está acontecendo
```

### 2. Elementos Essenciais

1. **Contexto Específico**:
   - Tipo de produto (econômico, premium, SUV, etc.)
   - Objetivo da campanha (test drive, cotação, newsletter)
   - Público-alvo (idade, região, renda)

2. **Dados Estruturados**:
   - Métricas atuais vs metas/benchmarks
   - Período de análise claro
   - Tendências recentes

3. **Instruções Claras**:
   - Foco específico da análise
   - Formato de resposta desejado
   - Tom e linguagem

### 3. Prompts por Funcionalidade

#### Análise de Performance
```
CONTEXTO: {contexto_campanha}
MÉTRICAS: {metricas_formatadas}
PERÍODO: {periodo}
TENDÊNCIA: {tendencia_resumida}

Analise a performance e explique:
1. Principais fatores que influenciam as métricas
2. Comparação com benchmarks do setor automotivo
3. Recomendações específicas e acionáveis

Resposta em português brasileiro, máximo 200 palavras.
```

#### Detecção de Anomalias
```
DADOS SUSPEITOS: {dados_anomalos}
CONTEXTO: {contexto_campanha}
PADRÕES NORMAIS: {benchmarks}

Analise se há anomalias reais considerando:
- Padrões típicos do setor automotivo
- Sazonalidade (fim de mês, feriados, etc.)
- Eventos externos (lançamentos, promoções)

Classifique: CRÍTICO/MODERADO/BAIXO e explique o motivo.
```

#### Sugestões de Otimização
```
PERFORMANCE ATUAL: {metricas_atuais}
HISTÓRICO: {dados_historicos}
OBJETIVO: {objetivo_campanha}

Sugira otimizações específicas para:
1. Reduzir CPL mantendo qualidade
2. Melhorar taxa de conversão
3. Otimizar segmentação

Priorize sugestões por impacto (ALTO/MÉDIO/BAIXO) e facilidade de implementação.
```

## Gerenciamento de Custos

### 1. Estratégias de Redução

#### Cache Inteligente (Implementado)
```javascript
// Cache por contexto específico
const cacheKey = `${analysisType}_${campaignId}_${dateRange}_${hash(data)}`;
const cacheTTL = 5 * 60 * 1000; // 5 minutos

// Verificar cache antes de chamar IA
const cached = await getFromCache(cacheKey);
if (cached && !isExpired(cached)) {
  return cached.result;
}
```

#### Otimização de Tokens
- ✅ **Remova dados desnecessários** antes de enviar
- ✅ **Resuma dados extensos** automaticamente
- ✅ **Use abreviações** para campos repetitivos
- ❌ Não envie dados brutos sem processamento

#### Limites por Usuário
```javascript
// Implementação de rate limiting
const userLimits = {
  hourly: 100,
  daily: 500,
  monthly: 10000
};

// Verificar antes de processar
if (await checkUserLimit(userId, 'hourly') > userLimits.hourly) {
  throw new Error('Limite hourly atingido');
}
```

### 2. Monitoramento de Custos

#### Métricas Importantes
- **Custo por análise**: Tracking por tipo de funcionalidade
- **Tokens por request**: Média e tendências
- **Cache hit rate**: Eficiência do cache
- **Custo por usuário**: Distribuição de uso

#### Alertas Configurados
```javascript
const costAlerts = {
  daily: 200,    // $200/dia
  weekly: 1000,  // $1000/semana
  monthly: 3000  // $3000/mês
};

// Verificar e alertar
if (dailyCost > costAlerts.daily) {
  await sendAlert('HIGH_COST', { cost: dailyCost, limit: costAlerts.daily });
}
```

### 3. Otimização por Modelo

#### Modelo Híbrido (Futuro)
```javascript
// Usar GPT-3.5 para análises simples
const useGPT4 = (
  analysisType === 'complex_optimization' ||
  dataSize > 5000 ||
  requiresDeepAnalysis
);

const model = useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
```

## Performance e Cache

### 1. Estratégias de Cache

#### Cache por Contexto
```javascript
// Cache específico por contexto
const generateCacheKey = (type, data, filters) => {
  const contextHash = crypto
    .createHash('md5')
    .update(JSON.stringify({ type, data, filters }))
    .digest('hex');
  
  return `ai_${type}_${contextHash}`;
};
```

#### Cache Hierárquico
1. **L1 - Memória**: Respostas recentes (1 minuto)
2. **L2 - Redis**: Respostas similares (5 minutos)
3. **L3 - Database**: Análises históricas (24 horas)

#### Invalidação Inteligente
```javascript
// Invalidar cache quando dados mudam
const invalidateRelatedCache = async (campaignId) => {
  const patterns = [
    `ai_analysis_*${campaignId}*`,
    `ai_anomaly_*${campaignId}*`,
    `ai_optimization_*${campaignId}*`
  ];
  
  for (const pattern of patterns) {
    await redis.del(pattern);
  }
};
```

### 2. Processamento Assíncrono

#### Para Análises Longas
```javascript
// Background processing
const processLongAnalysis = async (data) => {
  const jobId = generateJobId();
  
  // Iniciar job em background
  await queue.add('ai-analysis', { data, jobId });
  
  // Retornar ID para polling
  return { jobId, status: 'processing' };
};

// Polling endpoint
app.get('/api/ai/status/:jobId', async (req, res) => {
  const job = await queue.getJob(req.params.jobId);
  res.json({ 
    status: job.finishedOn ? 'completed' : 'processing',
    result: job.returnvalue 
  });
});
```

### 3. Otimização de Requests

#### Batch Processing
```javascript
// Processar múltiplas análises juntas
const batchAnalyze = async (campaigns) => {
  const batchPrompt = campaigns.map(c => 
    `Campanha ${c.id}: ${summarizeMetrics(c)}`
  ).join('\n');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Analise cada campanha separadamente:'
    }, {
      role: 'user',
      content: batchPrompt
    }]
  });
  
  return parseBatchResponse(response.choices[0].message.content);
};
```

## Qualidade e Precisão

### 1. Validação de Entrada

#### Qualidade dos Dados
```javascript
const validateAnalysisData = (data) => {
  const checks = [
    { test: data.leads > 0, message: 'Sem leads no período' },
    { test: data.spend > 0, message: 'Sem gastos registrados' },
    { test: data.impressions > 0, message: 'Sem impressões' },
    { test: data.dateRange.days >= 3, message: 'Período muito curto' }
  ];
  
  const failures = checks.filter(c => !c.test);
  if (failures.length > 0) {
    throw new ValidationError(failures.map(f => f.message));
  }
};
```

#### Contexto Adequado
```javascript
const enrichContext = (campaignData) => {
  return {
    ...campaignData,
    sector: 'automotivo',
    adType: 'lead_ads',
    objective: detectObjective(campaignData.name),
    seasonality: getSeasonalityInfo(campaignData.dateRange),
    benchmarks: getSectorBenchmarks('automotive')
  };
};
```

### 2. Validação de Saída

#### Verificação de Qualidade
```javascript
const validateAIResponse = (response, context) => {
  const checks = [
    response.length > 50, // Resposta substantiva
    response.includes('R$') || response.includes('%'), // Dados específicos
    !response.includes('não tenho informações'), // Não genérica
    response.split('.').length >= 3 // Múltiplos pontos
  ];
  
  const quality = checks.filter(Boolean).length / checks.length;
  
  if (quality < 0.7) {
    // Retry com prompt melhorado
    return retryWithBetterPrompt(context);
  }
  
  return response;
};
```

### 3. Feedback Loop

#### Coleta de Feedback
```javascript
// Feedback do usuário
const collectFeedback = async (analysisId, feedback) => {
  await db.aiAnalysisFeedback.create({
    analysisId,
    rating: feedback.rating, // 1-5
    helpful: feedback.helpful, // boolean
    comments: feedback.comments,
    userId: feedback.userId
  });
  
  // Usar para melhorar prompts
  if (feedback.rating <= 2) {
    await flagForReview(analysisId);
  }
};
```

#### Melhoria Contínua
```javascript
// Análise de feedback para melhorar prompts
const optimizePrompts = async () => {
  const lowRatedAnalyses = await db.aiAnalysisFeedback.findMany({
    where: { rating: { lte: 2 } },
    include: { analysis: true }
  });
  
  // Identificar padrões de falha
  const patterns = analyzeFeedbackPatterns(lowRatedAnalyses);
  
  // Ajustar prompts baseado nos padrões
  await updatePromptsBasedOnFeedback(patterns);
};
```

## Segurança e Privacidade

### 1. Proteção de Dados

#### Dados Sensíveis
```javascript
// Remover dados pessoais antes de enviar para IA
const sanitizeForAI = (data) => {
  const sanitized = { ...data };
  
  // Remover campos sensíveis
  delete sanitized.leadEmails;
  delete sanitized.leadPhones;
  delete sanitized.leadNames;
  delete sanitized.personalInfo;
  
  // Manter apenas métricas agregadas
  return {
    metrics: sanitized.metrics,
    aggregates: sanitized.aggregates,
    trends: sanitized.trends
  };
};
```

#### Logs Seguros
```javascript
// Log sem dados sensíveis
const logAIRequest = (request, response) => {
  const safeLog = {
    timestamp: new Date(),
    userId: request.userId,
    analysisType: request.type,
    tokenCount: response.usage?.total_tokens,
    responseTime: response.responseTime,
    // NÃO incluir dados reais
    success: response.success
  };
  
  logger.info('AI_REQUEST', safeLog);
};
```

### 2. Controle de Acesso

#### Permissões por Funcionalidade
```javascript
const aiPermissions = {
  'ai.analysis': ['admin', 'analyst'],
  'ai.anomalies': ['admin', 'analyst', 'operator'],
  'ai.optimization': ['admin'],
  'ai.chat': ['admin', 'analyst', 'operator']
};

const checkAIPermission = (user, feature) => {
  return aiPermissions[feature]?.includes(user.role) || false;
};
```

### 3. Auditoria

#### Log de Ações
```javascript
// Auditoria completa de uso de IA
const auditAIUsage = async (userId, action, details) => {
  await db.aiAuditLog.create({
    userId,
    action, // 'analysis', 'anomaly', 'optimization', 'chat'
    details: sanitizeForAudit(details),
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
};
```

## Monitoramento e Alertas

### 1. Métricas de Performance

#### KPIs Essenciais
```javascript
const aiMetrics = {
  // Performance
  avgResponseTime: 'avg(response_time)',
  successRate: 'count(success) / count(*)',
  cacheHitRate: 'count(cache_hits) / count(requests)',
  
  // Custos
  dailyCost: 'sum(token_cost) WHERE date = today',
  costPerAnalysis: 'avg(token_cost) GROUP BY analysis_type',
  
  // Qualidade
  avgUserRating: 'avg(user_rating)',
  adoptionRate: 'count(suggestions_adopted) / count(suggestions_made)'
};
```

#### Dashboard de Métricas
```javascript
// Endpoint para métricas de IA
app.get('/api/ai/metrics', async (req, res) => {
  const metrics = await Promise.all([
    getResponseTimeMetrics(),
    getCostMetrics(),
    getQualityMetrics(),
    getUsageMetrics()
  ]);
  
  res.json({
    performance: metrics[0],
    costs: metrics[1],
    quality: metrics[2],
    usage: metrics[3],
    lastUpdated: new Date()
  });
});
```

### 2. Alertas Inteligentes

#### Alertas de Custo
```javascript
const costAlerts = [
  {
    condition: 'daily_cost > 200',
    severity: 'HIGH',
    action: 'email_admin'
  },
  {
    condition: 'hourly_requests > 1000',
    severity: 'MEDIUM',
    action: 'slack_notification'
  }
];
```

#### Alertas de Qualidade
```javascript
const qualityAlerts = [
  {
    condition: 'avg_rating < 3.0 AND sample_size > 10',
    severity: 'HIGH',
    action: 'review_prompts'
  },
  {
    condition: 'error_rate > 0.1',
    severity: 'CRITICAL',
    action: 'disable_ai_temporarily'
  }
];
```

### 3. Relatórios Automáticos

#### Relatório Diário
```javascript
const generateDailyReport = async () => {
  const report = {
    date: new Date().toISOString().split('T')[0],
    usage: await getDailyUsage(),
    costs: await getDailyCosts(),
    quality: await getDailyQuality(),
    issues: await getDailyIssues()
  };
  
  await sendReportToStakeholders(report);
};

// Executar todo dia às 9h
cron.schedule('0 9 * * *', generateDailyReport);
```

## Desenvolvimento e Manutenção

### 1. Testes de IA

#### Testes de Qualidade
```javascript
describe('AI Analysis Quality', () => {
  test('should provide specific insights', async () => {
    const mockData = generateMockCampaignData();
    const analysis = await aiService.analyzePerformance(mockData);
    
    expect(analysis).toContain('R$'); // Valores específicos
    expect(analysis).toContain('%');  // Percentuais
    expect(analysis.length).toBeGreaterThan(100); // Substantivo
    expect(analysis).not.toContain('não posso'); // Não genérico
  });
  
  test('should handle edge cases gracefully', async () => {
    const edgeCases = [
      { leads: 0, spend: 100 }, // Sem conversões
      { leads: 1000, spend: 10 }, // CPL muito baixo
      { impressions: 0 } // Sem impressões
    ];
    
    for (const testCase of edgeCases) {
      const analysis = await aiService.analyzePerformance(testCase);
      expect(analysis).toBeDefined();
      expect(analysis.length).toBeGreaterThan(50);
    }
  });
});
```

#### Testes de Performance
```javascript
describe('AI Performance', () => {
  test('should respond within acceptable time', async () => {
    const start = Date.now();
    await aiService.analyzePerformance(mockData);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(10000); // 10s máximo
  });
  
  test('should handle concurrent requests', async () => {
    const requests = Array(10).fill().map(() => 
      aiService.analyzePerformance(mockData)
    );
    
    const results = await Promise.all(requests);
    expect(results).toHaveLength(10);
    results.forEach(result => expect(result).toBeDefined());
  });
});
```

### 2. Versionamento de Prompts

#### Controle de Versão
```javascript
const promptVersions = {
  'analysis_v1': {
    template: 'Analise os dados: {data}',
    deprecated: true,
    replacedBy: 'analysis_v2'
  },
  'analysis_v2': {
    template: 'Contexto: {context}\nDados: {data}\nAnalise considerando...',
    active: true,
    version: '2.0'
  }
};

const getPrompt = (type, version = 'latest') => {
  const key = version === 'latest' 
    ? Object.keys(promptVersions).find(k => 
        k.startsWith(type) && promptVersions[k].active
      )
    : `${type}_${version}`;
    
  return promptVersions[key];
};
```

### 3. Rollback e Recuperação

#### Fallback para Análise Básica
```javascript
const analyzeWithFallback = async (data) => {
  try {
    // Tentar IA primeiro
    return await aiService.analyzePerformance(data);
  } catch (error) {
    logger.warn('AI analysis failed, using fallback', error);
    
    // Fallback para análise básica
    return generateBasicAnalysis(data);
  }
};

const generateBasicAnalysis = (data) => {
  const cpl = data.spend / data.leads;
  const ctr = (data.clicks / data.impressions) * 100;
  
  return `
    Resumo do período: ${data.leads} leads gerados com investimento de R$ ${data.spend.toFixed(2)}.
    CPL: R$ ${cpl.toFixed(2)}
    CTR: ${ctr.toFixed(2)}%
    
    ${cpl > 50 ? 'CPL acima da média. Considere otimizar segmentação.' : 'CPL dentro do esperado.'}
    ${ctr > 1 ? 'CTR bom, criativos performando bem.' : 'CTR baixo, considere testar novos criativos.'}
  `;
};
```

---

## Checklist de Implementação

### ✅ Configuração Inicial
- [ ] Chave OpenAI configurada
- [ ] Rate limiting implementado
- [ ] Cache básico funcionando
- [ ] Logs de auditoria ativos

### ✅ Otimização
- [ ] Prompts otimizados por funcionalidade
- [ ] Cache inteligente implementado
- [ ] Validação de entrada e saída
- [ ] Fallbacks configurados

### ✅ Monitoramento
- [ ] Métricas de custo em tempo real
- [ ] Alertas de limite configurados
- [ ] Dashboard de performance
- [ ] Relatórios automáticos

### ✅ Qualidade
- [ ] Testes automatizados
- [ ] Feedback loop implementado
- [ ] Versionamento de prompts
- [ ] Análise de qualidade regular

---

**Última atualização**: Junho 2025  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento 