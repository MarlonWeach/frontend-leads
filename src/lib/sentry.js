'use client';

import * as Sentry from '@sentry/nextjs';

// Configuração do Sentry
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

// Função para capturar erros
export function captureError(error, context = {}) {
  if (!SENTRY_DSN) {
    console.error('Erro capturado:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    // Adicionar contexto adicional
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Capturar o erro
    Sentry.captureException(error);
  });
}

// Função para capturar mensagens
export function captureMessage(message, level = 'info', context = {}) {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  Sentry.withScope((scope) => {
    // Adicionar contexto adicional
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Capturar a mensagem
    Sentry.captureMessage(message, level);
  });
}

// Função para iniciar uma transação
export function startTransaction(name, op = 'default') {
  if (!SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}

// Função para adicionar breadcrumb
export function addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`, { category, ...data });
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

// Função para definir usuário atual
export function setUser(user) {
  if (!SENTRY_DSN) return;

  Sentry.setUser(user);
}

// Função para limpar usuário
export function clearUser() {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
} 