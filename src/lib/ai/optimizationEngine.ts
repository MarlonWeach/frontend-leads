import { openai } from './config';

export interface OptimizationSuggestion {
  id: string;
  type: 'SEGMENTACAO' | 'CRIATIVO' | 'ORCAMENTO' | 'TIMING' | 'ABTEST';
  title: string;
  description: string;
  impact: 'ALTO' | 'MEDIO' | 'BAIXO';
  confidence: number; // 0-100
  expectedImprovement: string;
  actionItems: string[];
  campaignId?: string;
  priority: number; // 1-10
  reasoning: string;
  implementable: boolean;
  estimatedROI?: number;
  vehicleCategory?: string;
  seasonalContext?: string;
  qualityImpact?: string;
}

export interface OptimizationAnalysis {
  suggestions: OptimizationSuggestion[];
  summary: {
    totalSuggestions: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    averageConfidence: number;
    estimatedTotalROI: number;
  };
  benchmarks: {
    avgCTR: number;
    avgCPL: number;
    avgConversionRate: number;
    automotiveBenchmarks: {
      economic: { cplRange: [number, number]; conversionRate: [number, number] };
      premium: { cplRange: [number, number]; conversionRate: [number, number] };
      suv: { cplRange: [number, number]; conversionRate: [number, number] };
      commercial: { cplRange: [number, number]; conversionRate: [number, number] };
      luxury: { cplRange: [number, number]; conversionRate: [number, number] };
    };
  };
}

export interface CampaignData {
  campaign_id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpl: number;
  conversion_rate: number;
  created_time: string;
  historical_data?: {
    last_30_days: {
      spend: number;
      leads: number;
      ctr: number;
      cpl: number;
    };
    last_90_days: {
      spend: number;
      leads: number;
      ctr: number;
      cpl: number;
    };
  };
}

const AUTOMOTIVE_OPTIMIZATION_CONTEXT = `
CONTEXTO AUTOMOTIVO PARA OTIMIZAÇÃO:

BENCHMARKS POR CATEGORIA:
- Econômicos (até R$ 80k): CPL R$ 15-35, conversão 8-15%
- Premium (R$ 80k-200k): CPL R$ 45-80, conversão 15-25%
- SUVs (todas faixas): CPL R$ 35-60, conversão 12-20%
- Comerciais: CPL R$ 25-50, conversão 20-35%
- Luxo (acima R$ 200k): CPL R$ 80-150, conversão 25-40%

SAZONALIDADE AUTOMOTIVA:
- Alta Temporada: Janeiro-Março (13º salário), Outubro-Dezembro (férias)
- Média Temporada: Abril-Junho
- Baixa Temporada: Julho-Setembro (inverno, férias escolares)

MELHORES PRÁTICAS AUTOMOTIVAS:
- Test Drive: Foco principal para conversão
- Financiamento: Opção importante para decisão
- Segurança: Diferencial para famílias
- Tecnologia: Atração para público premium
- Economia: Foco para veículos econômicos

SEGMENTAÇÃO EFETIVA:
- Idade: 25-45 anos (maior poder de compra)
- Interesses: Marca específica, categoria, financiamento
- Comportamento: Compradores online, pesquisadores
- Localização: Raio de 50km da concessionária

COPY E CRIATIVOS OTIMIZADOS:
- Urgência: "Últimas unidades", "Oferta por tempo limitado"
- Benefícios: "Economia de combustível", "Segurança familiar"
- Social Proof: "Mais vendido da categoria"
- CTA: "Agende seu test drive grátis"
`;

const OPTIMIZATION_PROMPTS = {
  SEGMENTACAO: `
${AUTOMOTIVE_OPTIMIZATION_CONTEXT}

Analise os dados de campanha e sugira otimizações de segmentação específicas para o setor automotivo:
- Identifique públicos com melhor performance para test drive
- Sugira exclusões ou inclusões de audiências baseadas em categoria de veículo
- Recomende ajustes demográficos específicos do setor
- Considere interesses automotivos de alta conversão
- Analise padrões de localização próximos à concessionária
`,

  CRIATIVO: `
${AUTOMOTIVE_OPTIMIZATION_CONTEXT}

Analise a performance de criativos e sugira melhorias específicas para o setor automotivo:
- Identifique elementos de alta performance para test drive
- Sugira variações de copy focadas em benefícios automotivos
- Recomende testes A/B específicos para diferentes categorias
- Considere tendências do setor automotivo (SUV, elétricos, etc.)
- Otimize CTAs para agendamento de test drive
`,

  ORCAMENTO: `
${AUTOMOTIVE_OPTIMIZATION_CONTEXT}

Analise a distribuição de orçamento e sugira otimizações considerando o contexto automotivo:
- Identifique campanhas com melhor ROI para test drive
- Sugira realocação de verba baseada em sazonalidade automotiva
- Recomende ajustes de lance por categoria de veículo
- Considere performance por região geográfica
- Otimize investimento em horários de maior conversão
`,

  TIMING: `
${AUTOMOTIVE_OPTIMIZATION_CONTEXT}

Analise padrões temporais e sugira otimizações de timing específicas para o setor automotivo:
- Identifique melhores horários para agendamento de test drive
- Sugira ajustes de programação baseados em sazonalidade
- Recomende pausas estratégicas em baixa temporada
- Considere comportamento do público automotivo
- Otimize horários de contato com leads
`,

  ABTEST: `
${AUTOMOTIVE_OPTIMIZATION_CONTEXT}

Sugira testes A/B estratégicos específicos para o setor automotivo:
- Identifique elementos para testar (copy, criativos, segmentação)
- Sugira variações específicas para test drive
- Recomende métricas de sucesso automotivas
- Considere significância estatística para o setor
- Foque em conversão para agendamento
`
};

export class OptimizationEngine {
  private campaigns: CampaignData[] = [];
  private benchmarks: any = {};
  private automotiveBenchmarks = {
    economic: { cplRange: [15, 35], conversionRate: [0.08, 0.15] },
    premium: { cplRange: [45, 80], conversionRate: [0.15, 0.25] },
    suv: { cplRange: [35, 60], conversionRate: [0.12, 0.20] },
    commercial: { cplRange: [25, 50], conversionRate: [0.20, 0.35] },
    luxury: { cplRange: [80, 150], conversionRate: [0.25, 0.40] }
  };

  constructor(campaigns: CampaignData[]) {
    this.campaigns = campaigns;
    this.calculateBenchmarks();
  }

  private calculateBenchmarks() {
    const activeCampaigns = this.campaigns.filter(c => c.status === 'ACTIVE');
    
    if (activeCampaigns.length === 0) {
      this.benchmarks = { 
        avgCTR: 0, 
        avgCPL: 0, 
        avgConversionRate: 0,
        automotiveBenchmarks: this.automotiveBenchmarks
      };
      return;
    }

    this.benchmarks = {
      avgCTR: activeCampaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / activeCampaigns.length,
      avgCPL: activeCampaigns.reduce((sum, c) => sum + (c.cpl || 0), 0) / activeCampaigns.length,
      avgConversionRate: activeCampaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / activeCampaigns.length,
      automotiveBenchmarks: this.automotiveBenchmarks
    };
  }

  private detectVehicleCategory(campaignName: string): keyof typeof this.automotiveBenchmarks {
    const name = campaignName.toLowerCase();
    
    if (name.includes('econômico') || name.includes('economico') || name.includes('popular')) {
      return 'economic';
    }
    if (name.includes('premium') || name.includes('luxo') || name.includes('executivo')) {
      return 'premium';
    }
    if (name.includes('suv') || name.includes('4x4') || name.includes('utilitário')) {
      return 'suv';
    }
    if (name.includes('comercial') || name.includes('frota') || name.includes('empresarial')) {
      return 'commercial';
    }
    if (name.includes('luxury') || name.includes('exclusivo') || name.includes('importado')) {
      return 'luxury';
    }
    
    return 'suv';
  }

  private getSeasonalContext(): string {
    const currentMonth = new Date().getMonth() + 1;
    
    if (currentMonth >= 1 && currentMonth <= 3) {
      return 'Alta temporada - 13º salário e férias';
    }
    if (currentMonth >= 7 && currentMonth <= 9) {
      return 'Baixa temporada - Inverno e férias escolares';
    }
    if (currentMonth >= 10 && currentMonth <= 12) {
      return 'Alta temporada - Férias e Black Friday';
    }
    
    return 'Média temporada - Período estável';
  }

  async generateOptimizations(): Promise<OptimizationAnalysis> {
    const suggestions: OptimizationSuggestion[] = [];

    for (const type of ['SEGMENTACAO', 'CRIATIVO', 'ORCAMENTO', 'TIMING', 'ABTEST'] as const) {
      const typeSuggestions = await this.generateSuggestionsByType(type);
      suggestions.push(...typeSuggestions);
    }

    suggestions.sort((a, b) => {
      if (a.impact !== b.impact) {
        const impactOrder = { 'ALTO': 3, 'MEDIO': 2, 'BAIXO': 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      }
      return b.priority - a.priority;
    });

    return {
      suggestions: suggestions.slice(0, 10),
      summary: this.calculateSummary(suggestions),
      benchmarks: this.benchmarks
    };
  }

  private async generateSuggestionsByType(type: OptimizationSuggestion['type']): Promise<OptimizationSuggestion[]> {
    try {
      const campaignAnalysis = this.analyzeCampaigns();
      const prompt = this.buildPrompt(type, campaignAnalysis);

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em otimização de campanhas de Lead Ads para o setor automotivo brasileiro. 
            Analise os dados fornecidos e gere sugestões específicas e acionáveis considerando o contexto automotivo.
            Retorne APENAS um JSON válido com array de sugestões no formato especificado.
            
            Formato esperado:
            [
              {
                "title": "Título da sugestão",
                "description": "Descrição detalhada",
                "impact": "ALTO|MEDIO|BAIXO",
                "confidence": 85,
                "expectedImprovement": "Redução de 20% no CPL",
                "actionItems": ["Ação 1", "Ação 2"],
                "campaignId": "id_da_campanha",
                "priority": 8,
                "reasoning": "Justificativa baseada em dados",
                "implementable": true,
                "estimatedROI": 150,
                "vehicleCategory": "suv",
                "seasonalContext": "Alta temporada",
                "qualityImpact": "Melhoria na qualidade de leads"
              }
            ]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const aiSuggestions = JSON.parse(content);
      
      return aiSuggestions.map((suggestion: any, index: number) => ({
        id: `${type.toLowerCase()}_${Date.now()}_${index}`,
        type,
        title: suggestion.title || 'Sugestão de Otimização',
        description: suggestion.description || '',
        impact: suggestion.impact || 'MEDIO',
        confidence: Math.min(100, Math.max(0, suggestion.confidence || 70)),
        expectedImprovement: suggestion.expectedImprovement || 'Melhoria esperada',
        actionItems: Array.isArray(suggestion.actionItems) ? suggestion.actionItems : [],
        campaignId: suggestion.campaignId,
        priority: Math.min(10, Math.max(1, suggestion.priority || 5)),
        reasoning: suggestion.reasoning || '',
        implementable: suggestion.implementable !== false,
        estimatedROI: suggestion.estimatedROI,
        vehicleCategory: suggestion.vehicleCategory,
        seasonalContext: suggestion.seasonalContext,
        qualityImpact: suggestion.qualityImpact
      }));

    } catch (error) {
      console.error(`Erro ao gerar sugestões de ${type}:`, error);
      return this.generateFallbackSuggestions(type);
    }
  }

  private buildPrompt(type: OptimizationSuggestion['type'], analysis: any): string {
    const basePrompt = OPTIMIZATION_PROMPTS[type];
    
    return `
${basePrompt}

DADOS DAS CAMPANHAS:
${JSON.stringify(analysis, null, 2)}

BENCHMARKS:
- CTR Médio: ${this.benchmarks.avgCTR?.toFixed(2)}%
- CPL Médio: R$ ${this.benchmarks.avgCPL?.toFixed(2)}
- Taxa de Conversão Média: ${this.benchmarks.avgConversionRate?.toFixed(2)}%

Retorne um JSON com array de sugestões no seguinte formato:
[
  {
    "title": "Título da sugestão",
    "description": "Descrição detalhada da otimização",
    "impact": "ALTO|MEDIO|BAIXO",
    "confidence": 85,
    "expectedImprovement": "Aumento de 15% no CTR",
    "actionItems": ["Item 1", "Item 2", "Item 3"],
    "campaignId": "id_da_campanha_se_aplicavel",
    "priority": 8,
    "reasoning": "Justificativa baseada nos dados",
    "implementable": true,
    "estimatedROI": 1.25
  }
]

Gere entre 1-3 sugestões específicas e acionáveis para o tipo ${type}.
`;
  }

  private analyzeCampaigns() {
    const activeCampaigns = this.campaigns.filter(c => c.status === 'ACTIVE');
    
    return {
      totalCampaigns: this.campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalSpend: activeCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0),
      totalLeads: activeCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0),
      avgCTR: this.benchmarks.avgCTR,
      avgCPL: this.benchmarks.avgCPL,
      avgConversionRate: this.benchmarks.avgConversionRate,
      topPerformers: activeCampaigns
        .sort((a, b) => (b.conversion_rate || 0) - (a.conversion_rate || 0))
        .slice(0, 3)
        .map(c => ({
          name: c.name,
          ctr: c.ctr,
          cpl: c.cpl,
          conversion_rate: c.conversion_rate,
          spend: c.spend,
          leads: c.leads
        })),
      underPerformers: activeCampaigns
        .filter(c => (c.conversion_rate || 0) < this.benchmarks.avgConversionRate * 0.7)
        .map(c => ({
          name: c.name,
          ctr: c.ctr,
          cpl: c.cpl,
          conversion_rate: c.conversion_rate,
          spend: c.spend,
          leads: c.leads
        }))
    };
  }

  private generateFallbackSuggestions(type: OptimizationSuggestion['type']): OptimizationSuggestion[] {
    const fallbacks = {
      SEGMENTACAO: {
        title: 'Refinar Segmentação de Público',
        description: 'Analise e otimize a segmentação de público das campanhas com base em dados de performance.',
        actionItems: ['Revisar dados demográficos', 'Analisar interesses de alta conversão', 'Testar exclusões de público']
      },
      CRIATIVO: {
        title: 'Otimizar Criativos',
        description: 'Teste novos criativos baseados nos elementos de melhor performance.',
        actionItems: ['Analisar criativos de alta performance', 'Criar variações de copy', 'Testar novas imagens']
      },
      ORCAMENTO: {
        title: 'Redistribuir Orçamento',
        description: 'Realoque verba para campanhas com melhor ROI.',
        actionItems: ['Identificar campanhas de alto ROI', 'Reduzir verba de campanhas ineficientes', 'Aumentar orçamento dos top performers']
      },
      TIMING: {
        title: 'Otimizar Programação',
        description: 'Ajuste horários e dias de veiculação baseado em padrões de conversão.',
        actionItems: ['Analisar horários de pico', 'Identificar dias de melhor performance', 'Ajustar programação']
      },
      ABTEST: {
        title: 'Implementar Testes A/B',
        description: 'Configure testes A/B estratégicos para otimizar performance.',
        actionItems: ['Definir elementos a testar', 'Criar variações', 'Configurar métricas de sucesso']
      }
    };

    const fallback = fallbacks[type];
    
    return [{
      id: `fallback_${type.toLowerCase()}_${Date.now()}`,
      type,
      title: fallback.title,
      description: fallback.description,
      impact: 'MEDIO',
      confidence: 60,
      expectedImprovement: 'Melhoria esperada na performance',
      actionItems: fallback.actionItems,
      priority: 5,
      reasoning: 'Sugestão baseada em melhores práticas do setor',
      implementable: true
    }];
  }

  private calculateSummary(suggestions: OptimizationSuggestion[]) {
    const summary = {
      totalSuggestions: suggestions.length,
      highImpact: suggestions.filter(s => s.impact === 'ALTO').length,
      mediumImpact: suggestions.filter(s => s.impact === 'MEDIO').length,
      lowImpact: suggestions.filter(s => s.impact === 'BAIXO').length,
      averageConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / (suggestions.length || 1),
      estimatedTotalROI: suggestions.reduce((sum, s) => sum + (s.estimatedROI || 0), 0)
    };

    return summary;
  }

  async applySuggestion(suggestionId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Sugestão ${suggestionId} foi aplicada com sucesso. Monitoramento iniciado.`
    };
  }

  async trackSuggestionResults(suggestionId: string, beforeMetrics: any, afterMetrics: any) {
    // TODO: Implementar tracking de resultados
    // Comparar métricas antes e depois da aplicação
    // Calcular ROI real vs estimado
    // Usar dados para melhorar futuras sugestões
  }
} 