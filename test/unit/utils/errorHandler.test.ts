import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  RateLimitError, 
  ExternalAPIError, 
  DatabaseError,
  createError,
  handleError,
  withRetry,
  isRecoverableError,
  formatErrorForResponse
} from '../../../src/utils/errorHandler';

describe('ErrorHandler', () => {
  describe('AppError', () => {
    it('deve criar erro básico com valores padrão', () => {
      const error = new AppError('Erro de teste');
      
      expect(error.message).toBe('Erro de teste');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('deve criar erro com valores customizados', () => {
      const context = { userId: 123, action: 'test' };
      const error = new AppError('Erro customizado', 'CUSTOM_ERROR', 400, false, context);
      
      expect(error.message).toBe('Erro customizado');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
      expect(error.context).toEqual(context);
    });
  });

  describe('Error Classes', () => {
    it('deve criar ValidationError corretamente', () => {
      const error = new ValidationError('Dados inválidos');
      
      expect(error.message).toBe('Dados inválidos');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('deve criar AuthenticationError corretamente', () => {
      const error = new AuthenticationError('Token inválido');
      
      expect(error.message).toBe('Token inválido');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('deve criar AuthorizationError corretamente', () => {
      const error = new AuthorizationError('Acesso negado');
      
      expect(error.message).toBe('Acesso negado');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('deve criar NotFoundError corretamente', () => {
      const error = new NotFoundError('Recurso não encontrado');
      
      expect(error.message).toBe('Recurso não encontrado');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('deve criar RateLimitError corretamente', () => {
      const error = new RateLimitError('Limite excedido');
      
      expect(error.message).toBe('Limite excedido');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.isOperational).toBe(true);
    });

    it('deve criar ExternalAPIError corretamente', () => {
      const error = new ExternalAPIError('Erro da API externa', 'EXT_001');
      
      expect(error.message).toBe('Erro da API externa');
      expect(error.code).toBe('EXTERNAL_API_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.externalCode).toBe('EXT_001');
      expect(error.isOperational).toBe(true);
    });

    it('deve criar DatabaseError corretamente', () => {
      const error = new DatabaseError('Erro de conexão');
      
      expect(error.message).toBe('Erro de conexão');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('createError', () => {
    it('deve criar erro de validação', () => {
      const error = createError('validation', 'Dados inválidos');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Dados inválidos');
    });

    it('deve criar erro de autenticação', () => {
      const error = createError('auth', 'Token inválido');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Token inválido');
    });

    it('deve criar erro de não encontrado', () => {
      const error = createError('notFound', 'Recurso não encontrado');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Recurso não encontrado');
    });

    it('deve criar erro de rate limit', () => {
      const error = createError('rateLimit', 'Limite excedido');
      
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Limite excedido');
    });

    it('deve criar erro de API externa', () => {
      const error = createError('external', 'Erro da API');
      
      expect(error).toBeInstanceOf(ExternalAPIError);
      expect(error.message).toBe('Erro da API');
    });

    it('deve criar erro de banco de dados', () => {
      const error = createError('database', 'Erro de conexão');
      
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Erro de conexão');
    });

    it('deve criar erro interno por padrão', () => {
      const error = createError('internal', 'Erro interno');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Erro interno');
    });
  });

  describe('handleError', () => {
    it('deve retornar AppError se já for um AppError', () => {
      const originalError = new ValidationError('Dados inválidos');
      const handledError = handleError(originalError);
      
      expect(handledError).toBe(originalError);
      expect(handledError).toBeInstanceOf(ValidationError);
    });

    it('deve converter Error padrão para AppError', () => {
      const originalError = new Error('Erro padrão');
      const handledError = handleError(originalError);
      
      expect(handledError).toBeInstanceOf(AppError);
      expect(handledError.message).toBe('Erro padrão');
      expect(handledError.isOperational).toBe(false);
    });

    it('deve converter erro desconhecido para AppError', () => {
      const originalError = 'Erro de string';
      const handledError = handleError(originalError);
      
      expect(handledError).toBeInstanceOf(AppError);
      expect(handledError.message).toBe('Erro desconhecido');
      expect(handledError.isOperational).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('deve executar função com sucesso na primeira tentativa', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve tentar novamente em caso de falha', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Falha temporária'))
        .mockResolvedValue('success');
      
      const result = await withRetry(fn, 2);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('deve falhar após todas as tentativas', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Falha persistente'));
      
      await expect(withRetry(fn, 2)).rejects.toThrow('Falha persistente');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isRecoverableError', () => {
    it('deve retornar true para AppError operacional', () => {
      const error = new ValidationError('Dados inválidos');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar false para AppError não operacional', () => {
      const error = new AppError('Erro interno', 'INTERNAL_ERROR', 500, false);
      expect(isRecoverableError(error)).toBe(false);
    });

    it('deve retornar true para erros de rede', () => {
      const error = new Error('Network error');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar true para timeouts', () => {
      const error = new Error('Request timeout');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar true para rate limits', () => {
      const error = new Error('Rate limit exceeded');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar false para outros erros', () => {
      const error = new Error('Erro genérico');
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('formatErrorForResponse', () => {
    it('deve formatar erro para resposta HTTP', () => {
      const error = new ValidationError('Dados inválidos');
      const formatted = formatErrorForResponse(error);
      
      expect(formatted).toEqual({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: expect.any(String)
      });
    });

    it('deve incluir stack trace em desenvolvimento', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true
      });
      
      const error = new AppError('Erro de teste');
      const formatted = formatErrorForResponse(error);
      
      expect(formatted.details).toBe(error.stack);
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true
      });
    });

    it('deve omitir stack trace em produção', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true
      });
      
      const error = new AppError('Erro de teste');
      const formatted = formatErrorForResponse(error);
      
      expect(formatted.details).toBeUndefined();
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true
      });
    });
  });
}); 