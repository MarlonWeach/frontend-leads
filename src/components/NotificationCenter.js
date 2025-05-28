// src/components/NotificationCenter.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, X, Settings, Check, AlertCircle, Info, 
  CheckCircle, XCircle, Smartphone, Volume2, VolumeX 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef(null);
  
  const {
    permission,
    isSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush
  } = usePushNotifications();

  useEffect(() => {
    fetchAlerts();
    subscribeToAlerts();

    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar alertas do Supabase
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setAlerts(data || []);
      const unread = (data || []).filter(alert => !alert.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  // Inscrever para atualizações em tempo real
  const subscribeToAlerts = () => {
    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          handleNewAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Lidar com novo alerta
  const handleNewAlert = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
    
    // Tocar som se habilitado
    if (soundEnabled) {
      playNotificationSound(newAlert.type);
    }

    // Mostrar notificação toast
    showToastNotification(newAlert);
	// Enviar push notification para alertas críticos
if (newAlert.type === 'critical' && permission === 'granted') {
  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification(newAlert.title, {
      body: newAlert.message,
      icon: '/icon.svg',
      tag: `alert-${newAlert.id}`,
      requireInteraction: true,
      data: {
        url: `/alerts/${newAlert.id}`,
        id: newAlert.id
      }
    });
  });
}
  };

  // Tocar som de notificação
  const playNotificationSound = (type) => {
    const audio = new Audio(`/sounds/${type || 'default'}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Erro ao tocar som:', e));
  };

  // Mostrar notificação de teste
  const showTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Lead Ads Platform', {
        body: '🎉 Notificações ativadas com sucesso!',
        icon: '/icon.svg'
      });
    }
  };
  
  // Mostrar notificação toast
  const showToastNotification = (alert) => {
    // Implementar sistema de toast (pode usar uma biblioteca como react-toastify)
    console.log('Toast notification:', alert);
  };

  // Marcar alerta como lido
  const markAsRead = async (alertId) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  // Marcar todos como lidos
  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
    }
  };

  // Obter ícone e cor baseado no tipo
  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return { icon: XCircle, color: 'text-red-500' };
      case 'warning':
        return { icon: AlertCircle, color: 'text-yellow-500' };
      case 'success':
        return { icon: CheckCircle, color: 'text-green-500' };
      default:
        return { icon: Info, color: 'text-blue-500' };
    }
  };

  // Formatar tempo relativo
  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInMinutes = Math.floor((now - alertDate) / 60000);

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Configurações */}
          {showSettings && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Configurações</h4>
              
              {/* Push Notifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">Notificações Push</span>
                  </div>
                  {isSupported ? (
                    <button
                      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        isSubscribed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {isSubscribed ? 'Ativado' : 'Ativar'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">Não suportado</span>
                  )}
                </div>

                {/* Som */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-gray-400 mr-2" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Som de notificação</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      soundEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {soundEnabled ? 'Ativado' : 'Desativado'}
                  </button>
                </div>
              </div>

              {permission === 'denied' && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                  <p className="text-xs text-yellow-800">
                    As notificações foram bloqueadas. Verifique as configurações do navegador.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const { icon: Icon, color } = getAlertIcon(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                      !alert.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start">
                      <Icon className={`h-5 w-5 ${color} mt-0.5 mr-3`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(alert.created_at)}
                        </p>
                      </div>
                      {!alert.is_read && (
                        <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <a
                href="/alerts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas as notificações →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}