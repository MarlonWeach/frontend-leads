// src/hooks/usePushNotifications.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Configuração do VAPID (você precisará gerar suas próprias chaves)
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'YOUR_PUBLIC_VAPID_KEY';

export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar suporte
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // Verificar se já está inscrito
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        setSubscription(subscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  // Solicitar permissão e inscrever
  const subscribeToPush = async () => {
    if (!isSupported) {
      console.warn('Push notifications não são suportadas neste navegador');
      return false;
    }

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        console.warn('Permissão para notificações negada');
        return false;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Inscrever para push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      setSubscription(subscription);
      setIsSubscribed(true);

      // Salvar no banco de dados
      await saveSubscription(subscription);

      // Mostrar notificação de teste
      showTestNotification();

      return true;
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      return false;
    }
  };

  // Cancelar inscrição
  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription(subscription.endpoint);
        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
    }
  };

  // Salvar subscription no Supabase
  const saveSubscription = async (subscription) => {
    try {
      const { endpoint, keys } = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
    }
  };

  // Remover subscription do Supabase
  const removeSubscription = async (endpoint) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
    }
  };

  // Mostrar notificação de teste
  const showTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Lead Ads Platform', {
        body: '🎉 Notificações ativadas com sucesso!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      });
    }
  };

  // Converter VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return {
    permission,
    isSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    showTestNotification
  };
}