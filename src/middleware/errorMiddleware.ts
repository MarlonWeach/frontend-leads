import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../utils/logger';
import { handleError, formatErrorForResponse, AppError } from '../utils/errorHandler';
import { captureError } from '../lib/sentry';

// Interface para configuração do middleware
export interface ErrorMiddlewareConfig {
  enableLogging?: boolean;
  enableSentry?: boolean;
  includeStack?: boolean;
  logPerformance?: boolean;
}

// Função para criar middleware de tratamento de erros
export function createErrorMiddleware(config: ErrorMiddlewareConfig = {}) {
  const {
    enableLogging = true,
    enableSentry = true,
    includeStack = process.env.NODE_ENV === 'development',
    logPerformance = true
  } = config;

  return function errorMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now();
      const requestId = generateRequestId();
      
      try {
        // Adicionar requestId ao contexto
        const context = {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: getClientIP(request)
        };

        if (enableLogging) {
          logger.info({
            msg: 'Requisição iniciada',
            ...context
          });
        }

        // Executar o handler
        const response = await handler(request);

        // Log de performance se habilitado
        if (logPerformance) {
          const duration = Date.now() - startTime;
          logger.info({
            msg: 'Requisição concluída',
            ...context,
            statusCode: response.status,
            duration,
            durationMs: duration
          });
        }

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;
        const context = {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: getClientIP(request),
          duration,
          durationMs: duration
        };

        // Tratar erro usando o sistema centralizado
        const appError = handleError(error, context);

        // Log do erro
        if (enableLogging) {
          logger.error({
            msg: 'Erro na requisição',
            ...context,
            error: {
              name: appError.name,
              message: appError.message,
              code: appError.code,
              statusCode: appError.statusCode
            }
          });
        }

        // Capturar no Sentry se habilitado
        if (enableSentry && !appError.isOperational) {
          captureError(error, context);
        }

        // Formatar resposta de erro
        const errorResponse = formatErrorForResponse(appError);
        
        // Adicionar requestId à resposta
        const response = NextResponse.json(
          {
            ...errorResponse,
            requestId
          },
          { status: appError.statusCode }
        );

        // Adicionar headers úteis
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-Error-Code', appError.code);

        return response;
      }
    };
  };
}

// Função para wrapper de API routes
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config?: ErrorMiddlewareConfig
) {
  const errorMiddleware = createErrorMiddleware(config);
  
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    return errorMiddleware(async (req: NextRequest) => {
      return handler(req, ...args);
    })(request);
  };
}

// Função para validar entrada de dados
export function validateRequest(
  request: NextRequest,
  schema?: Record<string, any>
): Record<string, any> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Se há schema de validação, validar
    if (schema) {
      // Implementar validação com schema se necessário
      // Por enquanto, apenas retornar os parâmetros
    }
    
    return params;
  } catch (error) {
    throw new AppError('Parâmetros de requisição inválidos', 'VALIDATION_ERROR', 400);
  }
}

// Função para validar corpo da requisição
export async function validateBody<T>(
  request: NextRequest,
  schema?: Record<string, any>
): Promise<T> {
  try {
    const body = await request.json();
    
    // Se há schema de validação, validar
    if (schema) {
      // Implementar validação com schema se necessário
      // Por enquanto, apenas retornar o corpo
    }
    
    return body as T;
  } catch (error) {
    throw new AppError('Corpo da requisição inválido', 'VALIDATION_ERROR', 400);
  }
}

// Função para criar resposta de sucesso padronizada
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status: statusCode });

  return response;
}

// Função para criar resposta de erro padronizada
export function createErrorResponse(
  error: AppError,
  requestId?: string
): NextResponse {
  const errorResponse = formatErrorForResponse(error);
  
  const response = NextResponse.json(
    {
      ...errorResponse,
      requestId
    },
    { status: error.statusCode }
  );

  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }
  response.headers.set('X-Error-Code', error.code);

  return response;
}

// Função para gerar ID único para requisição
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Função para obter IP do cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Função para log de performance de operações específicas
export function logOperationPerformance(
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

// Decorator para medir performance de métodos de classe
export function measureMethodPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const context = {
        method: propertyName,
        className: target.constructor.name
      };
      
      try {
        const result = await method.apply(this, args);
        logOperationPerformance(operation, startTime, context);
        return result;
      } catch (error) {
        logOperationPerformance(operation, startTime, { 
          ...context, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      }
    };
  };
}

// Função para middleware de rate limiting simples
export function createRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const clientIP = getClientIP(request);
      const now = Date.now();
      
      // Limpar registros expirados
      for (const [ip, data] of Array.from(requests.entries())) {
        if (now > data.resetTime) {
          requests.delete(ip);
        }
      }
      
      // Verificar limite
      const clientData = requests.get(clientIP);
      if (clientData && now < clientData.resetTime) {
        if (clientData.count >= maxRequests) {
          logger.warn({
            msg: 'Rate limit excedido',
            clientIP,
            count: clientData.count,
            maxRequests
          });
          
          return createErrorResponse(
            new AppError('Limite de taxa excedido', 'RATE_LIMIT_ERROR', 429),
            generateRequestId()
          );
        }
        clientData.count++;
      } else {
        requests.set(clientIP, {
          count: 1,
          resetTime: now + windowMs
        });
      }
      
      return handler(request);
    };
  };
} 