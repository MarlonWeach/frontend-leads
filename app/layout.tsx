import '../styles/globals.css'

export const metadata = {
  title: 'Dashboard Lead Ads',
  description: 'Plataforma de gerenciamento de campanhas Lead Ads',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">{children}
        {/* Registrar Service Worker */}
<script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
              console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(function(err) {
              console.log('ServiceWorker falhou ao registrar:', err);
            });
        });
      }
    `,
  }}
/>
      </body>
    </html>
  )
}