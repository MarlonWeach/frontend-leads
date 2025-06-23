'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../src/components/MainLayout';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para o dashboard após um breve delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <MainLayout title="Carregando...">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sublabel-refined text-white/70">Carregando dashboard...</p>
        </div>
      </div>
    </MainLayout>
  );
}