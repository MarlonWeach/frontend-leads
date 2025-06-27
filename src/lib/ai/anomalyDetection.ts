import { openai } from './config';

// Tipos de anomalias detectáveis
export enum AnomalyType {
  HIGH_CONVERSION_RATE = 'HIGH_CONVERSION_RATE',
  SUSPICIOUS_TRAFFIC = 'SUSPICIOUS_TRAFFIC',
  MANUAL_CONVERSIONS = 'MANUAL_CONVERSIONS',
  DUPLICATE_LEADS = 'DUPLICATE_LEADS',
  COST_SPIKE = 'COST_SPIKE',
  PERFORMANCE_DROP = 'PERFORMANCE_DROP',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN'
}

// Níveis de severidade
export enum AnomalySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Interface para anomalia detectada
export interface DetectedAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  confidence: number;
  affectedCampaigns: string[];
  metrics: Record<string, any>;
  recommendations: string[];
  detectedAt: Date;
}

// Configuração de detecção
export interface DetectionConfig {
  sensitivity: 'low' | 'medium' | 'high';
  deviationThreshold: number;
  conversionRateThreshold: number;
  minDataPoints: number;
  costSpikeThreshold: number;
  performanceDropThreshold: number;
}

// Configurações por nível de sensibilidade
export function getDetectionConfig(sensitivity: 'low' | 'medium' | 'high' = 'medium'): DetectionConfig {
  const configs = {
    low: {
      sensitivity: 'low' as const,
      deviationThreshold: 3.0,
      conversionRateThreshold: 0.20,
      minDataPoints: 10,
      costSpikeThreshold: 3.0,
      performanceDropThreshold: 0.40
    },
    medium: {
      sensitivity: 'medium' as const,
      deviationThreshold: 2.5,
      conversionRateThreshold: 0.15,
      minDataPoints: 5,
      costSpikeThreshold: 2.5,
      performanceDropThreshold: 0.30
    },
    high: {
      sensitivity: 'high' as const,
      deviationThreshold: 2.0,
      conversionRateThreshold: 0.10,
      minDataPoints: 3,
      costSpikeThreshold: 2.0,
      performanceDropThreshold: 0.20
    }
  };

  return configs[sensitivity];
}

// Função principal de detecção
export async function detectAnomalies(
  data: any[],
  config: Partial<DetectionConfig> = {}
): Promise<DetectedAnomaly[]> {
  try {
    const fullConfig = { ...getDetectionConfig('medium'), ...config };
    
    const anomalies: DetectedAnomaly[] = [];

    // 1. Detecção estatística
    anomalies.push(...detectStatisticalAnomalies(data, fullConfig));
    
    // 2. Detecção de padrões específicos
    anomalies.push(...detectPatternAnomalies(data, fullConfig));

    // 3. Análise com IA (se dados suficientes)
    if (data.length >= fullConfig.minDataPoints) {
      const aiAnomalies = await detectAIAnomalies(data, fullConfig);
      anomalies.push(...aiAnomalies);
    }

    return deduplicateAndSort(anomalies);
  } catch (error) {
    console.error('Erro na detecção de anomalias:', error);
    return [];
  }
}

// Detecção estatística de anomalias
function detectStatisticalAnomalies(data: any[], config: DetectionConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  
  if (data.length < config.minDataPoints) {
    return anomalies;
  }

  // Calcular estatísticas
  const conversionRates = data.map(d => d.conversion_rate || 0).filter(cr => cr > 0);
  const costs = data.map(d => d.spend || 0).filter(cost => cost > 0);
  
  if (conversionRates.length === 0 || costs.length === 0) {
    return anomalies;
  }

  const avgCR = conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length;
  const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
  
  const stdCR = Math.sqrt(conversionRates.reduce((sum, cr) => sum + Math.pow(cr - avgCR, 2), 0) / conversionRates.length);
  const stdCost = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length);

  // Detectar anomalias de conversão
  data.forEach(campaign => {
    const cr = campaign.conversion_rate || 0;
    const cost = campaign.spend || 0;
    
    // Taxa de conversão anormalmente alta
    if (cr > config.conversionRateThreshold || cr > avgCR + (config.deviationThreshold * stdCR)) {
      anomalies.push({
        id: `high-cr-${campaign.campaign_id}`,
        type: AnomalyType.HIGH_CONVERSION_RATE,
        severity: cr > 0.20 ? AnomalySeverity.CRITICAL : AnomalySeverity.HIGH,
        title: 'Taxa de Conversão Anormalmente Alta',
        description: `Campanha "${campaign.campaign_name}" tem taxa de conversão de ${(cr * 100).toFixed(1)}%, muito acima da média de ${(avgCR * 100).toFixed(1)}%`,
        confidence: Math.min(0.95, 0.5 + (cr - avgCR) / (stdCR * 2)),
        affectedCampaigns: [campaign.campaign_name],
        metrics: { conversion_rate: cr, average: avgCR, threshold: config.conversionRateThreshold },
        recommendations: [
          'Verificar qualidade do tráfego',
          'Analisar origem dos leads',
          'Confirmar se conversões são legítimas',
          'Revisar configurações de tracking'
        ],
        detectedAt: new Date()
      });
    }

    // Pico de gastos
    if (cost > avgCost + (config.costSpikeThreshold * stdCost)) {
      anomalies.push({
        id: `cost-spike-${campaign.campaign_id}`,
        type: AnomalyType.COST_SPIKE,
        severity: cost > avgCost * 3 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
        title: 'Pico de Gastos Detectado',
        description: `Campanha "${campaign.campaign_name}" tem gasto de R$ ${cost.toFixed(2)}, muito acima da média de R$ ${avgCost.toFixed(2)}`,
        confidence: Math.min(0.90, 0.6 + (cost - avgCost) / (stdCost * 2)),
        affectedCampaigns: [campaign.campaign_name],
        metrics: { spend: cost, average: avgCost, deviation: (cost - avgCost) / stdCost },
        recommendations: [
          'Revisar configurações de bid',
          'Verificar segmentação de público',
          'Analisar performance vs. investimento',
          'Considerar pausar campanha temporariamente'
        ],
        detectedAt: new Date()
      });
    }
  });

  return anomalies;
}

// Detecção de padrões específicos
function detectPatternAnomalies(data: any[], config: DetectionConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // Detectar leads duplicados
  const allLeads = data.flatMap(d => {
    if (Array.isArray(d.leads)) {
      return d.leads.map((lead: any) => ({ ...lead, campaign: d.campaign_name }));
    }
    return [];
  });

  if (allLeads.length > 0) {
    const emailMap = new Map<string, any[]>();
    
    allLeads.forEach(lead => {
      if (lead.email) {
        if (!emailMap.has(lead.email)) {
          emailMap.set(lead.email, []);
        }
        emailMap.get(lead.email)!.push(lead);
      }
    });

    const duplicates = Array.from(emailMap.entries()).filter(([_, leads]) => leads.length > 1);
    
    if (duplicates.length > 0) {
      const affectedCampaigns = [...new Set(duplicates.flatMap(([_, leads]) => leads.map(l => l.campaign)))];
      
      anomalies.push({
        id: `duplicate-leads-${Date.now()}`,
        type: AnomalyType.DUPLICATE_LEADS,
        severity: duplicates.length > 10 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
        title: 'Leads Duplicados Detectados',
        description: `Encontrados ${duplicates.length} emails duplicados em ${affectedCampaigns.length} campanhas`,
        confidence: 0.95,
        affectedCampaigns,
        metrics: { duplicateCount: duplicates.length, totalLeads: allLeads.length },
        recommendations: [
          'Verificar processo de captura de leads',
          'Implementar validação de duplicatas',
          'Revisar integração com CRM',
          'Analisar qualidade das fontes de tráfego'
        ],
        detectedAt: new Date()
      });
    }
  }

  // Detectar queda de performance (comparar últimos 30% com primeiros 30%)
  if (data.length >= 6) {
    const sortedData = data.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const recentCount = Math.floor(data.length * 0.3);
    const historicalCount = Math.floor(data.length * 0.3);
    
    const recentData = sortedData.slice(-recentCount);
    const historicalData = sortedData.slice(0, historicalCount);
    
    const recentAvgCR = recentData.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / recentData.length;
    const historicalAvgCR = historicalData.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / historicalData.length;
    
    const performanceDrop = (historicalAvgCR - recentAvgCR) / historicalAvgCR;
    
    if (performanceDrop > config.performanceDropThreshold) {
      const affectedCampaigns = [...new Set([...recentData, ...historicalData].map(d => d.campaign_name))];
      
      anomalies.push({
        id: `performance-drop-${Date.now()}`,
        type: AnomalyType.PERFORMANCE_DROP,
        severity: performanceDrop > 0.5 ? AnomalySeverity.CRITICAL : AnomalySeverity.HIGH,
        title: 'Queda Significativa de Performance',
        description: `Performance recente caiu ${(performanceDrop * 100).toFixed(1)}% comparado ao histórico`,
        confidence: 0.85,
        affectedCampaigns,
        metrics: { 
          recentAverage: recentAvgCR, 
          historicalAverage: historicalAvgCR, 
          dropPercentage: performanceDrop 
        },
        recommendations: [
          'Analisar mudanças recentes nas campanhas',
          'Verificar concorrência e mercado',
          'Revisar criativos e copy',
          'Otimizar segmentação de público'
        ],
        detectedAt: new Date()
      });
    }
  }

  return anomalies;
}

// Análise com IA
async function detectAIAnomalies(data: any[], config: DetectionConfig): Promise<DetectedAnomaly[]> {
  const anomalies: DetectedAnomaly[] = [];

  try {
    const prompt = `
Analise os seguintes dados de campanhas e identifique possíveis anomalias ou padrões suspeitos:

${JSON.stringify(data.slice(0, 20), null, 2)}

Procure por:
1. Padrões suspeitos de tráfego
2. Conversões manuais ou artificiais
3. Comportamentos anômalos
4. Qualidade questionável de leads

Retorne APENAS um JSON válido no formato:
{
  "anomalies": [
    {
      "type": "SUSPICIOUS_TRAFFIC",
      "severity": "HIGH",
      "title": "Título da anomalia",
      "description": "Descrição detalhada",
      "confidence": 0.85,
      "affectedCampaigns": ["Nome da campanha"],
      "recommendations": ["Recomendação 1", "Recomendação 2"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{"anomalies":[]}');
    
    result.anomalies?.forEach((anomaly: any, index: number) => {
      anomalies.push({
        id: `ai-${Date.now()}-${index}`,
        type: AnomalyType[anomaly.type as keyof typeof AnomalyType] || AnomalyType.UNUSUAL_PATTERN,
        severity: AnomalySeverity[anomaly.severity as keyof typeof AnomalySeverity] || AnomalySeverity.MEDIUM,
        title: anomaly.title,
        description: anomaly.description,
        confidence: anomaly.confidence || 0.7,
        affectedCampaigns: anomaly.affectedCampaigns || [],
        metrics: anomaly.metrics || {},
        recommendations: anomaly.recommendations || [],
        detectedAt: new Date()
      });
    });

  } catch (error) {
    console.error('Erro na análise de IA:', error);
  }

  return anomalies;
}

// Deduplicar e ordenar anomalias
function deduplicateAndSort(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
  // Remover duplicatas baseado em tipo + campanhas afetadas
  const unique = anomalies.filter((anomaly, index, self) => 
    index === self.findIndex(a => 
      a.type === anomaly.type && 
      JSON.stringify(a.affectedCampaigns.sort()) === JSON.stringify(anomaly.affectedCampaigns.sort())
    )
  );

  // Ordenar por severidade e confiança
  const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  
  return unique.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });
} 