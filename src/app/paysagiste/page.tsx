import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Leaf, 
  FileCheck, 
  Clock, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  Truck,
  Smartphone,
  Zap
} from 'lucide-react';

// ============================================================================
// SEO METADATA - PAYSAGISTE
// ============================================================================

export const metadata: Metadata = {
  title: 'Logiciel Paysagiste BSD | Conformité Trackdéchets 2026 | CAPITAL ÉNERGIE',
  description: 'Simplifiez vos BSD et votre conformité Trackdéchets 2026. Générez vos bordereaux de suivi des déchets en 2 minutes avec signature tactile. Solution mobile pour paysagistes et entreprises de démolition.',
  keywords: [
    'logiciel paysagiste',
    'BSD paysagiste',
    'Trackdéchets',
    'bordereau suivi déchets',
    'conformité déchets verts',
    'logiciel paysagiste Romilly',
    'gestion déchets paysagiste',
    'ISDI',
    'déchets inertes',
  ],
  openGraph: {
    title: 'BSD Express pour Paysagistes | CAPITAL ÉNERGIE',
    description: 'Simplifiez vos BSD et votre conformité Trackdéchets 2026. Signature tactile, génération PDF instantanée.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'CAPITAL ÉNERGIE',
    images: [
      {
        url: '/og-paysagiste.png',
        width: 1200,
        height: 630,
        alt: 'CAPITAL ÉNERGIE - Solution BSD pour Paysagistes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BSD Express pour Paysagistes | CAPITAL ÉNERGIE',
    description: 'Simplifiez vos BSD et votre conformité Trackdéchets 2026.',
  },
  alternates: {
    canonical: 'https://capital-energie.fr/paysagiste',
  },
};

// ============================================================================
// DONNÉES
// ============================================================================

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Saisie Mobile',
    description: 'Créez vos BSD directement sur le chantier avec votre smartphone.',
  },
  {
    icon: FileCheck,
    title: 'Signature Tactile',
    description: 'Faites signer producteur et transporteur sur l\'écran tactile.',
  },
  {
    icon: Clock,
    title: '2 Minutes Chrono',
    description: 'Générez un bordereau conforme en moins de 2 minutes.',
  },
  {
    icon: Shield,
    title: 'Conformité 2026',
    description: 'Respectez la réglementation Trackdéchets sans effort.',
  },
];

const BENEFITS = [
  'Fini les bordereaux papier perdus',
  'PDF généré instantanément',
  'Archivage automatique sécurisé',
  'Numéro officiel Trackdéchets',
  'Historique consultable 24/7',
  'Export pour contrôles DREAL',
];

const WASTE_TYPES = [
  { name: 'Terres et cailloux', code: '17 05 04', color: 'bg-amber-500' },
  { name: 'Déchets verts', code: '20 02 01', color: 'bg-green-500' },
  { name: 'Gravats / Béton', code: '17 01 07', color: 'bg-slate-500' },
  { name: 'Déchets mélangés', code: '17 09 04', color: 'bg-purple-500' },
];

// ============================================================================
// COMPOSANT PAGE
// ============================================================================

export default function PaysagistePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <nav className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CAPITAL ÉNERGIE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-slate-300 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link 
              href="/inscription" 
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
            >
              Essai Gratuit
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              Solution Paysagistes & Démolition
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Vos BSD en <span className="text-amber-400">2 minutes</span>,
              <br />conformes Trackdéchets 2026
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Simplifiez vos bordereaux de suivi des déchets avec notre application mobile. 
              Signature tactile, génération PDF instantanée, conformité garantie.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Commencer Gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/paysagiste/bsd"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-600 hover:border-slate-500 text-white rounded-xl font-medium text-lg transition-colors"
              >
                Voir la Démo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Une solution complète pour gérer vos bordereaux de suivi des déchets sur le terrain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-amber-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types de déchets */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Tous vos types de déchets gérés
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Notre système reconnaît automatiquement les codes déchets réglementaires 
                et pré-remplit vos bordereaux.
              </p>

              <div className="space-y-4">
                {WASTE_TYPES.map((type) => (
                  <div 
                    key={type.code}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                  >
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <div className="flex-1">
                      <p className="text-white font-medium">{type.name}</p>
                      <p className="text-slate-500 text-sm">Code: {type.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                Avantages clés
              </h3>
              <ul className="space-y-4">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-500/20 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Offre de lancement
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à simplifier vos BSD ?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Rejoignez les paysagistes qui gagnent du temps chaque jour.
            <br />Essai gratuit 14 jours, sans engagement.
          </p>

          <Link 
            href="/inscription"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Démarrer l'Essai Gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-amber-400" />
              <span className="text-white font-semibold">CAPITAL ÉNERGIE</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/cgv" className="hover:text-white transition-colors">
                CGV
              </Link>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 CAPITAL ÉNERGIE. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
