'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchDashboardData(dateFrom, dateTo) {
  let url = '/api/dashboard/overview';
  const params = new URLSearchParams();

  if (dateFrom) {
    params.append('date_from', dateFrom);
  }
  if (dateTo) {
    params.append('date_to', dateTo);
  }

  if (params.toString()) {
    url = `${url}?${params.toString()}`;
  }

  console.log('Iniciando fetchDashboardData com URL:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Erro na resposta do dashboard:', error);
    throw new Error(error.details || 'Erro ao buscar dados do dashboard');
  }

  const data = await response.json();
  console.log('Dados do dashboard recebidos:', data);
  return data;
}

export function useDashboardData(dateFrom, dateTo) {
  return useQuery({
    queryKey: ['dashboardData', dateFrom, dateTo],
    queryFn: () => fetchDashboardData(dateFrom, dateTo),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Erro no useDashboardData:', error);
    }
  });
} 