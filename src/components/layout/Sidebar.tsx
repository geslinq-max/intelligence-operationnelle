'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, HelpCircle, Menu, X, BarChart3, CreditCard } from 'lucide-react';
import { useBranding, THEMES } from '@/contexts/ThemeContext';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase/client';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    name: 'Vérificateur de Dossiers',
    href: '/verificateur',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: 'Artisans Partenaires',
    href: '/entreprises',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
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
  },
  {
    name: 'Forfaits & Tarifs',
    href: '/tarifs',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, logoUrl, cabinetNom } = useBranding();
  const { config: subscriptionConfig } = useSubscription();
  const themeConfig = THEMES[theme];

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

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Navigation
        </p>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
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
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
        
        {/* Liens légaux */}
        <div className="pt-2 border-t border-slate-800 flex justify-center gap-3 text-xs text-slate-500">
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
