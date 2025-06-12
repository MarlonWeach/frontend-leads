// Configurações globais para os testes
import '@testing-library/jest-dom';

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