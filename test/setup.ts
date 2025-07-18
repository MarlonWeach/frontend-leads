// @ts-nocheck
export {};
import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env.local
dotenv.config({ path: '.env.local' });

// Mock do logger
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock do módulo logger
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: mockLogger,
  logger: mockLogger,
}));

// Configuração global do Jest
beforeEach(() => {
  jest.clearAllMocks();
});

// Exportar mocks para uso em outros arquivos
export { jest }; 