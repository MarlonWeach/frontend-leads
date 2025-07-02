import { logger } from './logger';
import { captureError } from '../lib/sentry';

// Classes de erro customizadas
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Erro de autenticação', context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Erro de autorização', context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado', context?: Record<string, any>) {
    super(message, 'NOT_FOUND_ERROR', 404, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Limite de taxa excedido', context?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
  }
}

export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    public readonly externalCode?: string,
    context?: Record<string, any>
  ) {
    super(message, 'EXTERNAL_API_ERROR', 502, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

// Função para criar erros padronizados
export function createError(
  type: 'validation' | 'auth' | 'notFound' | 'rateLimit' | 'external' | 'database' | 'internal',
  message: string,
  context?: Record<string, any>
): AppError {
  switch (type) {
    case 'validation':
      return new ValidationError(message, context);
    case 'auth':
      return new AuthenticationError(message, context);
    case 'notFound':
      return new NotFoundError(message, context);
    case 'rateLimit':
      return new RateLimitError(message, context);
    case 'external':
      return new ExternalAPIError(message, undefined, context);
    case 'database':
      return new DatabaseError(message, context);
    case 'internal':
    default:
      return new AppError(message, 'INTERNAL_ERROR', 500, true, context);
  }
}

// Função para tratar erros de forma centralizada
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // Se já é um AppError, apenas logar e retornar
  if (error instanceof AppError) {
    logger.error({
      msg: 'Erro operacional capturado',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        context: error.context
      },
      additionalContext: context
    });

    // Capturar no Sentry se for erro não operacional
    if (!error.isOperational) {
      captureError(error, { ...error.context, ...context });
    }

    return error;
  }

  // Se é um Error padrão, converter para AppError
  if (error instanceof Error) {
    const appError = new AppError(
      error.message,
      'INTERNAL_ERROR',
      500,
      false,
      { originalError: error.name, stack: error.stack, ...context }
    );

    logger.error({
      msg: 'Erro não operacional capturado',
      error: {
        name: appError.name,
        message: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        originalError: error.name,
        stack: error.stack
      },
      additionalContext: context
    });

    // Sempre capturar erros não operacionais no Sentry
    captureError(error, { ...appError.context, ...context });

    return appError;
  }

  // Se é um erro desconhecido, criar AppError genérico
  const appError = new AppError(
    'Erro desconhecido',
    'UNKNOWN_ERROR',
    500,
    false,
    { originalError: String(error), ...context }
  );

  logger.error({
    msg: 'Erro desconhecido capturado',
    error: {
      name: appError.name,
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      originalError: String(error)
    },
    additionalContext: context
  });

  captureError(new Error(String(error)), { ...appError.context, ...context });

  return appError;
}

// Função para retry com backoff exponencial
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: Record<string, any>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Se é o último attempt, não tentar novamente
      if (attempt === maxRetries) {
        logger.error({
          msg: 'Retry falhou após todas as tentativas',
          attempt,
          maxRetries,
          error: lastError.message,
          context
        });
        throw lastError;
      }

      // Calcular delay com backoff exponencial
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      logger.warn({
        msg: 'Tentativa falhou, tentando novamente',
        attempt,
        maxRetries,
        delay,
        error: lastError.message,
        context
      });

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Função para validar se um erro é recuperável
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }

  if (error instanceof Error) {
    // Erros de rede são geralmente recuperáveis
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return true;
    }

    // Timeouts são recuperáveis
    if (error.message.includes('timeout')) {
      return true;
    }

    // Rate limits são recuperáveis
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return true;
    }
  }

  return false;
}

// Função para formatar erro para resposta HTTP
export function formatErrorForResponse(error: AppError): {
  error: string;
  code: string;
  details?: string;
  timestamp: string;
} {
  return {
    error: error.message,
    code: error.code,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  };
}

// Função para log de performance
export function logPerformance(
  operation: string,
  startTime: number,
  context?: Record<string, any>
): void {
  const duration = Date.now() - startTime;
  
  logger.info({
    msg: 'Operação concluída',
    operation,
    duration,
    durationMs: duration,
    context
  });
}

// Decorator para medir performance de funções
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        logPerformance(operation, startTime, { method: propertyName });
        return result;
      } catch (error) {
        logPerformance(operation, startTime, { 
          method: propertyName, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      }
    };
  };
} 