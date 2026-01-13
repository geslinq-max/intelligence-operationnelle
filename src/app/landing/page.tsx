'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Search, 
  Building2, 
  FileCheck, 
  Shield, 
  Server, 
  Lock,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Euro
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setIsLoading(false);
  };

  const expertiseCells = [
    {
      name: 'Cellule Scout',
      icon: Search,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      description: 'Analyse vos factures et données énergétiques pour détecter les anomalies et gisements d\'économies.',
      features: ['Détection d\'anomalies', 'Analyse de factures', 'Benchmarking sectoriel'],
    },
    {
      name: 'Cellule Architect',
      icon: Building2,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      textColor: 'text-violet-400',
      description: 'Génère des plans d\'optimisation sur-mesure avec ROI calculé et étapes de mise en œuvre.',
      features: ['Plans d\'action', 'Calcul ROI', 'Priorisation projets'],
    },
    {
      name: 'Cellule Compliance',
      icon: FileCheck,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      description: 'Identifie les subventions et aides d\'État auxquelles vous êtes éligible pour financer vos projets.',
      features: ['CEE & Ma Prime Rénov\'', 'Aides régionales', 'Dossiers pré-remplis'],
    },
  ];

  const securityFeatures = [
    { icon: Lock, label: 'Données cryptées AES-256' },
    { icon: Shield, label: 'Conforme RGPD' },
    { icon: Server, label: 'Hébergement France / UE' },
  ];

  const stats = [
    { value: '47 500 €', label: 'Économies moyennes identifiées', icon: Euro },
    { value: '< 18 mois', label: 'Retour sur investissement', icon: TrendingUp },
    { value: '100%', label: 'Taux de satisfaction', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CAPITAL ÉNERGIE</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/mentions-legales"
              className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block"
            >
              Mentions légales
            </Link>
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              {isLoading ? 'Chargement...' : isLoggedIn ? 'Mon espace' : 'Accéder à mon espace'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            <span className="text-cyan-400 text-sm font-medium">Plateforme IA pour PME industrielles</span>
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            CAPITAL ÉNERGIE : Activez vos subventions et boostez votre{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              rentabilité industrielle
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Identifiez vos gisements d&apos;économies d&apos;énergie et activez vos aides d&apos;État en 5 minutes.
            Nos Cellules d'Expertise IA analysent, optimisent et financent vos projets.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/confidentialite"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-700"
            >
              En savoir plus
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cellules d'Expertise Section */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              3 Cellules d'Expertise IA à votre service
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Une équipe d&apos;intelligences artificielles spécialisées qui travaillent ensemble pour maximiser votre rentabilité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {expertiseCells.map((cell, index) => (
              <div
                key={index}
                className={`${cell.bgColor} border ${cell.borderColor} rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${cell.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <cell.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className={`text-2xl font-bold ${cell.textColor} mb-3`}>
                  {cell.name}
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {cell.description}
                </p>
                
                <ul className="space-y-2">
                  {cell.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle className={`w-4 h-4 ${cell.textColor}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-slate-900 to-slate-800 border-y border-slate-700">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-white font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à optimiser votre performance industrielle ?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Rejoignez les PME qui utilisent l&apos;IA pour réduire leurs coûts et maximiser leurs aides.
          </p>
          <Link
            href={isLoggedIn ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-5 rounded-xl font-semibold text-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            Accéder à mon espace
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400 text-sm">
              © 2026 CAPITAL ÉNERGIE • Tous droits réservés
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/mentions-legales" className="text-slate-500 hover:text-slate-300 transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-slate-500 hover:text-slate-300 transition-colors">
              Confidentialité
            </Link>
            <a 
              href="mailto:contact@capital-energie.fr" 
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
