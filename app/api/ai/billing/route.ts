import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Preços da OpenAI (por 1K tokens) - Janeiro 2025
const PRICING = {
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03
  }
};

// Cache para evitar chamadas excessivas
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

interface UsageData {
  date: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  estimatedCost: number;
  model: string;
}

interface BillingResponse {
  success: boolean;
  data: {
    currentPeriod: {
      startDate: string;
      endDate: string;
      totalCost: number;
      totalTokens: number;
      totalRequests: number;
    };
    dailyUsage: UsageData[];
    limits: {
      softLimit: number;
      hardLimit: number;
      usagePercentage: number;
    };
    alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      threshold: number;
    }>;
  };
  source: 'openai_api' | 'local_estimation';
  lastUpdated: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '7');
    const cacheKey = `billing_${days}`;

    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Tentar buscar dados da OpenAI primeiro (se Admin Key estiver disponível)
    let billingData: BillingResponse;
    
    if (process.env.OPENAI_ADMIN_API_KEY) {
      try {
        billingData = await fetchOpenAIBilling(days);
      } catch (error) {
        console.warn('Failed to fetch from OpenAI API, falling back to local estimation:', error);
        billingData = await fetchLocalEstimation(days);
      }
    } else {
      // Usar estimativas locais baseadas nos logs da aplicação
      billingData = await fetchLocalEstimation(days);
    }

    // Salvar no cache
    cache.set(cacheKey, {
      data: billingData,
      timestamp: Date.now()
    });

    return NextResponse.json(billingData);

  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao consultar dados de billing',
        source: 'error'
      },
      { status: 500 }
    );
  }
}

async function fetchOpenAIBilling(days: number): Promise<BillingResponse> {
  // Primeiro, tentar buscar dados reais da OpenAI
  try {
    const realData = await fetchRealOpenAIUsage(days);
    if (realData) {
      return realData;
    }
  } catch (error) {
    console.log('Dados reais da OpenAI não disponíveis:', error);
  }

  // Fallback: usar dados dos logs locais
  return await fetchLocalEstimation(days);
}

async function fetchRealOpenAIUsage(days: number): Promise<BillingResponse | null> {
  try {
    // Buscar dados de uso da OpenAI para cada dia dos últimos N dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dailyUsage = [];
    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;

    // Iterar por cada dia para buscar dados
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      try {
        // Tentar diferentes endpoints da OpenAI
        const usageResponse = await fetch(
          `https://api.openai.com/v1/usage?date=${dateStr}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          
          const dayTokens = usageData.total_tokens || 0;
          const dayCost = usageData.total_cost || 0;
          const dayRequests = usageData.total_requests || 0;

          dailyUsage.push({
            date: dateStr,
            totalTokens: dayTokens,
            inputTokens: usageData.input_tokens || 0,
            outputTokens: usageData.output_tokens || 0,
            requests: dayRequests,
            estimatedCost: dayCost,
            model: 'gpt-4'
          });

          totalTokens += dayTokens;
          totalCost += dayCost;
          totalRequests += dayRequests;
        } else {
          // Adicionar dia vazio se não houver dados
          dailyUsage.push({
            date: dateStr,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            requests: 0,
            estimatedCost: 0,
            model: 'gpt-4'
          });
        }
      } catch (dayError) {
        console.log(`Erro ao buscar dados para ${dateStr}:`, dayError);
        // Adicionar dia vazio em caso de erro
        dailyUsage.push({
          date: dateStr,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          requests: 0,
          estimatedCost: 0,
          model: 'gpt-4'
        });
      }
    }

    // Se conseguiu dados reais (mesmo que parciais), retornar
    if (totalTokens > 0 || totalCost > 0) {
      const softLimit = 50;
      const hardLimit = 100;
      const usagePercentage = (totalCost / softLimit) * 100;

      const alerts = [];
      if (usagePercentage > 80) {
        alerts.push({
          type: 'warning' as const,
          message: `Uso atual (${usagePercentage.toFixed(1)}%) se aproxima do limite`,
          threshold: 80
        });
      }
      if (usagePercentage > 95) {
        alerts.push({
          type: 'error' as const,
          message: `Uso crítico (${usagePercentage.toFixed(1)}%) - próximo do limite`,
          threshold: 95
        });
      }

      return {
        success: true,
        data: {
          currentPeriod: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalCost,
            totalTokens,
            totalRequests
          },
          dailyUsage: dailyUsage.reverse(), // Mais recente primeiro
          limits: {
            softLimit,
            hardLimit,
            usagePercentage
          },
          alerts
        },
        source: 'openai_api',
        lastUpdated: new Date().toISOString()
      };
    }

    return null; // Sem dados reais disponíveis

  } catch (error) {
    console.error('Erro ao buscar dados reais da OpenAI:', error);
    return null;
  }
}

async function fetchLocalEstimation(days: number): Promise<BillingResponse> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Buscar logs de uso da aplicação (estimativa baseada em análises realizadas)
  const { data: analysisLogs, error } = await supabase
    .from('ai_analysis_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analysis logs:', error);
  }

  const logs = analysisLogs || [];

  // Agrupar por dia
  const dailyStats = new Map();
  let totalCost = 0;
  let totalTokens = 0;
  const totalRequests = logs.length;

  for (const log of logs) {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    
    if (!dailyStats.has(date)) {
      dailyStats.set(date, {
        date,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        requests: 0,
        estimatedCost: 0,
        model: 'gpt-4'
      });
    }

    const dayStats = dailyStats.get(date);
    
    // Estimativas baseadas no tipo de análise
    let estimatedInputTokens = 0;
    let estimatedOutputTokens = 0;

    switch (log.analysis_type) {
      case 'performance':
        estimatedInputTokens = 1500;
        estimatedOutputTokens = 800;
        break;
      case 'anomalies':
        estimatedInputTokens = 800;
        estimatedOutputTokens = 400;
        break;
      case 'optimization':
        estimatedInputTokens = 1200;
        estimatedOutputTokens = 600;
        break;
      case 'chat':
        estimatedInputTokens = 600;
        estimatedOutputTokens = 300;
        break;
      default:
        estimatedInputTokens = 1000;
        estimatedOutputTokens = 500;
    }

    dayStats.inputTokens += estimatedInputTokens;
    dayStats.outputTokens += estimatedOutputTokens;
    dayStats.totalTokens += estimatedInputTokens + estimatedOutputTokens;
    dayStats.requests += 1;

    // Calcular custo estimado (assumindo GPT-4)
    const inputCost = (estimatedInputTokens / 1000) * PRICING['gpt-4'].input;
    const outputCost = (estimatedOutputTokens / 1000) * PRICING['gpt-4'].output;
    dayStats.estimatedCost += inputCost + outputCost;
  }

  // Converter para array e calcular totais
  const dailyUsage: UsageData[] = Array.from(dailyStats.values());
  
  for (const day of dailyUsage) {
    totalCost += day.estimatedCost;
    totalTokens += day.totalTokens;
  }

  // Preencher dias sem dados
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!dailyStats.has(dateStr)) {
      dailyUsage.push({
        date: dateStr,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        requests: 0,
        estimatedCost: 0,
        model: 'gpt-4'
      });
    }
  }

  // Ordenar por data (mais recente primeiro)
  dailyUsage.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Definir limites (valores padrão configuráveis)
  const softLimit = 50; // $50 USD para estimativas locais
  const hardLimit = 100; // $100 USD
  const usagePercentage = (totalCost / softLimit) * 100;

  // Gerar alertas
  const alerts = [];
  if (usagePercentage > 80) {
    alerts.push({
      type: 'warning' as const,
      message: `Uso estimado (${usagePercentage.toFixed(1)}%) se aproxima do limite configurado`,
      threshold: 80
    });
  }
  if (usagePercentage > 95) {
    alerts.push({
      type: 'error' as const,
      message: `Uso crítico estimado (${usagePercentage.toFixed(1)}%) - próximo do limite`,
      threshold: 95
    });
  }

  // Adicionar alerta informativo sobre estimativas
  alerts.push({
    type: 'info' as const,
    message: 'Dados baseados em estimativas locais. Configure Admin API Key para dados precisos.',
    threshold: 0
  });

  return {
    success: true,
    data: {
      currentPeriod: {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalCost,
        totalTokens,
        totalRequests
      },
      dailyUsage: dailyUsage.slice(0, days), // Limitar aos dias solicitados
      limits: {
        softLimit,
        hardLimit,
        usagePercentage
      },
      alerts
    },
    source: 'local_estimation',
    lastUpdated: new Date().toISOString()
  };
} 