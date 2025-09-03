'use client';

import React from 'react';
import SupabaseConnectionTest from '../../src/components/SupabaseConnectionTest';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Diagnóstico de Configuração
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Esta página ajuda a diagnosticar problemas de configuração do projeto.
            </p>
          </div>
          
          <div className="p-6">
            <SupabaseConnectionTest />
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Instruções para Configuração
            </h2>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-700">1. Configurar Supabase</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Acesse <a href="https://supabase.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a> e crie um projeto</li>
                  <li>Vá em Settings → API</li>
                  <li>Copie a URL do projeto e a chave anônima</li>
                  <li>Cole no arquivo .env.local na raiz do projeto</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">2. Formato do arquivo .env.local</h3>
                <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">3. Após configurar</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Reinicie o servidor de desenvolvimento (npm run dev)</li>
                  <li>Teste a conexão usando o botão acima</li>
                  <li>Se ainda houver problemas, verifique o console do navegador</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}