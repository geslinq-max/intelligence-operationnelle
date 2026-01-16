'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, HelpCircle, Menu, X, BarChart3, CreditCard, Crown, Target, Briefcase, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useBranding, THEMES } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth, ROLE_CONFIG, type UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// 🔒 SÉCURITÉ HARD-CODED - EMAIL FONDATEUR UNIQUE
// ============================================================================
const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

/**
 * 🔒 Vérifie si l'email est celui du fondateur
 * SÉCURITÉ: Si FOUNDER_EMAIL est vide/undefined, PERSONNE n'est fondateur
 */
function isFounderEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  if (!FOUNDER_EMAIL || FOUNDER_EMAIL.trim() === '') return false; // 🔒 SÉCURITÉ CRITIQUE
  return email.toLowerCase().trim() === FOUNDER_EMAIL.toLowerCase().trim();
}

// Navigation de base (accessible à tous)
const baseNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    roles: ['artisan', 'partenaire', 'manager', 'fondateur'] as UserRole[],
  },
  {
    name: 'Vérificateur de Dossiers',
    href: '/verificateur',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    roles: ['artisan', 'partenaire', 'manager', 'fondateur'] as UserRole[],
  },
  {
    name: 'Artisans Partenaires',
    href: '/entreprises',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    roles: ['manager', 'fondateur'] as UserRole[],
  },
  {
    name: 'Prospection',
    href: '/prospection',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    roles: ['manager', 'fondateur'] as UserRole[],
  },
  {
    name: 'Forfaits & Tarifs',
    href: '/tarifs',
    icon: <CreditCard className="w-5 h-5" />,
    roles: ['artisan', 'partenaire', 'manager', 'fondateur'] as UserRole[],
  },
];

// Navigation RBAC (espaces par rôle)
const rbacNavigation = [
  {
    name: 'Le Cerveau',
    href: '/admin',
    icon: <Crown className="w-5 h-5" />,
    roles: ['fondateur'] as UserRole[],
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    name: 'Command Center',
    href: '/admin/pilotage',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['manager', 'fondateur'] as UserRole[],
    color: 'text-emerald-400',
    bgActive: 'bg-emerald-500/20 border-emerald-500/30',
  },
  {
    name: 'Espace Direction',
    href: '/direction',
    icon: <Target className="w-5 h-5" />,
    roles: ['manager', 'fondateur'] as UserRole[],
    color: 'text-violet-400',
    bgActive: 'bg-violet-500/20 border-violet-500/30',
  },
  {
    name: 'Cockpit Partenaire',
    href: '/partenaire',
    icon: <Briefcase className="w-5 h-5" />,
    roles: ['partenaire', 'manager', 'fondateur'] as UserRole[],
    color: 'text-cyan-400',
    bgActive: 'bg-cyan-500/20 border-cyan-500/30',
  },
];

// Configuration des icônes par rôle
const ROLE_ICONS = {
  fondateur: Crown,
  manager: Target,
  partenaire: Briefcase,
  artisan: Zap,
};

export default function Sidebar() {
  // 🔒 DÉSACTIVATION TOTALE TEMPORAIRE - TEST VERCEL
  // Si ce return null; n'a pas d'effet sur le site en ligne,
  // c'est que nous ne modifions pas le bon projet ou que Vercel ne se met pas à jour.
  return null;
  
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { theme, logoUrl, cabinetNom } = useBranding();
  const { config: subscriptionConfig } = useSubscription();
  const { user, isAuthenticated, isFounder: authIsFounder, logout } = useAuth();
  const themeConfig = THEMES[theme];

  // 🔒 Récupérer l'email réel de l'utilisateur Supabase
  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUserEmail(authUser?.email || null);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    fetchUserEmail();
  }, []);

  // 🔒 SÉCURITÉ HARD-CODED : Double vérification
  const isFounder = isFounderEmail(userEmail) && authIsFounder;
  
  // 🔒 MENU VIDE PAR DÉFAUT - Ajout conditionnel uniquement si authentifié
  const userRole = user?.role || 'artisan';
  
  // 🔒 Navigation de base : UNIQUEMENT si authentifié avec email validé
  const filteredBaseNav = (isAuthenticated && userEmail && !isLoadingAuth) ? baseNavigation.filter(item => {
    // Routes admin/manager = UNIQUEMENT fondateur
    if (item.roles.includes('fondateur') && !item.roles.includes('artisan')) {
      return isFounder;
    }
    // Artisan voit ses routes
    return item.roles.includes('artisan');
  }) : []; // 🔒 VIDE si pas authentifié
  
  // 🔒 Navigation RBAC : HARD-CODED sur l'email - UNIQUEMENT fondateur
  const filteredRbacNav = (isAuthenticated && userEmail && isFounder) ? rbacNavigation.filter(item => {
    // Toutes les routes RBAC = UNIQUEMENT FOUNDER_EMAIL vérifié
    return isFounder;
  }) : []; // 🔒 VIDE si pas fondateur
  
  const RoleIcon = ROLE_ICONS[userRole];

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
          <span className="text-white font-bold">{cabinetNom ? cabinetNom.substring(0, 15) : 'IO'}</span>
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
            <h1 className="text-white font-bold text-sm leading-tight">{cabinetNom || 'CAPITAL'}</h1>
            <p className={`text-${themeConfig.accent}-400 text-xs`}>{cabinetNom ? 'Cabinet Conseil' : 'ÉNERGIE'}</p>
          </div>
        </div>
      </div>

      {/* 🔒 Indicateur de rôle (LECTURE SEULE - Pas de switchRole) */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          {/* 🔒 Affichage selon authentification et rôle */}
          {!isAuthenticated || !userEmail ? (
            /* 🔒 Non authentifié : message d'avertissement */
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="flex-1 text-left">
                <p className="text-red-400 text-sm font-medium">Non connecté</p>
                <p className="text-slate-500 text-xs">Authentification requise</p>
              </div>
            </div>
          ) : isFounder ? (
            /* 🔒 Fondateur : affichage spécial (LECTURE SEULE) */
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-900/20 border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
              <div className="flex-1 text-left">
                <p className="text-amber-400 text-sm font-medium">Fondateur</p>
                <p className="text-slate-500 text-xs truncate">{userEmail}</p>
              </div>
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
          ) : (
            /* 🔒 Utilisateur standard : affichage statique */
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium">Espace Client</p>
                <p className="text-slate-500 text-xs truncate">{userEmail}</p>
              </div>
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation RBAC */}
      {filteredRbacNav.length > 0 && (
        <nav className="p-4 border-b border-slate-700">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Espace {ROLE_CONFIG[userRole].label}
          </p>
          <ul className="space-y-1">
            {filteredRbacNav.map((item) => {
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

      {/* Navigation de base */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Outils
        </p>
        <ul className="space-y-1">
          {filteredBaseNav.map((item) => {
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
            {subscriptionConfig.id !== 'prospect' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium group-hover:text-cyan-400 transition-colors">Mon profil</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subscriptionConfig.bgColor} ${subscriptionConfig.color} border ${subscriptionConfig.borderColor}`}>
                {subscriptionConfig.nom}
              </span>
            </div>
          </div>
        </Link>
        
        {/* Bouton Suivi & Commissions */}
        <Link
          href="/gestion"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            pathname === '/gestion'
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-violet-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Revenus &amp; Forfaits</span>
        </Link>

        {/* Bouton Assistance */}
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
          <span className="font-medium">Déconnexion</span>
        </button>
        
        {/* Liens légaux */}
        <div className="pt-2 border-t border-slate-800 flex justify-center gap-3 text-xs text-slate-500">
          <Link href="/cgv" className="hover:text-slate-400 transition-colors">
            CGV
          </Link>
          <span>•</span>
          <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">
            Mentions légales
          </Link>
          <span>•</span>
          <Link href="/confidentialite" className="hover:text-slate-400 transition-colors">
            Confidentialité
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}
