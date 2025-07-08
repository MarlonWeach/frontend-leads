module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  plugins: [
    'react',
    'react-hooks'
  ],
  rules: {
    // Variáveis não utilizadas - mais flexível
    'no-unused-vars': 'off',
    
    // Dependências de hooks React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    
    // Geral - mais flexível
    'prefer-const': 'warn',
    'no-console': 'off', // Permitir console statements
    'no-debugger': 'error',
    
    // Desabilitar regras problemáticas
    'no-undef': 'off' // Jest globals
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true // Adicionar ambiente Jest
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}; 