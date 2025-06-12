const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Fornecer o caminho para o seu aplicativo Next.js
  dir: './',
});

// Configuração personalizada do Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@supabase|@supabase/.*|@supabase-js|@supabase-js/.*)/)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};

module.exports = createJestConfig(customJestConfig); 