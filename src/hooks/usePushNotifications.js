export function usePushNotifications() {
  // Versão simplificada para evitar o loop
  return {
    isSupported: false,
    permission: 'default',
    subscription: null,
    requestPermission: async () => false,
    subscribe: async () => null,
    unsubscribe: async () => true,
    sendNotification: async () => false
  };
}