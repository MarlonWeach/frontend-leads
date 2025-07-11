import { useQuery, UseQueryOptions, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

// Opções para o hook useQueryWithCache
export interface UseQueryWithCacheOptions<TData, TError> 
  extends Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> {
  // Tempo em milissegundos para considerar os dados como obsoletos
  staleTime?: number;
  // Tempo em milissegundos para manter os dados em cache
  cacheTime?: number;
  // Se deve refazer a consulta quando a janela é focada
  refetchOnWindowFocus?: boolean;
  // Se deve refazer a consulta quando a conexão é restabelecida
  refetchOnReconnect?: boolean;
  // Se deve mostrar um indicador de "última atualização"
  showLastUpdated?: boolean;
  // Callback chamado quando a query tem sucesso
  onSuccess?: (data: TData) => void;
}

// Hook personalizado para usar o React Query com cache
export function useQueryWithCache<TData, TError = Error>(
  queryKey: string | string[],
  queryFn: () => Promise<TData>,
  options: UseQueryWithCacheOptions<TData, TError> = {}
): UseQueryResult<TData, TError> & { lastUpdated: Date | null } {
  // Configurações padrão
  const defaultOptions: UseQueryWithCacheOptions<TData, TError> = {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    showLastUpdated: true
  };

  // Mesclar opções padrão com as fornecidas
  const mergedOptions = { ...defaultOptions, ...options };
  const { showLastUpdated, ...queryOptions } = mergedOptions;

  // Estado para armazenar a data da última atualização
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Obter o queryClient do contexto
  const queryClient = useQueryClient();

  // Usar o hook useQuery do React Query
  const queryResult = useQuery<TData, TError, TData>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        // Tentar buscar do cache do React Query
        const normalizedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
        const cache = queryClient.getQueryCache().find({ queryKey: normalizedKey });
        if (cache && cache.state.data !== undefined) {
          logger.info('Cache hit', { key: queryKey });
          return cache.state.data as TData;
        } else {
          logger.info('Cache miss', { key: queryKey });
        }
        const data = await queryFn();
        return data;
      } catch (error) {
        logger.error('Error fetching data', { key: queryKey, error });
        throw error;
      }
    },
    ...queryOptions
  });

  // Efeito para atualizar a data da última atualização quando os dados são carregados ou atualizados
  useEffect(() => {
    if (queryResult.isSuccess && showLastUpdated) {
      setLastUpdated(new Date());
      // Chamar o callback onSuccess fornecido, se existir
      if (options.onSuccess) {
        options.onSuccess(queryResult.data!);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryResult.data, queryResult.isSuccess, showLastUpdated]);

  // Retornar o resultado da consulta junto com a data da última atualização
  return {
    ...queryResult,
    lastUpdated
  };
}

// Hook para formatar a data da última atualização
export function useFormattedLastUpdated(lastUpdated: Date | null): string {
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setFormattedTime('');
      return;
    }

    // Função para formatar o tempo relativo
    const formatRelativeTime = (date: Date): string => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'agora mesmo';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
      }
    };

    // Formatar o tempo inicial
    setFormattedTime(formatRelativeTime(lastUpdated));

    // Atualizar o tempo formatado a cada minuto
    const intervalId = setInterval(() => {
      setFormattedTime(formatRelativeTime(lastUpdated));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  return formattedTime;
} 