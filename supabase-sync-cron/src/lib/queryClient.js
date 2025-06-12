'use client';

import { QueryClient } from '@tanstack/react-query';

let queryClient;

export function getQueryClient() {
  if (!queryClient) {
    console.log('Criando nova instância do QueryClient');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutos
          refetchOnWindowFocus: false,
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
        }
      }
    });
  }
  return queryClient;
} 