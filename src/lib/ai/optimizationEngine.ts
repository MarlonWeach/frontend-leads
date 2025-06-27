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

const OPTIMIZATION_PROMPTS = {
  SEGMENTACAO: `
Analise os dados de campanha e sugira otimizações de segmentação:
- Identifique públicos com melhor performance
- Sugira exclusões ou inclusões de audiências
- Recomende ajustes demográficos
- Considere interesses de alta conversão
`,

  CRIATIVO: `
Analise a performance de criativos e sugira melhorias:
- Identifique elementos de alta performance
- Sugira variações de copy e imagens
- Recomende testes A/B específicos
- Considere tendências do setor automotivo
`,

  ORCAMENTO: `
Analise a distribuição de orçamento e sugira otimizações:
- Identifique campanhas com melhor ROI
- Sugira realocação de verba
- Recomende ajustes de lance
- Considere sazonalidade e performance
`,

  TIMING: `
Analise padrões temporais e sugira otimizações de timing:
- Identifique melhores horários e dias
- Sugira ajustes de programação
- Recomende pausas estratégicas
- Considere comportamento do público-alvo
`,

  ABTEST: `
Sugira testes A/B estratégicos baseados nos dados:
- Identifique elementos para testar
- Sugira variações específicas
- Recomende métricas de sucesso
- Considere significância estatística
`
};

export class OptimizationEngine {
  private campaigns: CampaignData[] = [];
  private benchmarks: any = {};

  constructor(campaigns: CampaignData[]) {
    this.campaigns = campaigns;
    this.calculateBenchmarks();
  }

  private calculateBenchmarks() {
    const activeCampaigns = this.campaigns.filter(c => c.status === 'ACTIVE');
    
    if (activeCampaigns.length === 0) {
      this.benchmarks = { avgCTR: 0, avgCPL: 0, avgConversionRate: 0 };
      return;
    }

    this.benchmarks = {
      avgCTR: activeCampaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / activeCampaigns.length,
      avgCPL: activeCampaigns.reduce((sum, c) => sum + (c.cpl || 0), 0) / activeCampaigns.length,
      avgConversionRate: activeCampaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / activeCampaigns.length
    };
  }

  async generateOptimizations(): Promise<OptimizationAnalysis> {
    const suggestions: OptimizationSuggestion[] = [];

    // Gerar sugestões para cada tipo
    for (const type of ['SEGMENTACAO', 'CRIATIVO', 'ORCAMENTO', 'TIMING', 'ABTEST'] as const) {
      const typeSuggestions = await this.generateSuggestionsByType(type);
      suggestions.push(...typeSuggestions);
    }

    // Ordenar por prioridade e impacto
    suggestions.sort((a, b) => {
      if (a.impact !== b.impact) {
        const impactOrder = { 'ALTO': 3, 'MEDIO': 2, 'BAIXO': 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      }
      return b.priority - a.priority;
    });

    return {
      suggestions: suggestions.slice(0, 10), // Top 10 sugestões
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
            content: `Você é um especialista em otimização de campanhas de Lead Ads para o setor automotivo. 
            Analise os dados fornecidos e gere sugestões específicas e acionáveis.
            Retorne APENAS um JSON válido com array de sugestões no formato especificado.`
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

      // Parse da resposta da IA
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
        estimatedROI: suggestion.estimatedROI
      }));

    } catch (error) {
      console.error(`Erro ao gerar sugestões para ${type}:`, error);
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

  // Método para aplicar sugestão automaticamente
  async applySuggestion(suggestionId: string): Promise<{ success: boolean; message: string }> {
    // TODO: Implementar aplicação automática baseada no tipo de sugestão
    // Por enquanto, apenas simular
    
    return {
      success: true,
      message: `Sugestão ${suggestionId} foi aplicada com sucesso. Monitoramento iniciado.`
    };
  }

  // Método para rastrear resultados de sugestões aplicadas
  async trackSuggestionResults(suggestionId: string, beforeMetrics: any, afterMetrics: any) {
    // TODO: Implementar tracking de resultados
    // Comparar métricas antes e depois da aplicação
    // Calcular ROI real vs estimado
    // Usar dados para melhorar futuras sugestões
  }
} 