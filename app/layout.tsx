import React from 'react';
import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { QueryProvider } from '../src/providers/query-provider'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`bg-gray-50 ${inter.className}`}>
        <QueryProvider enableDevtools={process.env.NODE_ENV === 'development'}>
          {children}
        </QueryProvider>
        <SpeedInsights />
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