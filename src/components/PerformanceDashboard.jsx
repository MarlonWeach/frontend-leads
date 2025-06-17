'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PerformanceDashboard() {
  console.log('🚀 DASHBOARD CARREGADO - Versão URL');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleFilterClick = (preset) => {
    console.log('🎯 FILTRO CLICADO:', preset);
    const params = new URLSearchParams();
    params.set('period', preset);
    const newUrl = `?${params.toString()}`;
    console.log('📱 NOVA URL:', newUrl);
    router.push(newUrl);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Performance (Versão URL)</h1>
      
      <div className="mb-6 bg-blue-50 p-4 rounded">
        <p className="text-sm text-gray-600">Filtro atual: <strong>{searchParams.get('period') || 'nenhum'}</strong></p>
        <p className="text-sm text-gray-600">URL completa: <strong>{typeof window !== 'undefined' ? window.location.search : 'carregando...'}</strong></p>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => handleFilterClick('7d')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          7 dias
        </button>
        <button 
          onClick={() => handleFilterClick('30d')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          30 dias
        </button>
        <button 
          onClick={() => handleFilterClick('90d')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          90 dias
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Teste de Funcionalidade:</h3>
        <p className="mb-2">1. ✅ Se você vê este texto, o componente foi carregado</p>
        <p className="mb-2">2. 🔍 Clique nos botões e veja se aparecem logs no console (F12)</p>
        <p className="mb-2">3. 📱 Veja se a URL muda quando clica nos botões</p>
        <p className="mb-2">4. 🔄 Veja se o "Filtro atual" muda na caixa azul acima</p>
      </div>
    </div>
  );
}
