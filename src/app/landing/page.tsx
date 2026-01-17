'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Leaf,
  Grape,
  Shield, 
  Server, 
  Lock,
  ArrowRight,
  CheckCircle,
  Clock,
  Timer,
  ChevronRight,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setIsLoading(false);
  };

  // Blocs de valeur par métier
  const valueBlocks = [
    {
      id: 'cee',
      title: 'Artisan CEE',
      icon: Zap,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500',
      textColor: 'text-emerald-400',
      tagline: 'Sécurisez vos primes et vos dossiers en 30 secondes.',
      benefits: [
        'Vérification instantanée des devis',
        'Calcul automatique des primes CEE',
        'Dossiers conformes sans erreur',
      ],
      cta: 'Essayer gratuitement',
    },
    {
      id: 'paysagiste',
      title: 'Paysagiste',
      icon: Leaf,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      hoverBorder: 'hover:border-amber-500',
      textColor: 'text-amber-400',
      tagline: 'Simplifiez vos BSD et votre conformité Trackdéchets.',
      benefits: [
        'BSD Express en 2 minutes',
        'Signature numérique sur terrain',
        'Préparation Trackdéchets 2026',
      ],
      cta: 'Essayer gratuitement',
    },
    {
      id: 'viticulteur',
      title: 'Viticulteur',
      icon: Grape,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-500',
      textColor: 'text-purple-400',
      tagline: 'Automatisez votre registre phyto et vos alertes DAR.',
      benefits: [
        'Registre phytosanitaire conforme',
        'Alertes DAR automatiques',
        'Export PDF réglementaire',
      ],
      cta: 'Essayer gratuitement',
    },
  ];

  // Preuves sociales
  const socialProof = [
    { value: '6h', label: 'économisées par semaine en moyenne', icon: Clock },
    { value: '89%', label: 'de tâches automatisées', icon: TrendingUp },
    { value: '100%', label: 'conforme réglementation 2026', icon: Shield },
  ];

  const testimonials = [
    {
      quote: "Je gagne au moins 5 heures par semaine sur mes dossiers CEE. C'est impressionnant.",
      author: 'Marc D.',
      role: 'Artisan plombier-chauffagiste',
      rating: 5,
    },
    {
      quote: "Finis les BSD papier ! Je fais tout depuis mon téléphone sur le chantier.",
      author: 'Sophie L.',
      role: 'Gérante entreprise paysage',
      rating: 5,
    },
    {
      quote: "Les alertes DAR m'ont évité plusieurs erreurs de récolte. Indispensable.",
      author: 'Jean-Pierre M.',
      role: 'Viticulteur en Bourgogne',
      rating: 5,
    },
  ];

  const securityFeatures = [
    { icon: Lock, label: 'Données cryptées' },
    { icon: Shield, label: 'Conforme RGPD' },
    { icon: Server, label: 'Hébergé en France' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CE</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">CAPITAL ÉNERGIE</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/login"
              className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Commencer</span>
              <span className="sm:hidden">Essai</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge conformité */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6 sm:mb-8">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Solution 100% conforme 2026</span>
          </div>

          {/* Accroche principale */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
            Gagnez{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              6h par semaine
            </span>
            {' '}sur votre administratif métier
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
            Automatisez vos tâches réglementaires et concentrez-vous sur votre cœur de métier.
          </p>

          {/* CTA Principal */}
          <Link
            href="/inscription"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            Commencer mon essai gratuit
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>

          <p className="text-slate-500 text-sm mt-4">
            Sans engagement • Configuration en 2 minutes
          </p>
        </div>
      </section>

      {/* Sélecteur de Valeur - 3 Blocs Métiers */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Une solution adaptée à votre métier
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Choisissez votre secteur d'activité et découvrez comment nous simplifions votre quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {valueBlocks.map((block) => (
              <Link
                key={block.id}
                href="/inscription"
                className={`${block.bgColor} border-2 ${block.borderColor} ${block.hoverBorder} rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group cursor-pointer`}
                onMouseEnter={() => setHoveredCard(block.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Icône */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${block.color} rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <block.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                
                {/* Titre */}
                <h3 className={`text-xl sm:text-2xl font-bold ${block.textColor} mb-3`}>
                  {block.title}
                </h3>
                
                {/* Tagline */}
                <p className="text-white font-medium text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed">
                  {block.tagline}
                </p>
                
                {/* Bénéfices */}
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {block.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm sm:text-base">
                      <CheckCircle className={`w-5 h-5 ${block.textColor} flex-shrink-0 mt-0.5`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <div className={`flex items-center justify-center gap-2 py-3 sm:py-4 bg-white/5 group-hover:bg-white/10 rounded-xl ${block.textColor} font-semibold transition-colors`}>
                  <span>{block.cta}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Preuves Sociales - Stats */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pourquoi nous choisir ?
            </h2>
            <p className="text-slate-400">
              Les résultats constatés par nos utilisateurs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {socialProof.map((stat, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center"
              >
                <stat.icon className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-4xl sm:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-slate-400 text-sm sm:text-base">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Témoignages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-slate-800/30 border border-slate-700 rounded-2xl p-5 sm:p-6"
              >
                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                {/* Citation */}
                <p className="text-slate-300 text-sm sm:text-base mb-4 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                
                {/* Auteur */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.author}</p>
                    <p className="text-slate-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-16">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <span className="text-white font-medium text-sm sm:text-base">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Inscription en 2 minutes</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à simplifier votre quotidien ?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
            Rejoignez les professionnels qui ont choisi d'automatiser leur administratif métier.
          </p>
          
          <Link
            href="/inscription"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 sm:px-12 py-5 sm:py-6 rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            Commencer mon essai gratuit
            <ArrowRight className="w-6 h-6" />
          </Link>
          
          <p className="text-slate-500 text-sm mt-4">
            Gratuit • Sans carte bancaire • Annulation à tout moment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <span className="text-slate-400 text-sm">
              © 2026 Capital Énergie
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link href="/mentions-legales" className="text-slate-500 hover:text-slate-300 transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-slate-500 hover:text-slate-300 transition-colors">
              Confidentialité
            </Link>
            <Link href="/cgv" className="text-slate-500 hover:text-slate-300 transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
