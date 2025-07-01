import { NextResponse } from 'next/server';

// Log de diagnóstico para verificar se o arquivo está sendo carregado
console.log('🔍 [DIAGNÓSTICO] Arquivo route.js de test-simple carregado:', new Date().toISOString());

export async function GET() {
  console.log('🔍 [DIAGNÓSTICO] GET /api/test-simple chamado:', new Date().toISOString());
  
  return NextResponse.json({
    message: 'Test simple endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success',
    diagnostic: 'Endpoint funcionando corretamente'
  });
} 