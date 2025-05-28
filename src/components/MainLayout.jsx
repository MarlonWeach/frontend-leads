'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationCenter from './NotificationCenter';
import Link from 'next/link';
import { 
  BarChart3, Users, Building2, TrendingUp, Settings, Menu, X, 
  Home, ChevronRight, Bell, Search, User, LogOut, HelpCircle,
  PieChart, Target, Mail, Calendar, FileText, Download
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Performance',
    href: '/performance', 
    icon: TrendingUp,
    description: 'Métricas e gráficos de performance'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
    description: 'Gestão de leads e conversões'
  },
  {
    name: 'Anunciantes',
    href: '/advertisers',
    icon: Building2,
    description: 'Painel por cliente/empresa'
  },
  {
    name: 'Campanhas',
    href: '/campaigns',
    icon: Target,
    description: 'Gerenciar campanhas ativas'
  }
];

const secondaryNavigation = [
  {
    name: 'Relatórios',
    href: '/reports',
    icon: FileText,
    description: 'Relatórios e exportações'
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Configurações do sistema'
  }
];

export default function MainLayout({ children, title, breadcrumbs = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getPageInfo = () => {
    const currentNav = [...navigation, ...secondaryNavigation].find(nav => isActive(nav.href));
    return {
      title: title || currentNav?.name || 'Lead Ads Platform',
      description: currentNav?.description || 'Plataforma de gerenciamento de Lead Ads'
    };
  };

  const pageInfo = getPageInfo();

  const NavItem = ({ item, isSecondary = false }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          active
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col">
          <span>{item.name}</span>
          <span className="text-xs text-gray-500 font-normal">{item.description}</span>
        </div>
      </Link>
    );
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className="flex-1 h-full flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 p-1"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        )}
        <Link href="/" className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">Lead Ads</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            Platform
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pb-4 pt-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ferramentas
            </h3>
          </div>
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavItem key={item.name} item={item} isSecondary />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Usuário Admin
            </p>
            <p className="text-xs text-gray-500 truncate">
              admin@leadads.com
            </p>
          </div>
          <button className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-500">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {/* Breadcrumbs */}
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <button
                        onClick={() => router.push('/')}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                        {crumb.href ? (
                          <button
                            onClick={() => router.push(crumb.href)}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                          >
                            {crumb.name}
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {crumb.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
              <div className="mt-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {pageInfo.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {pageInfo.description}
                </p>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Notifications */}
              <NotificationCenter />

              {/* Quick Actions */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline">Exportar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}