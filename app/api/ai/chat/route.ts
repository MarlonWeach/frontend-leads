import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiService } from '../../../../src/lib/ai/aiService';

export const dynamic = 'force-dynamic';

// Criar cliente Supabase sem realtime para evitar warning de critical dependency
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 0
      }
    }
  }
);

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  context: {
    data?: any;
    filters?: any;
    previousMessages?: ChatMessage[];
  };
}

// Prompts específicos para diferentes tipos de perguntas
const CHAT_PROMPTS = {
  GENERAL: `Você é um assistente virtual especializado em análise de campanhas de marketing digital do Facebook/Meta. 
Seu objetivo é ajudar gestores de marketing a entender seus dados de campanhas e tomar decisões informadas.

Características da sua personalidade:
- Profissional mas amigável
- Direto e objetivo nas respostas
- Usa dados concretos sempre que possível
- Oferece insights acionáveis
- Fala em português brasileiro

Contexto dos dados disponíveis:
- Campanhas de Lead Ads do Facebook/Meta
- Métricas: impressões, cliques, CTR, gastos, leads, CPL, taxa de conversão
- Dados históricos de performance
- Informações de segmentação e criativos`,

  PERFORMANCE_ANALYSIS: `Analise os dados de performance das campanhas e forneça insights sobre:
- Campanhas com melhor/pior performance
- Tendências de gastos e resultados
- Comparações de CTR, CPL e taxa de conversão
- Identificação de oportunidades de melhoria`,

  TROUBLESHOOTING: `Ajude a identificar e resolver problemas nas campanhas:
- Campanhas com performance abaixo do esperado
- Possíveis causas de quedas de performance
- Sugestões de otimização específicas
- Alertas sobre anomalias nos dados`,

  RECOMMENDATIONS: `Forneça recomendações estratégicas baseadas nos dados:
- Ajustes de orçamento entre campanhas
- Otimizações de segmentação
- Melhorias em criativos
- Estratégias de bidding e timing`
};

// Função para determinar o tipo de pergunta
function categorizeQuestion(message: string): keyof typeof CHAT_PROMPTS {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('performance') || lowerMessage.includes('resultado') || 
      lowerMessage.includes('métrica') || lowerMessage.includes('roi')) {
    return 'PERFORMANCE_ANALYSIS';
  }
  
  if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || 
      lowerMessage.includes('não está') || lowerMessage.includes('anomalia')) {
    return 'TROUBLESHOOTING';
  }
  
  if (lowerMessage.includes('como') || lowerMessage.includes('sugest') || 
      lowerMessage.includes('otimiz') || lowerMessage.includes('melhor')) {
    return 'RECOMMENDATIONS';
  }
  
  return 'GENERAL';
}

// Função para buscar dados relevantes baseado na pergunta
async function fetchRelevantData(message: string, filters?: any) {
  const lowerMessage = message.toLowerCase();
  
  try {
    // Se a pergunta menciona campanhas específicas, buscar dados detalhados
    if (lowerMessage.includes('campanha') || lowerMessage.includes('campaign')) {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          daily_budget,
          lifetime_budget,
          created_time,
          updated_time
        `)
        .eq('status', 'ACTIVE')
        .limit(10);

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        return null;
      }

      return { campaigns };
    }

    // Se menciona leads, buscar dados de leads
    if (lowerMessage.includes('lead') || lowerMessage.includes('conversão')) {
      const startDate = filters?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = filters?.endDate || new Date().toISOString().split('T')[0];

      const { data: leadsData, error } = await supabase
        .from('meta_leads')
        .select('*')
        .gte('created_time', startDate)
        .lte('created_time', endDate)
        .limit(100);

      if (error) {
        console.error('Erro ao buscar leads:', error);
        return null;
      }

      // Agregar dados de leads
      const totalLeads = leadsData?.length || 0;
      const totalSpend = leadsData?.reduce((sum, lead) => sum + (parseFloat(lead.spend) || 0), 0) || 0;
      const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

      return {
        leads: {
          total: totalLeads,
          totalSpend,
          avgCPL,
          period: `${startDate} a ${endDate}`
        }
      };
    }

    // Buscar dados gerais de performance
    const { data: performanceData, error } = await supabase
      .from('meta_leads')
      .select('*')
      .limit(50);

    if (error) {
      console.error('Erro ao buscar dados de performance:', error);
      return null;
    }

    return { performanceData: performanceData?.slice(0, 10) };
    
  } catch (error) {
    console.error('Erro ao buscar dados relevantes:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, context } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Determinar tipo de pergunta
    const questionType = categorizeQuestion(message);
    
    // Buscar dados relevantes
    const relevantData = await fetchRelevantData(message, context.filters);
    
    // Construir contexto para a IA
    const contextData = {
      currentData: context.data,
      filters: context.filters,
      relevantData,
      previousMessages: context.previousMessages?.slice(-3) // Últimas 3 mensagens
    };

    // Chamar serviço de IA
    const aiResponse = await aiService.processChatMessage(message, contextData);

    return NextResponse.json({
      response: aiResponse,
      questionType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API de chat:', error);
    
    return NextResponse.json({
      response: 'Desculpe, ocorreu um erro interno. Nossa equipe foi notificada e está trabalhando para resolver o problema. Tente novamente em alguns minutos.',
      error: true
    }, { status: 500 });
  }
} 