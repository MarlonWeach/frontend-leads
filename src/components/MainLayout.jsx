'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, Users, Building2, TrendingUp, Settings, Menu, X, 
  Home, ChevronRight, Search, User, LogOut, HelpCircle,
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
              ? 'bg-electric text-background shadow-electric-glow'
              : 'text-white/80 hover:bg-glass hover:text-violet hover:shadow-glass-glow'
          } ${sidebarExpanded ? 'w-full justify-start px-3' : 'w-12 justify-center'}`}
        >
          <Icon className={`h-6 w-6 transition-all duration-300 ${sidebarExpanded ? 'mr-3' : ''}`} />
          {sidebarExpanded && (
            <span className="text-sublabel font-medium whitespace-nowrap">
              {item.name}
            </span>
          )}
        </Link>
        
        {/* Tooltip para sidebar colapsada */}
        {!sidebarExpanded && isHovered && (
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 z-50">
            <div className="bg-glass backdrop-blur-lg border border-violet/20 rounded-2xl px-4 py-2 shadow-glass-glow">
              <div className="text-sublabel font-medium text-white whitespace-nowrap">
                {item.name}
              </div>
              <div className="text-xs text-white/70 mt-1 max-w-48">
                {item.description}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Sidebar = ({ isMobile = false }) => (
    <div className={`flex-1 h-full flex flex-col bg-glass backdrop-blur-lg shadow-glass rounded-2xl m-2 transition-all duration-500 ease-out ${
      sidebarExpanded ? 'w-64' : 'w-20'
    }`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/10">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 p-1 text-white/80 hover:text-electric transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <Link href="/" className="flex items-center w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-electric shadow-electric-glow">
            <BarChart3 className="h-6 w-6 text-background" />
          </div>
          {sidebarExpanded && (
            <div className="ml-3 flex-1">
              <span className="text-title font-bold text-white">Lead Ads</span>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-violet/20 text-violet rounded-full">
                Platform
              </span>
            </div>
          )}
        </Link>
        
        {/* Botão de expansão/retração */}
        {!isMobile && (
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="absolute right-2 top-4 p-2 rounded-xl text-white/80 hover:text-electric hover:bg-glass/50 transition-all duration-300"
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

        <div className="pt-6 mt-6 border-t border-white/10">
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
      <div className="flex-shrink-0 p-4 bg-glass/80 border-t border-white/10 rounded-b-2xl">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-electric rounded-2xl flex items-center justify-center shadow-electric-glow">
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
            <button className="ml-2 p-2 rounded-xl text-white/80 hover:text-electric hover:bg-glass/50 transition-all duration-300">
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
        <div className="flex flex-col transition-all duration-500 ease-out">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-glass backdrop-blur-lg shadow-glass border-b border-white/10 rounded-2xl m-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-white/10 text-white/80 hover:text-electric focus:outline-none focus:ring-2 focus:ring-inset focus:ring-electric lg:hidden transition-colors"
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
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-white/40 mx-2" />
                        {crumb.href ? (
                          <button
                            onClick={() => router.push(crumb.href)}
                            className="text-sublabel font-medium text-white/70 hover:text-white transition-colors"
                          >
                            {crumb.name}
                          </button>
                        ) : (
                          <span className="text-sublabel font-medium text-white">
                            {crumb.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
              <div className="mt-1">
                <h1 className="text-header font-bold text-white">
                  {pageInfo.title}
                </h1>
                <p className="text-sublabel text-white/70">
                  {pageInfo.description}
                </p>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-white/50" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-2xl leading-5 bg-glass/50 backdrop-blur-lg placeholder-white/50 focus:outline-none focus:placeholder-white/30 focus:ring-2 focus:ring-electric focus:border-electric text-sublabel text-white"
                />
              </div>

              {/* Quick Actions */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sublabel font-medium text-white bg-glass/50 hover:bg-glass border border-white/20 hover:border-electric/30 focus:outline-none focus:ring-2 focus:ring-electric transition-all duration-300">
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