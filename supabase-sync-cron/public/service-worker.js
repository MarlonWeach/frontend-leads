// service-worker.js
self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  
  // Tentar parsear os dados de diferentes formas
  try {
    if (event.data) {
      // Primeiro tenta como JSON
      try {
        data = event.data.json();
      } catch (e) {
        // Se falhar, tenta como texto
        const text = event.data.text();
        data = {
          title: 'Lead Ads Platform',
          message: text,
          type: 'info'
        };
      }
    }
  } catch (error) {
    console.error('Erro ao processar dados do push:', error);
    data = {
      title: 'Lead Ads Platform',
      message: 'Nova notificação',
      type: 'info'
    };
  }

  const title = data.title || 'Lead Ads Platform';
  const options = {
    body: data.message || 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'lead-ads-notification',
    requireInteraction: data.priority === 'critical',
    data: {
      url: data.url || '/',
      id: data.id
    }
  };

  // Adicionar vibração para mobile em alertas críticos
  if (data.priority === 'critical' && 'vibrate' in navigator) {
    options.vibrate = [200, 100, 200];
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';

  // Abrir ou focar na janela
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Se já tem uma aba aberta, foca nela
        for (let client of clientList) {
          if (client.url.includes('localhost:3000') || client.url.includes('seu-dominio.com')) {
            client.focus();
            return client.navigate(url);
          }
        }
        // Se não, abre uma nova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Evento de instalação
self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Evento de ativação
self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado');
  event.waitUntil(clients.claim());
});