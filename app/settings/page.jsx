'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import MainLayout from '../../src/components/MainLayout';
import { Card } from '../../src/components/ui/card';

export default function SettingsPage() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | success | error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [connectionStatus, _setConnectionStatus] = useState('connected'); // connected | error | checking

  const breadcrumbs = [
    { name: 'Configurações', href: '/settings' }
  ];

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

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error" />;
      default:
        return <AlertCircle className="h-5 w-5 text-white/60" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Concluído';
      case 'error':
        return 'Erro';
      default:
        return 'Aguardando';
    }
  };

  const getStatusClass = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'glass-medium text-primary';
      case 'success':
        return 'glass-medium text-success';
      case 'error':
        return 'glass-medium text-error';
      default:
        return 'glass-light text-white/70';
    }
  };

  return (
    <MainLayout title="Configurações" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-header text-white mb-2">Sincronização de Anúncios</h2>
              <p className="text-sublabel-refined text-white/70">
                Gerencie a sincronização automática de dados da Meta API
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${getStatusClass()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              <button
                data-testid="sync-button"
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  syncStatus === 'syncing'
                    ? 'glass-light text-white/40 cursor-not-allowed'
                    : 'glass-medium text-white hover:glass-strong'
                }`}
              >
                {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Última sincronização:</span>
              <span data-testid="last-sync-time" className="font-medium text-white">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleString('pt-BR') : 'Nunca'}
              </span>
            </div>

            {syncError && (
              <div data-testid="sync-error" className="glass-medium border border-error/20 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-error" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-error">{syncError}</p>
                    <button
                      data-testid="sync-retry-button"
                      onClick={handleSync}
                      className="mt-2 text-sm font-medium text-error hover:text-error/80 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-3">Status da Conexão</h3>
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-success' :
                  connectionStatus === 'error' ? 'bg-error' :
                  'bg-warning'
                }`} />
                <span className="text-sm text-white/70">
                  {connectionStatus === 'connected' ? 'Conectado' :
                   connectionStatus === 'error' ? 'Erro de conexão' :
                   'Verificando...'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
} 