import { NextRequest } from 'next/server';

// Configurações do rate limit geral
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 100;

// Configurações específicas para OpenAI API
const OPENAI_RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 5,
  REQUESTS_PER_HOUR: 100,
  REQUESTS_PER_DAY: 500,
  COOLDOWN_PERIOD: 60000, // 1 minuto após erro 429
};

// Mapa para armazenar contadores de requisições por IP
export const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Mapa específico para OpenAI API
export const openaiRequestCounts = new Map<string, { 
  minuteCount: number; 
  hourCount: number; 
  dayCount: number;
  minuteResetTime: number;
  hourResetTime: number;
  dayResetTime: number;
  lastError429: number | null;
}>();

export function checkRateLimit(req: NextRequest): { isLimited: boolean; resetTime: number | null } {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Limpa contadores expirados
  Array.from(requestCounts.entries()).forEach(([key, value]) => {
    if (value.resetTime <= now) {
      requestCounts.delete(key);
    }
  });

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

// Rate limiting específico para OpenAI API
export function checkOpenAIRateLimit(identifier: string = 'global'): { 
  isLimited: boolean; 
  resetTime: number | null;
  reason?: string;
} {
  const now = Date.now();
  
  // Obtém ou cria contador para OpenAI
  let counter = openaiRequestCounts.get(identifier);
  if (!counter) {
    counter = {
      minuteCount: 0,
      hourCount: 0,
      dayCount: 0,
      minuteResetTime: now + 60000, // 1 minuto
      hourResetTime: now + 3600000, // 1 hora
      dayResetTime: now + 86400000, // 1 dia
      lastError429: null
    };
    openaiRequestCounts.set(identifier, counter);
  }

  // Verificar se ainda está em cooldown após erro 429
  if (counter.lastError429 && now - counter.lastError429 < OPENAI_RATE_LIMIT.COOLDOWN_PERIOD) {
    return { 
      isLimited: true, 
      resetTime: counter.lastError429 + OPENAI_RATE_LIMIT.COOLDOWN_PERIOD,
      reason: 'Cooldown após erro 429'
    };
  }

  // Reset contadores expirados
  if (now >= counter.minuteResetTime) {
    counter.minuteCount = 0;
    counter.minuteResetTime = now + 60000;
  }
  if (now >= counter.hourResetTime) {
    counter.hourCount = 0;
    counter.hourResetTime = now + 3600000;
  }
  if (now >= counter.dayResetTime) {
    counter.dayCount = 0;
    counter.dayResetTime = now + 86400000;
  }

  // Verificar limites
  if (counter.minuteCount >= OPENAI_RATE_LIMIT.REQUESTS_PER_MINUTE) {
    return { 
      isLimited: true, 
      resetTime: counter.minuteResetTime,
      reason: 'Limite por minuto excedido'
    };
  }
  if (counter.hourCount >= OPENAI_RATE_LIMIT.REQUESTS_PER_HOUR) {
    return { 
      isLimited: true, 
      resetTime: counter.hourResetTime,
      reason: 'Limite por hora excedido'
    };
  }
  if (counter.dayCount >= OPENAI_RATE_LIMIT.REQUESTS_PER_DAY) {
    return { 
      isLimited: true, 
      resetTime: counter.dayResetTime,
      reason: 'Limite diário excedido'
    };
  }

  // Incrementar contadores
  counter.minuteCount++;
  counter.hourCount++;
  counter.dayCount++;

  return { isLimited: false, resetTime: null };
}

// Registrar erro 429 da OpenAI
export function recordOpenAI429Error(identifier: string = 'global'): void {
  const counter = openaiRequestCounts.get(identifier);
  if (counter) {
    counter.lastError429 = Date.now();
  }
}

// Obter estatísticas da OpenAI
export function getOpenAIStats(identifier: string = 'global'): {
  minuteCount: number;
  hourCount: number;
  dayCount: number;
  minuteRemaining: number;
  hourRemaining: number;
  dayRemaining: number;
  inCooldown: boolean;
} | null {
  const counter = openaiRequestCounts.get(identifier);
  if (!counter) return null;

  const now = Date.now();
  const inCooldown = counter.lastError429 && now - counter.lastError429 < OPENAI_RATE_LIMIT.COOLDOWN_PERIOD;

  return {
    minuteCount: counter.minuteCount,
    hourCount: counter.hourCount,
    dayCount: counter.dayCount,
    minuteRemaining: Math.max(0, OPENAI_RATE_LIMIT.REQUESTS_PER_MINUTE - counter.minuteCount),
    hourRemaining: Math.max(0, OPENAI_RATE_LIMIT.REQUESTS_PER_HOUR - counter.hourCount),
    dayRemaining: Math.max(0, OPENAI_RATE_LIMIT.REQUESTS_PER_DAY - counter.dayCount),
    inCooldown: !!inCooldown
  };
}

export function resetRateLimit(): void {
  requestCounts.clear();
}

// Função auxiliar para testes
export function getRequestCount(ip: string): { count: number; resetTime: number } | undefined {
  return requestCounts.get(ip);
} 