import { NextRequest } from 'next/server';

// Configurações do rate limit
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 100;

// Mapa para armazenar contadores de requisições por IP
export const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(req: NextRequest): { isLimited: boolean; resetTime: number | null } {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Limpa contadores expirados
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime <= now) {
      requestCounts.delete(key);
    }
  }

  // Obtém ou cria contador para o IP
  let counter = requestCounts.get(ip);
  if (!counter) {
    counter = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    requestCounts.set(ip, counter);
  }

  // Incrementa contador
  counter.count++;

  // Verifica se excedeu o limite
  if (counter.count > MAX_REQUESTS_PER_WINDOW) {
    return { isLimited: true, resetTime: counter.resetTime };
  }

  return { isLimited: false, resetTime: null };
}

export function resetRateLimit(): void {
  requestCounts.clear();
}

// Função auxiliar para testes
export function getRequestCount(ip: string): { count: number; resetTime: number } | undefined {
  return requestCounts.get(ip);
} 