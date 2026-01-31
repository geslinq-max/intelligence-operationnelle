import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Grape, 
  FileCheck, 
  Clock, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Zap,
  Leaf,
  Calendar
} from 'lucide-react';

// ============================================================================
// SEO METADATA - VITICULTEUR
// ============================================================================

export const metadata: Metadata = {
  title: 'Registre Phytosanitaire Viticole | Conformité 2026 | CAPITAL ÉNERGIE',
  description: 'Registre phytosanitaire digital pour viticulteurs. Saisie mobile des traitements, alertes DAR automatiques, export PDF conforme. Simplifiez votre conformité réglementaire.',
  keywords: [
    'registre phytosanitaire',
    'viticulteur',
    'traitement phyto',
    'DAR délai avant récolte',
    'conformité phytosanitaire',
    'logiciel viticole',
    'gestion parcelles vigne',
    'registre traitements',
    'viticulture Champagne',
  ],
  openGraph: {
    title: 'Registre Phyto Express pour Viticulteurs | CAPITAL ÉNERGIE',
    description: 'Registre phytosanitaire digital. Saisie mobile, alertes DAR, export conforme.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'CAPITAL ÉNERGIE',
    images: [
      {
        url: '/og-viticulture.png',
        width: 1200,
        height: 630,
        alt: 'CAPITAL ÉNERGIE - Registre Phyto pour Viticulteurs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registre Phyto Express pour Viticulteurs | CAPITAL ÉNERGIE',
    description: 'Registre phytosanitaire digital. Saisie mobile, alertes DAR.',
  },
  alternates: {
    canonical: 'https://capital-energie.fr/viticulture',
  },
};

// ============================================================================
// DONNÉES
// ============================================================================

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Saisie au Vignoble',
    description: 'Enregistrez vos traitements directement depuis la parcelle.',
  },
  {
    icon: AlertTriangle,
    title: 'Alertes DAR',
    description: 'Notifications automatiques avant la date de récolte autorisée.',
  },
  {
    icon: FileCheck,
    title: 'Export Conforme',
    description: 'PDF réglementaire prêt pour les contrôles officiels.',
  },
  {
    icon: Shield,
    title: 'Traçabilité Totale',
    description: 'Historique complet de tous vos traitements par parcelle.',
  },
];

const BENEFITS = [
  'Fini les carnets papier',
  'Calcul automatique des DAR',
  'Base de produits homologués',
  'Alertes dépassement de dose',
  'Historique pluriannuel',
  'Export pour certification HVE',
];

const PRODUCT_TYPES = [
  { name: 'Fongicides', description: 'Mildiou, Oïdium, Botrytis', color: 'bg-cyan-500' },
  { name: 'Insecticides', description: 'Vers de grappe, Cicadelles', color: 'bg-red-500' },
  { name: 'Herbicides', description: 'Désherbage inter-rang', color: 'bg-amber-500' },
  { name: 'Acaricides', description: 'Acariens, Érinose', color: 'bg-purple-500' },
];

// ============================================================================
// COMPOSANT PAGE
// ============================================================================

export default function ViticulturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <nav className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Grape className="w-6 h-6 text-white" />
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
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
            >
              Essai Gratuit
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400 text-sm font-medium mb-6">
              <Grape className="w-4 h-4" />
              Solution Viticulteurs
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Votre registre phyto <span className="text-purple-400">digital</span>,
              <br />conforme et intelligent
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Enregistrez vos traitements en 30 secondes depuis le vignoble. 
              Alertes DAR automatiques, export PDF conforme pour les contrôles.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Commencer Gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/viticulture/registre-phyto"
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
              Un registre pensé pour le terrain
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Conçu avec des viticulteurs pour répondre aux exigences réglementaires sans perdre de temps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types de produits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Base de produits homologués
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Plus de 200 produits phytosanitaires référencés avec leurs DAR, 
                doses maximales et mentions de danger.
              </p>

              <div className="space-y-4">
                {PRODUCT_TYPES.map((type) => (
                  <div 
                    key={type.name}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                  >
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <div className="flex-1">
                      <p className="text-white font-medium">{type.name}</p>
                      <p className="text-slate-500 text-sm">{type.description}</p>
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
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Alerte DAR */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm font-medium mb-6">
                  <AlertTriangle className="w-4 h-4" />
                  Fonction Clé
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Alertes DAR Intelligentes
                </h2>
                <p className="text-slate-300 text-lg mb-6">
                  Ne ratez plus jamais un délai avant récolte. Notre système calcule 
                  automatiquement les dates et vous alerte quand la récolte approche.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-slate-300">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    Calcul automatique de la date de récolte autorisée
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Alerte 7 jours avant la fin du DAR
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <Shield className="w-5 h-5 text-amber-400" />
                    Conformité réglementaire garantie
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Alerte DAR</p>
                    <p className="text-slate-400 text-sm">Parcelle Les Coteaux</p>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm">
                    <strong>Attention :</strong> Le traitement au Folpel du 15/08 
                    autorise la récolte à partir du <strong>29/08</strong>.
                    <br />
                    <span className="text-amber-400">5 jours restants</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-500/20 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Offre de lancement
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à digitaliser votre registre ?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Rejoignez les viticulteurs qui simplifient leur conformité.
            <br />Essai gratuit 14 jours, sans engagement.
          </p>

          <Link 
            href="/inscription"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold text-lg transition-colors"
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
              <Grape className="w-6 h-6 text-purple-400" />
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
