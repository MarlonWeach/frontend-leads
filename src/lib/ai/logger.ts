import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';

// Criar cliente Supabase dinamicamente para evitar erro de server/client boundary
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AIUsageLog {
  analysis_type: 'performance' | 'anomalies' | 'optimization' | 'chat' | 'insights';
  campaign_ids?: string[];
  date_range?: {
    startDate: string;
    endDate: string;
  };
  tokens_used?: number;
  cost_estimated?: number;
  model_used?: string;
  status?: 'completed' | 'error' | 'processing';
  error_message?: string;
  metadata?: any;
}

/**
 * Registra uso da IA no banco de dados para monitoramento de custos
 */
export async function logAIUsage(log: AIUsageLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_analysis_logs')
      .insert({
        analysis_type: log.analysis_type,
        campaign_ids: log.campaign_ids || [],
        date_range: log.date_range || null,
        tokens_used: log.tokens_used || null,
        cost_estimated: log.cost_estimated || null,
        model_used: log.model_used || 'gpt-4',
        status: log.status || 'completed',
        error_message: log.error_message || null,
        metadata: log.metadata || null,
      });

    if (error) {
      logger.error({
        msg: 'Erro ao registrar log de IA no banco de dados',
        error: error.message,
        code: error.code,
        details: error.details,
        logData: log
      });
    } else {
      logger.info({
        msg: 'Log de IA registrado com sucesso',
        analysisType: log.analysis_type,
        tokensUsed: log.tokens_used,
        costEstimated: log.cost_estimated,
        modelUsed: log.model_used,
        status: log.status
      });
    }
  } catch (error) {
    logger.error({
      msg: 'Erro ao registrar log de IA',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      logData: log
    });
  }
}

/**
 * Estima o número de tokens baseado no conteúdo
 */
export function estimateTokens(content: string): number {
  // Estimativa aproximada: 1 token ≈ 4 caracteres em inglês, 3.5 em português
  return Math.ceil(content.length / 3.5);
}

/**
 * Calcula custo estimado baseado no número de tokens
 */
export function calculateEstimatedCost(
  inputTokens: number, 
  outputTokens: number, 
  model: string = 'gpt-4'
): number {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 }
  };

  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4'];
  
  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
} 