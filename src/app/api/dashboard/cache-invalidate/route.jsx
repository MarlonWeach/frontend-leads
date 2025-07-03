import { NextResponse } from 'next/server';
import { invalidateCache, invalidateAllCache } from "@/utils/cache";
import { logger } from "@/utils/logger";

export async function POST(request) {
  try {
    logger.info('Cache invalidate endpoint called');
    
    const body = await request.json();
    const { event, key: _key, pattern: _pattern } = body;
    
    if (!event) {
      // Se não houver evento, invalida todo o cache
      const result = invalidateAllCache();
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        result
      });
    }
    
    const result = invalidateCache(event);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    logger.error('Error in cache invalidate endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to invalidate cache',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 