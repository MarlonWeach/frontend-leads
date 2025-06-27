'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, TrendingUp, Target, Layers, Settings, Menu, X,
  Home, Users, Building2, FileText, Download, User, LogOut, HelpCircle, Image
} from 'lucide-react';
import SyncStatus from './SyncStatus';

interface Breadcrumb {
  name: string;
  href: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

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
    description: 'Métricas e gráficos'
  },
  {
    name: 'Campanhas',
    href: '/campaigns',
    icon: Target,
    description: 'Gerenciar campanhas'
  },
  {
    name: 'AdSets',
    href: '/adsets',
    icon: Layers,
    description: 'Conjuntos de anúncios'
  },
  {
    name: 'Ads',
    href: '/ads',
    icon: Image,
    description: 'Anúncios individuais'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
    description: 'Gestão de leads'
  }
];

const secondaryNavigation = [
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Configurações do sistema'
  }
];

export default function MainLayout({ children, title, breadcrumbs = [] }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
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

  const NavItem = ({ item, isSecondary = false }: { item: any; isSecondary?: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 glass-hover ${
          active
            ? 'glass-medium text-white shadow-primary-glow'
            : 'glass-light text-white/80 hover:text-white'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-white/60 font-normal">{item.description}</span>
        </div>
      </Link>
    );
  };

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex-1 h-full flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10 glass-medium">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 p-1 text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <Link href="/" className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-semibold text-white">Lead Ads</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium glass-light text-white/80 rounded-full">
            Platform
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 pb-4 pt-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-white/10">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Ferramentas
            </h3>
          </div>
          <div className="space-y-2">
            {secondaryNavigation.map((item) => (
              <NavItem key={item.name} item={item} isSecondary />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 glass-medium border-t border-white/10">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Usuário Admin
            </p>
            <p className="text-xs text-white/60 truncate">
              admin@leadads.com
            </p>
          </div>
          <button className="ml-2 p-1 rounded-full text-white/60 hover:text-white transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#0E1117]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 glass-strong border-r border-white/10">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full glass-strong">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 glass-medium border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-white/10 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-header text-white">{pageInfo.title}</h1>
              {breadcrumbs.length > 0 && (
                <nav className="ml-4 flex items-center space-x-2">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.href}>
                      {index > 0 && <span className="text-white/40">/</span>}
                      <Link
                        href={crumb.href}
                        className="text-sublabel-refined text-white/70 hover:text-white transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <SyncStatus />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}