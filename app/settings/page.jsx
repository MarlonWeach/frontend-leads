'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | success | error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected | error | checking

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    // Simulação de chamada de API
    setTimeout(() => {
      // Simule sucesso ou erro aleatório
      if (Math.random() > 0.2) {
        setSyncStatus('success');
        setLastSyncTime(new Date().toISOString());
      } else {
        setSyncStatus('error');
        setSyncError('Erro ao sincronizar anúncios');
      }
    }, 1200);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sincronização de Anúncios</h2>
        <div className="flex items-center space-x-2">
          <span data-testid="sync-status" className={`px-2 py-1 rounded text-sm ${
            syncStatus === 'syncing' ? 'bg-blue-100 text-blue-800' :
            syncStatus === 'success' ? 'bg-green-100 text-green-800' :
            syncStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {syncStatus === 'syncing' ? 'Sincronizando...' :
             syncStatus === 'success' ? 'Concluído' :
             syncStatus === 'error' ? 'Erro' :
             'Aguardando'}
          </span>
          <button
            data-testid="sync-button"
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              syncStatus === 'syncing'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Última sincronização:</span>
          <span data-testid="last-sync-time" className="font-medium">
            {lastSyncTime ? new Date(lastSyncTime).toLocaleString('pt-BR') : 'Nunca'}
          </span>
        </div>

        {syncError && (
          <div data-testid="sync-error" className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{syncError}</p>
                <button
                  data-testid="sync-retry-button"
                  onClick={handleSync}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Status da Conexão</h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'error' ? 'bg-red-400' :
              'bg-yellow-400'
            }`} />
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'error' ? 'Erro de conexão' :
               'Verificando...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 