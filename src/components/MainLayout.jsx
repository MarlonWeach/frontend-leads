'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, Users, Building2, TrendingUp, Settings, Menu, X, 
  Home, ChevronRight, Search, User, LogOut, HelpCircle,
  PieChart, Target, Mail, Calendar, FileText, Download
} from 'lucide-react';
import { SectionTransition } from './ui/transitions';
import SyncStatus from './SyncStatus';

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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
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
    const isHovered = hoveredItem === item.name;

    return (
      <div className="relative group">
        <Link
          href={item.href}
          onMouseEnter={() => setHoveredItem(item.name)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-2xl transition-all duration-300 ease-out ${
            active
              ? 'bg-primary text-white shadow-primary-glow'
              : 'text-white/80 hover:glass-light hover:text-primary hover:shadow-soft'
          }`}
        >
          <Icon className="h-6 w-6" />
        </Link>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 z-50">
            <div className="glass-strong rounded-xl px-3 py-2 text-sm text-white whitespace-nowrap">
              {item.name}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 glass-strong border-l border-b border-glass-border rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className={`flex-1 h-full flex flex-col glass-medium glass-highlight rounded-2xl m-2 transition-all duration-500 ease-out ${
      sidebarExpanded ? 'w-64' : 'w-20'
    }`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/10">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 p-1 text-white/80 hover:text-primary transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <Link href="/" className="flex items-center w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-primary-glow">
            <BarChart3 className="h-6 w-6 text-background" />
          </div>
          {sidebarExpanded && (
            <div className="ml-3 flex-1">
              <span className="text-title font-bold text-white">Lead Ads</span>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                Platform
              </span>
            </div>
          )}
        </Link>
        
        {/* Botão de expansão/retração */}
        {!isMobile && (
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="absolute right-2 top-4 p-2 rounded-xl text-white/80 hover:text-primary hover:glass-light transition-all duration-300"
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${sidebarExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 pb-4 pt-6">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-glass-border">
          {sidebarExpanded && (
            <div className="px-2 mb-4">
              <h3 className="text-xs font-semibold text-sublabel text-white/60 uppercase tracking-wider">
                Ferramentas
              </h3>
            </div>
          )}
          <div className="space-y-2">
            {secondaryNavigation.map((item) => (
              <NavItem key={item.name} item={item} isSecondary />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 glass-light border-t border-glass-border rounded-b-2xl">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-primary-glow">
            <User className="h-5 w-5 text-background" />
          </div>
          {sidebarExpanded && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sublabel text-white font-medium truncate">
                Usuário Admin
              </p>
              <p className="text-xs text-white/70 truncate">
                admin@leadads.com
              </p>
            </div>
          )}
          {sidebarExpanded && (
            <button className="ml-2 p-2 rounded-xl text-white/80 hover:text-primary hover:glass-light transition-all duration-300">
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col transition-all duration-500 ease-out fixed left-0 top-0 h-screen z-30 bg-background ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 glass-light" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-col w-0 flex-1 min-h-0 ${sidebarExpanded ? 'pl-64' : 'pl-20'}`}>
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 glass-medium glass-highlight border-b border-glass-border rounded-2xl m-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-glass-border text-white/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden transition-colors"
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
                      <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
                        Dashboard
                      </Link>
                    </li>
                    {pathname !== '/dashboard' && (
                      <>
                        <ChevronRight className="h-4 w-4 text-white/40" />
                        <li>
                          <span className="text-white font-medium capitalize">
                            {pathname.split('/').pop()}
                          </span>
                        </li>
                      </>
                    )}
                  </ol>
                </nav>
              </div>
              
              {/* Title and description */}
              <div className="mt-1">
                <h1 className="text-xl font-semibold text-white">{pageInfo.title}</h1>
                {pageInfo.description && (
                  <p className="text-sm text-white/60">{pageInfo.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SyncStatus />
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 glass-light border border-glass-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Export button */}
              <button className="flex items-center space-x-2 px-4 py-2 bg-cta hover:bg-cta/80 text-white rounded-xl transition-colors shadow-cta-glow">
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo principal animado */}
        <SectionTransition direction="up" duration={600}>
          <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </SectionTransition>
      </div>
    </div>
  );
}