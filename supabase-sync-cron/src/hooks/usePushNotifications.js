import { useState, useEffect, useRef } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    console.log('Verificando suporte a notificações...');
    if (initialized.current) {
      console.log('Já inicializado, retornando...');
      return;
    }
    initialized.current = true;

    const checkSupport = async () => {
      try {
        // Verificar se o navegador suporta notificações push
        const supported = 'serviceWorker' in navigator && 
                         'PushManager' in window && 
                         'Notification' in window;
        
        setIsSupported(supported);

        if (supported) {
          // Verificar permissão atual
          const currentPermission = await Notification.permission;
          setPermission(currentPermission);

          // Verificar inscrição existente
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          setSubscription(existingSubscription);
        }
      } catch (error) {
        console.error('Erro ao verificar suporte a notificações:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []); // Array de dependências vazio pois só queremos executar uma vez

  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      
      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return true;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      return false;
    }
  };

  const sendNotification = async (title, options = {}) => {
    if (!isSupported || permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon.svg',
        badge: '/badge.svg',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification
  };
}