// Configurações globais para os testes
import '@testing-library/jest-dom';

// Configurar variáveis de ambiente para testes
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-key';
process.env.SENTRY_DSN = 'https://test@sentry.io/test';

// Mock do OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Análise de teste gerada por mock'
              }
            }
          ]
        })
      }
    }
  }));
});

// Mock global do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ count: 0, error: null })),
          eq: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({ count: 0, error: null }))
          })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }))
}));

// Mock do fetch global
global.fetch = jest.fn();

// Mock do ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Polyfill para setImmediate (necessário para pino/logger em ambiente de teste)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (cb, ...args) => setTimeout(cb, 0, ...args);
}

// Mock do console.error para reduzir ruído nos testes
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
}; 