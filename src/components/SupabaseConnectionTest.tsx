'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState({
    url: '',
    hasAnonKey: false,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testando conexão com Supabase...');

      // Verificar configuração
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      setConfig({
        url,
        hasAnonKey: !!anonKey,
      });

      if (!url || !anonKey) {
        throw new Error('Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas');
      }

      // Testar conexão básica
      const { data, error } = await supabase
        .from('campaigns')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('Conexão com Supabase estabelecida com sucesso!');
    } catch (error: any) {
      setStatus('error');
      setMessage(`Erro: ${error.message || 'Erro desconhecido'}`);
      console.error('Erro de conexão Supabase:', error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Status da Conexão Supabase</h3>
      
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getStatusIcon()}</span>
          <span className="font-medium">{message}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Configuração:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>URL:</strong> {config.url || 'Não configurada'}
          </div>
          <div>
            <strong>Chave Anônima:</strong> {config.hasAnonKey ? 'Configurada' : 'Não configurada'}
          </div>
        </div>
      </div>

      <button
        onClick={checkConnection}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Testar Novamente
      </button>

      {status === 'error' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Possíveis Soluções:</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Verifique se o arquivo .env.local existe na raiz do projeto</li>
            <li>Confirme se NEXT_PUBLIC_SUPABASE_URL está correto</li>
            <li>Confirme se NEXT_PUBLIC_SUPABASE_ANON_KEY está correto</li>
            <li>Verifique se o projeto Supabase está ativo</li>
            <li>Reinicie o servidor de desenvolvimento após alterar as variáveis</li>
          </ul>
        </div>
      )}
    </div>
  );
}