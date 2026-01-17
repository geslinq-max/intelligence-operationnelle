'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, HelpCircle, Menu, X, BarChart3, 
  Crown, Users, Settings, Scan, User, Shield
} from 'lucide-react';
import { useBranding, THEMES } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/lib/auth/role-config';
import { IndustrySwitcher } from '@/contexts/IndustryContext';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// NAVIGATION ADMIN - Tableau de Bord Fondateur (épuré)
// ============================================================================
const adminNavigation = [
  {
    name: 'Tableau de Bord',
    href: '/admin',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    name: 'Clients / Artisans',
    href: '/admin/clients',
    icon: <Users className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgActive: 'bg-emerald-500/20 border-emerald-500/30',
  },
  {
    name: 'Statistiques',
    href: '/admin/statistiques',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'text-cyan-400',
    bgActive: 'bg-cyan-500/20 border-cyan-500/30',
  },
  {
    name: 'Parametres',
    href: '/admin/parametres',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-slate-400',
    bgActive: 'bg-slate-500/20 border-slate-500/30',
  },
];

// ============================================================================
// NAVIGATION ARTISAN - Espace Client
// ============================================================================
const artisanNavigation = [
  {
    name: 'Mon Espace',
    href: '/dashboard',
    icon: <User className="w-5 h-5" />,
  },
  {
    name: 'Scanner Flash',
    href: '/verificateur',
    icon: <Scan className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, logoUrl, cabinetNom } = useBranding();
  const { isAuthenticated, logout } = useAuth();
  const themeConfig = THEMES[theme];

  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUserEmail(authUser?.email || null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserEmail();
  }, []);

  const isAdmin = isAdminEmail(userEmail);

  if (!isAuthenticated || isLoading || !userEmail) {
    return null;
  }

  const navigation = isAdmin ? adminNavigation : artisanNavigation;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${themeConfig.primary} rounded-lg flex items-center justify-center overflow-hidden`}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <span className="text-white font-bold">{cabinetNom || 'Capital Energie'}</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Design epure et aere */}
      <aside className={`
        fixed left-0 top-0 h-screen w-72 lg:w-64 bg-slate-900 border-r border-slate-700 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${themeConfig.primary} rounded-lg flex items-center justify-center overflow-hidden`}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{cabinetNom || 'CAPITAL ENERGIE'}</h1>
              <p className="text-emerald-400 text-xs font-medium">
                {isAdmin ? 'Administration' : 'Espace Client'}
              </p>
            </div>
          </div>
        </div>

        {/* Indicateur utilisateur */}
        <div className="p-4 border-b border-slate-700">
          <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
            isAdmin ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-slate-800/50'
          }`}>
            {isAdmin ? (
              <Crown className="w-5 h-5 text-amber-400" />
            ) : (
              <User className="w-5 h-5 text-emerald-400" />
            )}
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold ${isAdmin ? 'text-amber-400' : 'text-white'}`}>
                {isAdmin ? 'Administrateur' : 'Artisan'}
              </p>
              <p className="text-slate-500 text-xs truncate">{userEmail}</p>
            </div>
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-amber-500' : 'text-slate-600'}`} />
          </div>
        </div>

        {/* Sélecteur de Contexte Métier - DEBUG: bordure rouge + condition retirée */}
        <div className="px-4 py-3 border-b border-slate-700 border-2 border-red-500 relative z-50">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 px-1">Contexte Métier</p>
          <IndustrySwitcher variant="compact" />
        </div>

        {/* Navigation principale - Espacement aere */}
        <nav className="flex-1 p-5 overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const itemColor = 'color' in item ? item.color : 'text-slate-400';
              const itemBgActive = 'bgActive' in item ? item.bgActive : 'bg-emerald-500/20 border-emerald-500/30';
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-base ${
                      isActive
                        ? `${itemBgActive} ${itemColor} border font-semibold`
                        : `text-slate-400 hover:bg-slate-800 hover:text-white`
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer simplifie */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium group-hover:text-cyan-400 transition-colors">Mon profil</p>
            </div>
          </Link>

          <a
            href="mailto:support@capital-energie.fr?subject=Demande d'assistance"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 rounded-xl transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Assistance</span>
          </a>
          
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Deconnexion</span>
          </button>
          
          <div className="pt-3 border-t border-slate-800 flex justify-center gap-4 text-xs text-slate-500">
            <Link href="/cgv" className="hover:text-slate-400 transition-colors">CGV</Link>
            <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
