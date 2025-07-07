import { openai } from './config';

// Tipos de anomalias detectáveis
export enum AnomalyType {
  HIGH_CONVERSION_RATE = 'HIGH_CONVERSION_RATE',
  SUSPICIOUS_TRAFFIC = 'SUSPICIOUS_TRAFFIC',
  MANUAL_CONVERSIONS = 'MANUAL_CONVERSIONS',
  DUPLICATE_LEADS = 'DUPLICATE_LEADS',
  COST_SPIKE = 'COST_SPIKE',
  PERFORMANCE_DROP = 'PERFORMANCE_DROP',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN',
  // Novos tipos específicos do setor automotivo
  LOW_CPL_SUSPICIOUS = 'LOW_CPL_SUSPICIOUS',
  HIGH_VOLUME_SUSPICIOUS = 'HIGH_VOLUME_SUSPICIOUS',
  QUALITY_DROP = 'QUALITY_DROP',
  SEASONAL_ANOMALY = 'SEASONAL_ANOMALY'
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

// Benchmarks automotivos específicos
export interface AutomotiveBenchmarks {
  economic: { cplRange: [number, number]; conversionRate: [number, number] };
  premium: { cplRange: [number, number]; conversionRate: [number, number] };
  suv: { cplRange: [number, number]; conversionRate: [number, number] };
  commercial: { cplRange: [number, number]; conversionRate: [number, number] };
  luxury: { cplRange: [number, number]; conversionRate: [number, number] };
}

// Configuração de detecção
export interface DetectionConfig {
  sensitivity: 'low' | 'medium' | 'high';
  deviationThreshold: number;
  conversionRateThreshold: number;
  cplThreshold: number; // Adicionado para compatibilidade com testes
  minDataPoints: number;
  costSpikeThreshold: number;
  performanceDropThreshold: number;
  // Novos parâmetros automotivos
  automotiveBenchmarks: AutomotiveBenchmarks;
  qualityThresholds: {
    excellent: number;
    high: number;
    medium: number;
    low: number;
  };
  redFlagThresholds: {
    cplTooLow: number;
    volumeTooHigh: number;
    qualityTooLow: number;
  };
}

// Benchmarks automotivos padrão
export const DEFAULT_AUTOMOTIVE_BENCHMARKS: AutomotiveBenchmarks = {
  economic: { cplRange: [15, 35], conversionRate: [0.08, 0.15] },
  premium: { cplRange: [45, 80], conversionRate: [0.15, 0.25] },
  suv: { cplRange: [35, 60], conversionRate: [0.12, 0.20] },
  commercial: { cplRange: [25, 50], conversionRate: [0.20, 0.35] },
  luxury: { cplRange: [80, 150], conversionRate: [0.25, 0.40] }
};

// Configurações por nível de sensibilidade
export function getDetectionConfig(sensitivity: 'low' | 'medium' | 'high' = 'medium'): DetectionConfig {
  const configs = {
    low: {
      sensitivity: 'low' as const,
      deviationThreshold: 3.0,
      conversionRateThreshold: 0.20,
      cplThreshold: 50, // Adicionado para compatibilidade com testes
      minDataPoints: 10,
      costSpikeThreshold: 3.0,
      performanceDropThreshold: 0.40,
      automotiveBenchmarks: DEFAULT_AUTOMOTIVE_BENCHMARKS,
      qualityThresholds: {
        excellent: 90,
        high: 75,
        medium: 50,
        low: 25
      },
      redFlagThresholds: {
        cplTooLow: 0.3, // 30% do benchmark
        volumeTooHigh: 4.0, // 400% do normal
        qualityTooLow: 0.3 // 30% de qualidade
      }
    },
    medium: {
      sensitivity: 'medium' as const,
      deviationThreshold: 2.5,
      conversionRateThreshold: 0.15,
      cplThreshold: 40, // Adicionado para compatibilidade com testes
      minDataPoints: 5,
      costSpikeThreshold: 2.5,
      performanceDropThreshold: 0.30,
      automotiveBenchmarks: DEFAULT_AUTOMOTIVE_BENCHMARKS,
      qualityThresholds: {
        excellent: 90,
        high: 75,
        medium: 50,
        low: 25
      },
      redFlagThresholds: {
        cplTooLow: 0.5, // 50% do benchmark
        volumeTooHigh: 3.0, // 300% do normal
        qualityTooLow: 0.5 // 50% de qualidade
      }
    },
    high: {
      sensitivity: 'high' as const,
      deviationThreshold: 2.0,
      conversionRateThreshold: 0.10,
      cplThreshold: 30, // Adicionado para compatibilidade com testes
      minDataPoints: 3,
      costSpikeThreshold: 2.0,
      performanceDropThreshold: 0.20,
      automotiveBenchmarks: DEFAULT_AUTOMOTIVE_BENCHMARKS,
      qualityThresholds: {
        excellent: 90,
        high: 75,
        medium: 50,
        low: 25
      },
      redFlagThresholds: {
        cplTooLow: 0.7, // 70% do benchmark
        volumeTooHigh: 2.0, // 200% do normal
        qualityTooLow: 0.7 // 70% de qualidade
      }
    }
  };

  return configs[sensitivity];
}

// Função para determinar categoria de veículo baseado no nome da campanha
export function detectVehicleCategory(campaignName: string): keyof AutomotiveBenchmarks {
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
  
  // Padrão para SUV se não conseguir identificar
  return 'suv';
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

    // 3. Detecção específica do setor automotivo
    anomalies.push(...detectAutomotiveAnomalies(data, fullConfig));

    // 4. Análise com IA (se dados suficientes)
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
      const affectedCampaigns = Array.from(new Set(duplicates.flatMap(([_, leads]) => leads.map(l => l.campaign))));
      
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
      const affectedCampaigns = Array.from(new Set([...recentData, ...historicalData].map(d => d.campaign_name)));
      
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

// Detecção específica do setor automotivo
function detectAutomotiveAnomalies(data: any[], config: DetectionConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  data.forEach(campaign => {
    const campaignName = campaign.campaign_name || campaign.name || '';
    const category = detectVehicleCategory(campaignName);
    const benchmarks = config.automotiveBenchmarks[category];
    
    const cpl = campaign.cpl || 0;
    const conversionRate = campaign.conversion_rate || 0;
    const volume = campaign.leads || 0;
    const quality = campaign.quality_score || 0;

    // CPL muito baixo (suspeita de fraude)
    if (cpl > 0 && cpl < benchmarks.cplRange[0] * config.redFlagThresholds.cplTooLow) {
      anomalies.push({
        id: `low-cpl-${campaign.campaign_id}`,
        type: AnomalyType.LOW_CPL_SUSPICIOUS,
        severity: AnomalySeverity.HIGH,
        title: 'CPL Suspeitamente Baixo',
        description: `Campanha "${campaignName}" tem CPL de R$ ${cpl.toFixed(2)}, muito abaixo do benchmark de R$ ${benchmarks.cplRange[0]}-${benchmarks.cplRange[1]} para ${category}`,
        confidence: 0.85,
        affectedCampaigns: [campaignName],
        metrics: { cpl, benchmark: benchmarks.cplRange, category },
        recommendations: [
          'Verificar se há tráfego incentivado',
          'Analisar qualidade dos leads recebidos',
          'Confirmar se dados são legítimos',
          'Revisar configurações de segmentação'
        ],
        detectedAt: new Date()
      });
    }

    // Volume muito alto (suspeita de fraude)
    const avgVolume = data.reduce((sum, c) => sum + (c.leads || 0), 0) / data.length;
    if (volume > avgVolume * config.redFlagThresholds.volumeTooHigh) {
      anomalies.push({
        id: `high-volume-${campaign.campaign_id}`,
        type: AnomalyType.HIGH_VOLUME_SUSPICIOUS,
        severity: AnomalySeverity.HIGH,
        title: 'Volume Suspeitamente Alto',
        description: `Campanha "${campaignName}" gerou ${volume} leads, muito acima da média de ${avgVolume.toFixed(0)} leads`,
        confidence: 0.80,
        affectedCampaigns: [campaignName],
        metrics: { volume, average: avgVolume, ratio: volume / avgVolume },
        recommendations: [
          'Verificar origem do tráfego',
          'Analisar qualidade dos leads',
          'Confirmar se não há bots ou tráfego incentivado',
          'Revisar configurações de campanha'
        ],
        detectedAt: new Date()
      });
    }

    // Qualidade muito baixa
    if (quality > 0 && quality < config.qualityThresholds.low) {
      anomalies.push({
        id: `low-quality-${campaign.campaign_id}`,
        type: AnomalyType.QUALITY_DROP,
        severity: AnomalySeverity.MEDIUM,
        title: 'Qualidade de Leads Muito Baixa',
        description: `Campanha "${campaignName}" tem qualidade de ${quality} pontos, muito abaixo do aceitável (${config.qualityThresholds.low}+)`,
        confidence: 0.75,
        affectedCampaigns: [campaignName],
        metrics: { quality, threshold: config.qualityThresholds.low },
        recommendations: [
          'Revisar segmentação de público',
          'Otimizar copy e criativos',
          'Analisar horários de veiculação',
          'Considerar ajustar targeting'
        ],
        detectedAt: new Date()
      });
    }

    // Anomalia sazonal
    const currentMonth = new Date().getMonth() + 1;
    const isLowSeason = currentMonth >= 7 && currentMonth <= 9; // Julho-Setembro
    const isHighSeason = (currentMonth >= 1 && currentMonth <= 3) || (currentMonth >= 10 && currentMonth <= 12);
    
    if (isLowSeason && conversionRate > benchmarks.conversionRate[1]) {
      anomalies.push({
        id: `seasonal-${campaign.campaign_id}`,
        type: AnomalyType.SEASONAL_ANOMALY,
        severity: AnomalySeverity.LOW,
        title: 'Performance Acima do Esperado para Baixa Temporada',
        description: `Campanha "${campaignName}" tem conversão de ${(conversionRate * 100).toFixed(1)}% em período de baixa temporada (Julho-Setembro)`,
        confidence: 0.70,
        affectedCampaigns: [campaignName],
        metrics: { conversionRate, season: 'low', benchmark: benchmarks.conversionRate },
        recommendations: [
          'Aproveitar o momento para otimizar campanha',
          'Analisar fatores que estão gerando boa performance',
          'Considerar aumentar investimento',
          'Documentar estratégias de sucesso'
        ],
        detectedAt: new Date()
      });
    }
  });

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