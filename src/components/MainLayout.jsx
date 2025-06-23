'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Target, Layers, Settings } from 'lucide-react';
import SyncStatus from './SyncStatus';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Performance', href: '/performance', icon: TrendingUp },
  { name: 'Campanhas', href: '/campaigns', icon: Target },
  { name: 'AdSets', href: '/adsets', icon: Layers },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-64 flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-xl font-bold">Lead Ads</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-700"
            >
              <item.icon className="h-6 w-6 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">AdSets</h1>
          <SyncStatus />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}