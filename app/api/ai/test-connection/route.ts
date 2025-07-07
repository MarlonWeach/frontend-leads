import { NextRequest, NextResponse } from 'next/server';
import { openai, logOpenAIRequest, logOpenAIResponse } from '../../../../src/lib/ai/config';
import { AIService } from '../../../../src/lib/ai/aiService';
import { anthropic, logAnthropicRequest, logAnthropicResponse } from '../../../../src/lib/ai/config';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {
      openai: { success: false, message: '', provider: 'OpenAI' },
      anthropic: { success: false, message: '', provider: 'Anthropic' },
      fallback: { success: false, message: '', provider: 'AI Service (with fallback)' }
    }
  };

  // Teste 1: OpenAI direto (pode falhar por quota)
  try {
    console.log('🔍 [TESTE OPENAI] Testando conexão direta com OpenAI...');
    
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Responda apenas "OK" se você está funcionando.' }],
      max_tokens: 10,
      temperature: 0,
    });

    const message = response.choices[0]?.message?.content?.trim();
    
    if (message === 'OK') {
      results.tests.openai = { success: true, message: 'OpenAI funcionando normalmente', provider: 'OpenAI' };
    } else {
      results.tests.openai = { success: false, message: 'Resposta inesperada do OpenAI', provider: 'OpenAI' };
    }
  } catch (error: any) {
    console.log('🔍 [TESTE OPENAI] Detalhes do erro:', {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      param: error.param,
      headers: error.headers,
      stack: error.stack
    });
    
    results.tests.openai = { 
      success: false, 
      message: `Erro OpenAI: ${error.message || 'Erro desconhecido'}`, 
      provider: 'OpenAI' 
    };
  }

  // Teste 2: Anthropic direto
  try {
    console.log('🔍 [TESTE ANTHROPIC] Testando conexão direta com Anthropic...');
    
    const requestId = `test_${Date.now()}`;
    const messages = [{ role: 'user' as const, content: 'Responda apenas "OK" se você está funcionando.' }];
    
    logAnthropicRequest({
      model: 'claude-3-5-haiku-20241022',
      messages,
      requestId,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      temperature: 0,
      messages,
    });

    logAnthropicResponse(response);
    
    const content = response.content[0]?.type === 'text' ? response.content[0]?.text?.trim() : '';
    
    if (content === 'OK') {
      results.tests.anthropic = { success: true, message: 'Anthropic funcionando normalmente', provider: 'Anthropic' };
    } else {
      results.tests.anthropic = { success: false, message: 'Resposta inesperada do Anthropic', provider: 'Anthropic' };
    }
  } catch (error: any) {
    console.log('🔍 [TESTE ANTHROPIC] Detalhes do erro:', {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    
    logAnthropicResponse(null, error);
    
    results.tests.anthropic = { 
      success: false, 
      message: `Erro Anthropic: ${error.message || 'Erro desconhecido'}`, 
      provider: 'Anthropic' 
    };
  }

  // Teste 3: AI Service com fallback
  try {
    console.log('🔍 [TESTE FALLBACK] Testando AIService com fallback...');
    
    const aiService = AIService.getInstance();
    const result = await aiService.testConnection();
    
    results.tests.fallback = { 
      success: result.success, 
      message: result.message, 
      provider: 'AI Service (with fallback)' 
    };
  } catch (error: any) {
    console.log('🔍 [TESTE FALLBACK] Detalhes do erro:', {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    
    results.tests.fallback = { 
      success: false, 
      message: `Erro AI Service: ${error.message || 'Erro desconhecido'}`, 
      provider: 'AI Service (with fallback)' 
    };
  }

  // Resumo dos resultados
  const summary = {
    total: 3,
    passed: Object.values(results.tests).filter(test => test.success).length,
    failed: Object.values(results.tests).filter(test => !test.success).length,
  };

  console.log('🎯 [RESUMO TESTES]', {
    summary,
    results: results.tests,
    recommendations: {
      openai: results.tests.openai.success ? 'OpenAI disponível' : 'OpenAI indisponível - usando fallback',
      anthropic: results.tests.anthropic.success ? 'Anthropic disponível como fallback' : 'Anthropic também indisponível',
      fallback: results.tests.fallback.success ? 'Sistema de fallback funcionando' : 'Sistema de fallback com problemas'
    }
  });

  return NextResponse.json({
    ...results,
    summary,
    environment: {
      openai_key_present: !!process.env.OPENAI_API_KEY,
      anthropic_key_present: !!process.env.ANTHROPIC_API_KEY,
      openai_key_prefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not-found',
      anthropic_key_prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) || 'not-found',
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Mensagem é obrigatória'
      }, { status: 400 });
    }

    const requestId = `test_post_${Date.now()}`;
    const messages = [
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Log da requisição
    logOpenAIRequest({
      model: 'gpt-4o-mini',
      messages,
      requestId
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 100,
      temperature: 0.3
    });

    // Log de sucesso
    logOpenAIResponse({
      success: true,
      usage: response.usage,
      requestId
    });

    return NextResponse.json({
      success: true,
      response: response.choices[0]?.message?.content,
      usage: response.usage,
      requestId
    });

  } catch (error: any) {
    const requestId = `test_post_error_${Date.now()}`;
    
    // Log de erro
    logOpenAIResponse({
      success: false,
      error,
      requestId
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        type: error.type,
        code: error.code,
        status: error.status
      },
      requestId
    }, { status: error.status || 500 });
  }
} 