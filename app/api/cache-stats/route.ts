import { NextRequest, NextResponse } from 'next/server';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

// Cache em memória para o Vercel (simula banco de dados)
let cacheStats = [
  {
    id: 1,
    cache_type: 'general',
    hits: 150,
    misses: 25,
    size_bytes: 1024000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    cache_type: 'api',
    hits: 89,
    misses: 12,
    size_bytes: 512000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    cache_type: 'dashboard',
    hits: 234,
    misses: 45,
    size_bytes: 2048000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET(_request: NextRequest) {
  try {
    console.log('Cache Stats API - GET request received');
    
    const response = {
      success: true,
      message: 'Cache Stats API funcionando via Vercel!',
      timestamp: new Date().toISOString(),
      method: 'GET',
      data: cacheStats,
      endpoint: 'https://frontend-leads-pi.vercel.app/api/cache-stats'
    };

    console.log('Cache Stats API - Returning response:', response);

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Erro na Cache Stats API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Cache Stats API - POST request received');
    
    const body = await request.json();
    const { action, data } = body;

    let response;

    switch (action) {
      case 'invalidate': {
        // Invalidar cache
        console.log('Invalidando cache...');
        response = {
          success: true,
          message: 'Cache invalidado com sucesso',
          timestamp: new Date().toISOString(),
          method: 'POST',
          action: 'invalidate',
          endpoint: 'https://frontend-leads-pi.vercel.app/api/cache-stats'
        };
        break;
      }

      case 'stats': {
        // Buscar estatísticas específicas
        console.log('Buscando estatísticas específicas...');
        const filteredStats = cacheStats.filter(stat => 
          !data?.cacheType || stat.cache_type === data.cacheType
        );
        
        response = {
          success: true,
          message: 'Estatísticas recuperadas com sucesso',
          timestamp: new Date().toISOString(),
          method: 'POST',
          action: 'stats',
          data: filteredStats,
          endpoint: 'https://frontend-leads-pi.vercel.app/api/cache-stats'
        };
        break;
      }

      case 'update': {
        // Atualizar estatísticas
        console.log('Atualizando estatísticas...');
        const { cacheType, hits, misses, sizeBytes } = data || {};
        
        if (cacheType) {
          const existingIndex = cacheStats.findIndex(stat => stat.cache_type === cacheType);
          if (existingIndex >= 0) {
            cacheStats[existingIndex] = {
              ...cacheStats[existingIndex],
              hits: hits || cacheStats[existingIndex].hits,
              misses: misses || cacheStats[existingIndex].misses,
              size_bytes: sizeBytes || cacheStats[existingIndex].size_bytes,
              updated_at: new Date().toISOString()
            };
          } else {
            cacheStats.push({
              id: cacheStats.length + 1,
              cache_type: cacheType,
              hits: hits || 0,
              misses: misses || 0,
              size_bytes: sizeBytes || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
        
        response = {
          success: true,
          message: 'Estatísticas atualizadas com sucesso',
          timestamp: new Date().toISOString(),
          method: 'POST',
          action: 'update',
          data: cacheStats,
          endpoint: 'https://frontend-leads-pi.vercel.app/api/cache-stats'
        };
        break;
      }

      default:
        response = {
          success: true,
          message: 'Cache Stats API funcionando via Vercel!',
          timestamp: new Date().toISOString(),
          method: 'POST',
          receivedData: body,
          endpoint: 'https://frontend-leads-pi.vercel.app/api/cache-stats'
        };
    }

    console.log('Cache Stats API - Returning response:', response);

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Erro na Cache Stats API (POST):', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 