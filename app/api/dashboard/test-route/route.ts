import { NextResponse } from 'next/server';

// Log de diagnóstico para verificar se o arquivo está sendo carregado
console.log('🔍 [DIAGNÓSTICO] Arquivo route.ts de test-route carregado:', new Date().toISOString());

export async function GET() {
  console.log('🔍 [DIAGNÓSTICO] GET /api/dashboard/test-route chamado:', new Date().toISOString());
  
  return NextResponse.json({
    message: 'Test route working from dashboard folder',
    timestamp: new Date().toISOString(),
    status: 'success',
    diagnostic: 'Endpoint funcionando corretamente'
  });
} 