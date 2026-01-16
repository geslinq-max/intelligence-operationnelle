'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, HelpCircle, Menu, X, BarChart3, CreditCard, 
  Crown, Target, Briefcase, Zap, Shield, User, Scan, Settings
} from 'lucide-react';
import { useBranding, THEMES } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// SECURITE HARD-CODED - EMAIL FONDATEUR UNIQUE
// ============================================================================
const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

function isFounderEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  if (!FOUNDER_EMAIL || FOUNDER_EMAIL.trim() === '') return false;
  return email.toLowerCase().trim() === FOUNDER_EMAIL.toLowerCase().trim();
}

// ============================================================================
// NAVIGATION DE BASE - VISIBLE POUR TOUS LES UTILISATEURS CONNECTES
// ============================================================================
const baseNavigation = [
  {
    name: 'Espace Client',
    href: '/dashboard',
    icon: <User className="w-5 h-5" />,
  },
  {
    name: 'Scanner Flash',
    href: '/verificateur',
    icon: <Scan className="w-5 h-5" />,
  },
  {
    name: 'Forfaits & Tarifs',
    href: '/tarifs',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

// ============================================================================
// NAVIGATION RESTREINTE - UNIQUEMENT SI email === FOUNDER_EMAIL
// ============================================================================
const founderNavigation = [
  {
    name: 'Le Cerveau',
    href: '/admin',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    name: 'Command Center',
    href: '/admin/pilotage',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgActive: 'bg-emerald-500/20 border-emerald-500/30',
  },
  {
    name: 'Espace Direction',
    href: '/direction',
    icon: <Target className="w-5 h-5" />,
    color: 'text-violet-400',
    bgActive: 'bg-violet-500/20 border-violet-500/30',
  },
  {
    name: 'Cockpit Partenaire',
    href: '/partenaire',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-cyan-400',
    bgActive: 'bg-cyan-500/20 border-cyan-500/30',
  },
  {
    name: 'Artisans Partenaires',
    href: '/entreprises',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-orange-400',
    bgActive: 'bg-orange-500/20 border-orange-500/30',
  },
  {
    name: 'Prospection',
    href: '/prospection',
    icon: <Target className="w-5 h-5" />,
    color: 'text-pink-400',
    bgActive: 'bg-pink-500/20 border-pink-500/30',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, logoUrl, cabinetNom } = useBranding();
  const { config: subscriptionConfig } = useSubscription();
  const { isAuthenticated, logout } = useAuth();
  const themeConfig = THEMES[theme];

  // Recuperer l'email reel de l'utilisateur Supabase
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

  // SECURITE: Verification email fondateur
  const isFounder = isFounderEmail(userEmail);

  // Si pas connecte ou en chargement, ne rien afficher
  if (!isAuthenticated || isLoading || !userEmail) {
    return null;
  }

  // Navigation filtree selon le role
  const filteredFounderNav = isFounder ? founderNavigation : [];

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
          <span className="text-white font-bold">{cabinetNom ? cabinetNom.substring(0, 15) : 'Capital Energie'}</span>
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

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-72 lg:w-64 bg-slate-900 border-r border-slate-700 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo - TOUJOURS VISIBLE */}
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
              <h1 className="text-white font-bold text-sm leading-tight">{cabinetNom || 'CAPITAL'}</h1>
              <p className={`text-${themeConfig.accent}-400 text-xs`}>{cabinetNom ? 'Cabinet Conseil' : 'ENERGIE'}</p>
            </div>
          </div>
        </div>

        {/* Indicateur utilisateur */}
        <div className="p-4 border-b border-slate-700">
          <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
            isFounder ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-slate-800'
          }`}>
            {isFounder ? (
              <Crown className="w-5 h-5 text-amber-400" />
            ) : (
              <Zap className="w-5 h-5 text-emerald-400" />
            )}
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${isFounder ? 'text-amber-400' : 'text-white'}`}>
                {isFounder ? 'Fondateur' : 'Espace Client'}
              </p>
              <p className="text-slate-500 text-xs truncate">{userEmail}</p>
            </div>
            <Shield className={`w-4 h-4 ${isFounder ? 'text-amber-500' : 'text-slate-600'}`} />
          </div>
        </div>

        {/* Navigation Fondateur - UNIQUEMENT SI isFounder */}
        {isFounder && filteredFounderNav.length > 0 && (
          <nav className="p-4 border-b border-slate-700">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Administration
            </p>
            <ul className="space-y-1">
              {filteredFounderNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? `${item.bgActive} ${item.color} border`
                          : `text-slate-400 hover:bg-slate-800 ${item.color.replace('text-', 'hover:text-')}`
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Navigation de base - TOUJOURS VISIBLE POUR TOUS */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Outils
          </p>
          <ul className="space-y-1">
            {baseNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${subscriptionConfig.gradient} rounded-full flex items-center justify-center relative`}>
              <span className="text-white text-sm font-medium">{subscriptionConfig.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium group-hover:text-cyan-400 transition-colors">Mon profil</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subscriptionConfig.bgColor} ${subscriptionConfig.color} border ${subscriptionConfig.borderColor}`}>
                {subscriptionConfig.nom}
              </span>
            </div>
          </Link>

          <Link
            href="/gestion"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/gestion'
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-violet-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Revenus & Forfaits</span>
          </Link>

          <a
            href="mailto:support@capital-energie.fr?subject=Demande d'assistance"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Assistance</span>
          </a>
          
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Deconnexion</span>
          </button>
          
          <div className="pt-2 border-t border-slate-800 flex justify-center gap-3 text-xs text-slate-500">
            <Link href="/cgv" className="hover:text-slate-400 transition-colors">CGV</Link>
            <span>-</span>
            <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions</Link>
            <span>-</span>
            <Link href="/confidentialite" className="hover:text-slate-400 transition-colors">Confidentialite</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
