"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

export default function DashboardPageClient({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Passe searchParams e router para children via React.cloneElement se necessário
  return <Suspense fallback={<div>Carregando...</div>}>{children}</Suspense>;
} 