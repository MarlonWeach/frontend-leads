import { AI_CONFIG } from './config';

// Tipos para os dados de análise
export interface PerformanceData {
  campaigns?: any[];
  adsets?: any[];
  ads?: any[];
  leads?: any[];
  metrics?: {
    totalLeads?: number;
    totalSpend?: number;
    totalImpressions?: number;
    totalClicks?: number;
    averageCTR?: number;
    averageCPL?: number;
  };
  period?: string;
}

/**
 * Premissas Heurísticas Automotivas para IA
 * Baseado em docs/ai/automotive-heuristics.md
 */
const AUTOMOTIVE_HEURISTICS = `
CONTEXTO AUTOMOTIVO - PREMISSAS HEURÍSTICAS:

SETOR AUTOMOTIVO BRASILEIRO:
- Foco: Lead Ads para test drive e compra de veículos
- Jornada: Lead → Contato → Agendamento → Test Drive → Negociação → Venda
- Plataforma: Meta (Facebook/Instagram) Lead Ads
- Formulário: Instantâneo, sem redirecionamento

BENCHMARKS POR CATEGORIA:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

SAZONALIDADE:
- Alta: Janeiro-Março (13º salário), Outubro-Dezembro (férias)
- Média: Abril-Junho
- Baixa: Julho-Setembro (inverno, férias escolares)

INDICADORES DE QUALIDADE:
- Excelente (90-100 pts): Conversão 25-40%, contato < 5 min
- Alta (75-89 pts): Conversão 15-25%, contato < 15 min
- Média (50-74 pts): Conversão 8-15%, contato < 30 min
- Baixa (25-49 pts): Conversão 3-8%, contato < 2h
- Muito Baixa (0-24 pts): Conversão < 3%, verificação manual

RED FLAGS AUTOMOTIVAS:
- CPL < 50% do benchmark (suspeita de fraude)
- Volume > 300% do normal (tráfego incentivado)
- Horários 2h-6h (menor intenção real)
- Dados genéricos ("teste", "abc", "123")
- Emails temporários (10minutemail, temp-mail)

TERMINOLOGIA ESPECÍFICA:
- CPL: Custo Por Lead (métrica principal)
- Test Drive: Experiência de direção do veículo
- Financiamento: Opções de pagamento parcelado
- Seminovo: Veículo usado com garantia
- Concessionária: Revendedora autorizada da marca
`;

/**
 * Prompts para análise de performance em linguagem natural
 */
export class PerformancePrompts {
  
  /**
   * Prompt para análise geral de performance
   */
  static buildPerformanceAnalysisPrompt(data: PerformanceData, period: string = '7 dias'): string {
    const campaigns = data.campaigns || [];
    const metrics = data.metrics || {};
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED').length;
    
    // Calcular métricas adicionais
    const bestCampaign = campaigns.reduce((best, current) => 
      (current.cpl || Infinity) < (best.cpl || Infinity) ? current : best, campaigns[0]);
    const worstCampaign = campaigns.reduce((worst, current) => 
      (current.cpl || 0) > (worst.cpl || 0) ? current : worst, campaigns[0]);
    
    return `
${AUTOMOTIVE_HEURISTICS}

ANÁLISE DE PERFORMANCE AUTOMOTIVA - Período: ${period}

CONTEXTO DOS DADOS:
- Total de campanhas: ${totalCampaigns}
- Campanhas ativas: ${activeCampaigns}
- Campanhas pausadas: ${pausedCampaigns}

DADOS DAS CAMPANHAS:
${campaigns.map((c, index) => `${index + 1}. ${c.campaign_name || c.name || 'Campanha sem nome'}: 
   • Leads: ${c.leads || 0}
   • Gasto: R$ ${(c.spend || 0).toFixed(2)}
   • CTR: ${(c.ctr || 0).toFixed(2)}%
   • CPL: R$ ${(c.cpl || 0).toFixed(2)}
   • Status: ${c.status || 'N/A'}`).join('\n\n')}

MÉTRICAS AGREGADAS:
• Total de leads: ${metrics.totalLeads || 0}
• Total gasto: R$ ${(metrics.totalSpend || 0).toFixed(2)}
• Total impressões: ${(metrics.totalImpressions || 0).toLocaleString('pt-BR')}
• Total cliques: ${(metrics.totalClicks || 0).toLocaleString('pt-BR')}
• CTR médio: ${(metrics.averageCTR || 0).toFixed(2)}%
• CPL médio: R$ ${(metrics.averageCPL || 0).toFixed(2)}

CAMPANHA COM MELHOR CPL: ${bestCampaign?.campaign_name || bestCampaign?.name || 'N/A'} (R$ ${(bestCampaign?.cpl || 0).toFixed(2)})
CAMPANHA COM PIOR CPL: ${worstCampaign?.campaign_name || worstCampaign?.name || 'N/A'} (R$ ${(worstCampaign?.cpl || 0).toFixed(2)})

INSTRUÇÕES PARA ANÁLISE AUTOMOTIVA:
Forneça uma análise detalhada em português brasileiro natural e conversacional, considerando o contexto automotivo:

1. **RESUMO EXECUTIVO** (2-3 frases)
   - Principais conquistas e desafios do período
   - Comparação com benchmarks do setor automotivo

2. **INSIGHTS PRINCIPAIS** (3-4 pontos)
   - O que está funcionando bem (test drives, leads qualificados)
   - O que precisa de atenção (CPL alto, baixa conversão)
   - Tendências observadas (sazonalidade, comportamento)

3. **ANÁLISE DETALHADA**
   - Performance por campanha (destaque as melhores e piores)
   - Comparação com benchmarks automotivos por categoria
   - Análise de qualidade de leads (score, red flags)
   - Padrões de gasto e eficiência

4. **RECOMENDAÇÕES ACIONÁVEIS** (3-5 sugestões)
   - Otimizações específicas para o setor automotivo
   - Ajustes de segmentação por categoria de veículo
   - Melhorias de copy e criativos para test drive
   - Estratégias de qualificação de leads

Use linguagem específica do setor automotivo (test drive, concessionária, financiamento, etc.) e sempre compare com os benchmarks estabelecidos.
`;
  }

  /**
   * Prompt para análise de tendências temporais
   */
  static buildTrendAnalysisPrompt(data: PerformanceData, period: string = '7 dias'): string {
    const campaigns = data.campaigns || [];
    const metrics = data.metrics || {};
    
    return `
${AUTOMOTIVE_HEURISTICS}

ANÁLISE DE TENDÊNCIAS AUTOMOTIVAS - Período: ${period}

DADOS PARA ANÁLISE TEMPORAL:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL`).join('\n')}

MÉTRICAS AGREGADAS:
- Total de leads: ${metrics.totalLeads || 0}
- Total gasto: R$ ${metrics.totalSpend || 0}
- CTR médio: ${metrics.averageCTR || 0}%
- CPL médio: R$ ${metrics.averageCPL || 0}

ANALISE E IDENTIFIQUE CONSIDERANDO O CONTEXTO AUTOMOTIVO:
1. **Tendências de crescimento ou declínio** (comparar com sazonalidade)
2. **Padrões sazonais automotivos** (13º salário, férias, Black Friday)
3. **Correlações entre métricas** (CPL vs qualidade de leads)
4. **Pontos de inflexão importantes** (lançamentos, promoções)
5. **Projeções para próximos períodos** (baseado em sazonalidade)

Responda em português brasileiro, explicando as tendências de forma clara e acionável, sempre considerando o contexto específico do setor automotivo.
`;
  }

  /**
   * Prompt para comparação entre campanhas
   */
  static buildCampaignComparisonPrompt(data: PerformanceData): string {
    const campaigns = data.campaigns || [];
    
    if (campaigns.length < 2) {
      return `
COMPARAÇÃO DE CAMPANHAS AUTOMOTIVAS

Dados insuficientes para comparação. É necessário pelo menos 2 campanhas para realizar uma análise comparativa.

Campanhas disponíveis: ${campaigns.length}
`;
    }
    
    // Ordenar campanhas por diferentes métricas
    const byLeads = [...campaigns].sort((a, b) => (b.leads || 0) - (a.leads || 0));
    const byCPL = [...campaigns].sort((a, b) => (a.cpl || Infinity) - (b.cpl || Infinity));
    const byCTR = [...campaigns].sort((a, b) => (b.ctr || 0) - (a.ctr || 0));
    const bySpend = [...campaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0));
    
    return `
${AUTOMOTIVE_HEURISTICS}

COMPARAÇÃO DETALHADA ENTRE CAMPANHAS AUTOMOTIVAS

DADOS DAS CAMPANHAS:
${campaigns.map((c, index) => `${index + 1}. ${c.campaign_name || c.name || 'Campanha sem nome'}: 
   • Leads: ${c.leads || 0}
   • Gasto: R$ ${(c.spend || 0).toFixed(2)}
   • CTR: ${(c.ctr || 0).toFixed(2)}%
   • CPL: R$ ${(c.cpl || 0).toFixed(2)}
   • Status: ${c.status || 'N/A'}`).join('\n\n')}

RANKINGS:
• Mais leads: ${byLeads[0]?.campaign_name || byLeads[0]?.name || 'N/A'} (${byLeads[0]?.leads || 0})
• Melhor CPL: ${byCPL[0]?.campaign_name || byCPL[0]?.name || 'N/A'} (R$ ${(byCPL[0]?.cpl || 0).toFixed(2)})
• Melhor CTR: ${byCTR[0]?.campaign_name || byCTR[0]?.name || 'N/A'} (${(byCTR[0]?.ctr || 0).toFixed(2)}%)
• Maior gasto: ${bySpend[0]?.campaign_name || bySpend[0]?.name || 'N/A'} (R$ ${(bySpend[0]?.spend || 0).toFixed(2)})

ANALISE E COMPARE CONSIDERANDO O CONTEXTO AUTOMOTIVO:
1. **Performance relativa** entre as campanhas (comparar com benchmarks)
2. **Diferenças significativas** em métricas-chave (CPL, conversão)
3. **Fatores que explicam** as variações (categoria de veículo, segmentação)
4. **Oportunidades de otimização** baseadas na comparação (copy, criativos)
5. **Lições aprendidas** das campanhas de sucesso (test drive, qualificação)

Forneça insights específicos sobre por que algumas campanhas performam melhor que outras, sempre considerando o contexto automotivo e os benchmarks do setor.
`;
  }

  /**
   * Prompt para análise de variações e mudanças
   */
  static buildVariationAnalysisPrompt(data: PerformanceData, period: string = '7 dias'): string {
    const campaigns = data.campaigns || [];
    const metrics = data.metrics || {};
    
    return `
${AUTOMOTIVE_HEURISTICS}

ANÁLISE DE VARIAÇÕES E MUDANÇAS AUTOMOTIVAS - Período: ${period}

DADOS PARA ANÁLISE DE VARIAÇÕES:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL`).join('\n')}

MÉTRICAS AGREGADAS:
- Total de leads: ${metrics.totalLeads || 0}
- Total gasto: R$ ${metrics.totalSpend || 0}
- CTR médio: ${metrics.averageCTR || 0}%
- CPL médio: R$ ${metrics.averageCPL || 0}

IDENTIFIQUE E EXPLIQUE CONSIDERANDO O CONTEXTO AUTOMOTIVO:
1. **Variações significativas** em métricas-chave (comparar com benchmarks)
2. **Mudanças de tendência** no período (sazonalidade, lançamentos)
3. **Fatores que podem explicar** as variações (promoções, concorrência)
4. **Impacto das mudanças** na performance geral (qualidade de leads)
5. **Ações recomendadas** para lidar com variações (otimizações específicas)

Responda em português brasileiro, sempre considerando o contexto automotivo e os padrões do setor.
`;
  }

  /**
   * Prompt para análise de eficiência e ROI
   */
  static buildEfficiencyAnalysisPrompt(data: PerformanceData): string {
    const campaigns = data.campaigns || [];
    const metrics = data.metrics || {};
    
    // Calcular eficiência
    const totalLeads = metrics.totalLeads || 0;
    const totalSpend = metrics.totalSpend || 0;
    const totalClicks = metrics.totalClicks || 0;
    const totalImpressions = metrics.totalImpressions || 0;
    
    const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const costPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const costPerImpression = totalImpressions > 0 ? totalSpend / totalImpressions : 0;
    
    return `
ANÁLISE DE EFICIÊNCIA E ROI

DADOS DE EFICIÊNCIA:
• Total de leads: ${totalLeads}
• Total gasto: R$ ${totalSpend.toFixed(2)}
• Total cliques: ${totalClicks.toLocaleString('pt-BR')}
• Total impressões: ${totalImpressions.toLocaleString('pt-BR')}

MÉTRICAS DE EFICIÊNCIA:
• Taxa de conversão: ${conversionRate.toFixed(2)}%
• Custo por clique: R$ ${costPerClick.toFixed(2)}
• Custo por impressão: R$ ${costPerImpression.toFixed(4)}
• CPL médio: R$ ${(metrics.averageCPL || 0).toFixed(2)}
• CTR médio: ${(metrics.averageCTR || 0).toFixed(2)}%

DADOS DAS CAMPANHAS:
${campaigns.map(c => `- ${c.campaign_name || c.name}: ${c.leads || 0} leads, R$ ${c.spend || 0} gasto, ${c.ctr || 0}% CTR, R$ ${c.cpl || 0} CPL`).join('\n')}

ANALISE A EFICIÊNCIA:
1. **Eficiência geral** das campanhas
2. **Campanhas mais eficientes** e por quê
3. **Oportunidades de otimização** de custos
4. **ROI por campanha** e agregado
5. **Recomendações** para melhorar eficiência

Forneça insights sobre como otimizar custos e melhorar o retorno sobre investimento.
`;
  }
}

/**
 * Configurações de prompts
 */
export const PROMPT_CONFIG = {
  // Máximo de tokens para diferentes tipos de análise
  MAX_TOKENS: {
    PERFORMANCE: 1500,
    TREND: 1200,
    COMPARISON: 1400,
    VARIATION: 1300,
    EFFICIENCY: 1200,
  },
  
  // Temperatura para diferentes tipos de análise
  TEMPERATURE: {
    PERFORMANCE: 0.3,  // Mais determinístico para análises precisas
    TREND: 0.4,        // Um pouco mais criativo para identificar padrões
    COMPARISON: 0.3,   // Determinístico para comparações objetivas
    VARIATION: 0.4,    // Criativo para explicar variações
    EFFICIENCY: 0.3,   // Determinístico para análises de eficiência
  },
} as const;

// Prompts para detecção de anomalias e fraudes
export const ANOMALY_DETECTION_PROMPTS = {
  FRAUD_DETECTION: `
Você é um especialista em detecção de fraudes em campanhas de marketing digital.

Analise os seguintes dados de campanhas e identifique possíveis indicadores de fraude ou anomalias:

{data}

Procure especificamente por:

1. **Tráfego Incentivado**:
   - Taxa de conversão anormalmente alta (>15%)
   - Padrões de cliques suspeitos
   - Origem de tráfego questionável

2. **Conversões Manuais**:
   - Picos súbitos de conversões
   - Conversões fora do horário comercial
   - Padrões regulares demais

3. **Leads Duplicados**:
   - Mesmos emails/telefones
   - Dados muito similares
   - Timing suspeito de submissões

4. **Comportamento Anômalo**:
   - CTR muito alto ou muito baixo
   - CPL inconsistente com histórico
   - Métricas que não fazem sentido juntas

Para cada anomalia encontrada, forneça:
- Tipo de anomalia
- Nível de severidade (LOW, MEDIUM, HIGH, CRITICAL)
- Confiança na detecção (0-1)
- Campanhas afetadas
- Recomendações específicas

Responda APENAS em JSON válido no formato:
{
  "anomalies": [
    {
      "type": "SUSPICIOUS_TRAFFIC",
      "severity": "HIGH",
      "title": "Título da anomalia",
      "description": "Descrição detalhada do problema",
      "confidence": 0.85,
      "affectedCampaigns": ["nome1", "nome2"],
      "recommendations": ["ação1", "ação2", "ação3"]
    }
  ]
}
`,

  PATTERN_ANALYSIS: `
Analise os padrões nos dados de campanhas fornecidos e identifique comportamentos suspeitos ou anômalos:

{data}

Foque em:
- Variações temporais suspeitas
- Inconsistências entre métricas
- Padrões que fogem do normal para o setor automotivo
- Indicadores de qualidade de leads baixa

Seja específico sobre:
- Quais métricas estão fora do padrão
- Por que isso é suspeito
- Qual o impacto potencial
- Como verificar/confirmar a suspeita
`,

  QUALITY_ASSESSMENT: `
Avalie a qualidade dos leads e campanhas baseado nos dados:

{data}

Critérios de avaliação:
1. **Qualidade dos Leads**:
   - Preenchimento completo de formulários
   - Dados consistentes e válidos
   - Engajamento pós-conversão

2. **Performance da Campanha**:
   - Métricas dentro de benchmarks do setor
   - Consistência temporal
   - ROI e eficiência

3. **Indicadores de Fraude**:
   - Leads com dados falsos
   - Padrões de bot ou automação
   - Fontes de tráfego suspeitas

Forneça um score de qualidade (0-100) e recomendações específicas.
`,

  BENCHMARK_COMPARISON: `
Compare as métricas das campanhas com benchmarks típicos do setor automotivo:

{data}

Benchmarks de referência:
- CTR: 1-3%
- Taxa de Conversão: 2-8%
- CPL: R$ 15-50 (test drive)
- Qualidade de Lead: 70-85%

Identifique:
- Métricas significativamente acima ou abaixo do benchmark
- Possíveis explicações para desvios
- Oportunidades de otimização
- Riscos ou problemas potenciais

Seja específico sobre quais campanhas estão fora do padrão e por quê.
`
}; 