'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip } from './Tooltip';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SyncStatus() {
  const [isTriggering, setIsTriggering] = useState(false);
  
  const { data, error, mutate } = useSWR('/api/sync/status', fetcher, {
    refreshInterval: 5000, // a cada 5 segundos
  });

  const handleSync = async () => {
    setIsTriggering(true);
    try {
      await fetch('/api/sync/trigger', { method: 'POST' });
      // Otimisticamente, atualizamos o status para 'syncing'
      mutate({ ...data, status: 'syncing' }, false);
    } catch (err) {
      console.error('Erro ao disparar sincronização', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const isLoading = !data && !error;
  const isSyncing = data?.status === 'syncing' || isTriggering;

  let statusIcon = null;
  let statusText = 'Verificando status...';
  let tooltipText = 'Status da sincronização com a Meta API.';

  if (isLoading) {
    statusIcon = <RefreshCw className="h-4 w-4 animate-spin text-white/50" />;
  } else if (isSyncing) {
    statusIcon = <RefreshCw className="h-4 w-4 animate-spin text-accent" />;
    statusText = 'Sincronizando...';
    tooltipText = 'Os dados estão sendo atualizados em segundo plano.';
  } else if (data?.status === 'error') {
    statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
    statusText = `Erro na última sincronização`;
    tooltipText = data.error_message || 'Ocorreu um erro desconhecido.';
  } else if (data?.last_sync_end) {
    statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
    statusText = `Atualizado ${formatDistanceToNow(new Date(data.last_sync_end), {
      addSuffix: true,
      locale: ptBR,
    })}`;
    tooltipText = `Última sincronização completa em: ${new Date(data.last_sync_end).toLocaleString('pt-BR')}`;
  }

  return (
    <div className="flex items-center space-x-3">
      <Tooltip content={tooltipText}>
        <div className="flex items-center space-x-2 text-sublabel-refined text-white/80">
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </Tooltip>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="glass-light px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:glass-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
} 