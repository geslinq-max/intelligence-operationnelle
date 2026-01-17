'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Leaf, 
  Grape, 
  Upload, 
  FileText, 
  Beaker,
  ChevronRight,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Sun
} from 'lucide-react';

type ClientIndustry = 'CEE' | 'PAYSAGISTE' | 'VITICULTEUR';

interface WelcomeBlockProps {
  clientNom: string;
  industry: ClientIndustry;
  hasData?: boolean;
}

// Configuration par métier
const INDUSTRY_CONFIG: Record<ClientIndustry, {
  greeting: string;
  icon: React.ReactNode;
  iconBg: string;
  primaryAction: {
    label: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
  };
  steps: Array<{
    title: string;
    description: string;
  }>;
  emptyState: {
    title: string;
    description: string;
    illustration: string;
  };
}> = {
  CEE: {
    greeting: "Prêt à sécuriser vos primes CEE aujourd'hui ?",
    icon: <Zap className="w-6 h-6" />,
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    primaryAction: {
      label: 'Scanner un nouveau dossier',
      href: '/verificateur',
      icon: <Upload className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-teal-600',
    },
    steps: [
      {
        title: 'Scannez votre devis',
        description: 'Déposez votre devis PDF pour une analyse instantanée',
      },
      {
        title: 'Vérification automatique',
        description: 'Notre solution détecte les erreurs et calcule votre prime',
      },
      {
        title: 'Dossier sécurisé',
        description: 'Recevez votre attestation conforme en quelques minutes',
      },
    ],
    emptyState: {
      title: 'Aucun dossier pour le moment',
      description: 'Scannez votre premier devis pour découvrir le montant de vos primes CEE',
      illustration: '📄',
    },
  },
  PAYSAGISTE: {
    greeting: 'Prêt à simplifier vos bordereaux de déchets aujourd\'hui ?',
    icon: <Leaf className="w-6 h-6" />,
    iconBg: 'bg-amber-500/20 text-amber-400',
    primaryAction: {
      label: 'Créer un BSD Express',
      href: '/paysagiste/bsd',
      icon: <FileText className="w-5 h-5" />,
      gradient: 'from-amber-500 to-orange-600',
    },
    steps: [
      {
        title: 'Renseignez le chantier',
        description: 'Indiquez l\'adresse et le type de déchets',
      },
      {
        title: 'Signez numériquement',
        description: 'Capturez les signatures sur place',
      },
      {
        title: 'Générez le BSD',
        description: 'Obtenez votre bordereau conforme Trackdéchets',
      },
    ],
    emptyState: {
      title: 'Aucun bordereau créé',
      description: 'Créez votre premier BSD en moins de 2 minutes depuis le terrain',
      illustration: '🚛',
    },
  },
  VITICULTEUR: {
    greeting: 'Prêt à mettre à jour votre registre phyto ?',
    icon: <Grape className="w-6 h-6" />,
    iconBg: 'bg-purple-500/20 text-purple-400',
    primaryAction: {
      label: 'Saisir un traitement Phyto',
      href: '/viticulture/registre-phyto',
      icon: <Beaker className="w-5 h-5" />,
      gradient: 'from-purple-500 to-violet-600',
    },
    steps: [
      {
        title: 'Saisissez le traitement',
        description: 'Parcelle, produit, dose et date d\'application',
      },
      {
        title: 'Calcul automatique du DAR',
        description: 'Le délai avant récolte est calculé instantanément',
      },
      {
        title: 'Exportez le registre',
        description: 'Téléchargez votre PDF conforme à la réglementation',
      },
    ],
    emptyState: {
      title: 'Registre vierge',
      description: 'Enregistrez votre première intervention phytosanitaire',
      illustration: '🍇',
    },
  },
};

// Fonction pour obtenir l'heure du jour
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function WelcomeBlock({ 
  clientNom, 
  industry, 
  hasData = false 
}: WelcomeBlockProps) {
  const [showGuide, setShowGuide] = useState(!hasData);
  const config = INDUSTRY_CONFIG[industry];
  const timeGreeting = getTimeOfDay();

  return (
    <div className="space-y-4">
      {/* Message de bienvenue */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700 rounded-2xl p-4 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Icône métier */}
          <div className={`p-3 rounded-xl ${config.iconBg} hidden sm:flex`}>
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Salutation personnalisée */}
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-400">{timeGreeting}, {clientNom}</span>
            </div>
            
            {/* Message dynamique selon le métier */}
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
              {config.greeting}
            </h2>

            {/* Bouton d'action principal */}
            <Link
              href={config.primaryAction.href}
              className={`inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${config.primaryAction.gradient} hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-lg`}
            >
              {config.primaryAction.icon}
              {config.primaryAction.label}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Badge "Nouveau" ou illustration */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="text-4xl">{config.emptyState.illustration}</div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
              <Sparkles className="w-3 h-3" />
              Simplifié
            </span>
          </div>
        </div>
      </div>

      {/* Guide de démarrage - 3 étapes */}
      {showGuide && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-sm">
                3
              </span>
              étapes pour commencer
            </h3>
            {hasData && (
              <button
                onClick={() => setShowGuide(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Masquer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {config.steps.map((step, index) => (
              <div 
                key={index}
                className="flex gap-3 p-3 bg-slate-800/50 rounded-xl"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA secondaire */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Besoin d'aide ? Suivez le guide pas à pas.
            </p>
            <Link
              href={config.primaryAction.href}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant État Vide réutilisable
interface EmptyStateProps {
  industry: ClientIndustry;
}

export function ClientEmptyState({ industry }: EmptyStateProps) {
  const config = INDUSTRY_CONFIG[industry];

  return (
    <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-2xl p-8 text-center">
      {/* Illustration */}
      <div className="text-6xl mb-4">{config.emptyState.illustration}</div>
      
      {/* Message */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {config.emptyState.title}
      </h3>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
        {config.emptyState.description}
      </p>
      
      {/* CTA */}
      <Link
        href={config.primaryAction.href}
        className={`inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${config.primaryAction.gradient} hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl transition-all`}
      >
        {config.primaryAction.icon}
        {config.primaryAction.label}
      </Link>

      {/* Bénéfice */}
      <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        Gratuit • Sans engagement • Résultat immédiat
      </p>
    </div>
  );
}
