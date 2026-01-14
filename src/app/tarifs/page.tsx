'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { useSubscription, type SubscriptionTier } from '@/contexts/SubscriptionContext';
import { 
  Check, 
  Shield, 
  Zap, 
  Crown,
  Clock,
  Users,
  FileCheck,
  Phone,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ForfaitNiveau = 'essentiel' | 'serenite' | 'expert';

interface Comparaison {
  label: string;
  avant: string;
  apres: string;
}

interface Forfait {
  id: ForfaitNiveau;
  nom: string;
  slogan: string;
  prix: number;
  periode: string;
  volume: string;
  comparaisons: Comparaison[];
  verdict: string;
  gainNet: string;
  icon: React.ReactNode;
  popular?: boolean;
  buttonColor: string;
  badgeColor: string;
  accentColor: string;
}

// ============================================================================
// DONNÉES DES FORFAITS - STRUCTURE AVANT/APRÈS
// ============================================================================

const forfaits: Forfait[] = [
  {
    id: 'essentiel',
    nom: 'Essentiel',
    slogan: 'Sécurisez vos premiers chantiers',
    prix: 149,
    periode: '/mois HT',
    volume: '3 dossiers/mois',
    comparaisons: [
      { label: 'Temps', avant: '4h30 de paperasse', apres: '30 secondes de Scan Flash' },
      { label: 'Coût', avant: '450 € d\'audits externes', apres: '149 € d\'abonnement' },
      { label: 'Sécurité', avant: 'Trésorerie à risque', apres: '100 000 € de primes protégés' },
    ],
    verdict: 'Rentabilisé dès le 1er dossier',
    gainNet: '+301 €/mois',
    icon: <Shield className="w-8 h-8" />,
    buttonColor: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accentColor: 'text-blue-400',
  },
  {
    id: 'serenite',
    nom: 'Sérénité',
    slogan: 'L\'audit prioritaire pour votre croissance',
    prix: 349,
    periode: '/mois HT',
    volume: '15 dossiers/mois',
    comparaisons: [
      { label: 'Temps', avant: '22h30 de paperasse', apres: '3 minutes de Scan Flash total' },
      { label: 'Coût', avant: '2 250 € de gestion classique', apres: '349 € d\'abonnement' },
      { label: 'Sécurité', avant: 'Trésorerie bloquée', apres: '500 000 € de primes protégés' },
    ],
    verdict: '3 jours de vie récupérés',
    gainNet: '+1 901 €/mois',
    icon: <Zap className="w-8 h-8" />,
    popular: true,
    buttonColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    accentColor: 'text-emerald-400',
  },
  {
    id: 'expert',
    nom: 'Expert',
    slogan: 'Puissance maximale pour ETI/PME',
    prix: 860,
    periode: '/mois HT',
    volume: 'Dossiers illimités',
    comparaisons: [
      { label: 'Service', avant: 'Gestion administrative interne', apres: 'Délégation totale au Fondateur' },
      { label: 'Temps', avant: 'Charge mentale constante', apres: 'Zéro effort (Délégation totale)' },
      { label: 'Coût', avant: 'Structure de gestion (4 500 €)', apres: '860 € d\'abonnement' },
    ],
    verdict: 'Croissance illimitée',
    gainNet: '+3 640 €/mois',
    icon: <Crown className="w-8 h-8" />,
    buttonColor: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    accentColor: 'text-violet-400',
  },
];

// ============================================================================
// COMPOSANT MODAL
// ============================================================================

// ============================================================================
// ANIMATION DE SUCCÈS PLEIN ÉCRAN
// ============================================================================

function SuccessAnimation({ 
  forfait,
  onComplete 
}: { 
  forfait: Forfait;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // Entrée
    const enterTimer = setTimeout(() => setStage('show'), 100);
    // Affichage pendant 3s puis sortie
    const showTimer = setTimeout(() => setStage('exit'), 3500);
    // Redirection après sortie
    const exitTimer = setTimeout(() => onComplete(), 4200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  const gradientClass = forfait.id === 'essentiel' 
    ? 'from-blue-600 to-cyan-600'
    : forfait.id === 'serenite'
    ? 'from-emerald-600 to-teal-600'
    : 'from-violet-600 to-purple-600';

  return (
    <div className={`
      fixed inset-0 z-[100] flex items-center justify-center
      bg-gradient-to-br ${gradientClass}
      transition-all duration-700
      ${stage === 'enter' ? 'opacity-0 scale-95' : ''}
      ${stage === 'show' ? 'opacity-100 scale-100' : ''}
      ${stage === 'exit' ? 'opacity-0 scale-105' : ''}
    `}>
      {/* Particules décoratives */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Contenu principal */}
      <div className={`
        text-center px-8 transition-all duration-500 delay-300
        ${stage === 'show' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        {/* Icône succès */}
        <div className="relative mb-8">
          <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Texte */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Bienvenue dans la Cellule d'Expertise
        </h1>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 rounded-full backdrop-blur-sm mb-6">
          {forfait.icon}
          <span className="text-2xl font-bold text-white">
            Forfait {forfait.nom} Activé
          </span>
        </div>
        <p className="text-white/80 text-lg max-w-md mx-auto mb-8">
          Votre accès a été configuré avec succès. Vous allez être redirigé vers votre tableau de bord.
        </p>

        {/* Indicateur de redirection */}
        <div className="flex items-center justify-center gap-2 text-white/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Redirection en cours...</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT MODAL DE CONFIRMATION
// ============================================================================

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  forfait,
  onConfirm
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  forfait: Forfait | null;
  onConfirm: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !forfait) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    // Simulation du paiement
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Préparation de votre accès sécurisé
              </h3>
              <p className="text-slate-400 mb-6">
                La Cellule d'Expertise configure votre environnement...
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Traitement en cours</span>
              </div>
            </>
          ) : (
            <>
              <div className={`w-16 h-16 ${forfait.badgeColor} rounded-full flex items-center justify-center mx-auto mb-6 border`}>
                {forfait.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Forfait {forfait.nom}
              </h3>
              <p className="text-3xl font-bold text-white mb-1">
                {forfait.prix} €<span className="text-lg text-slate-400">{forfait.periode}</span>
              </p>
              <p className="text-emerald-400 text-sm font-medium mb-2">
                ✓ Rentabilisé dès le 1er dossier certifié
              </p>
              <p className="text-slate-400 mb-6">
                {forfait.slogan}
              </p>
              
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 text-left">
                <p className="text-sm text-slate-300 mb-3">📁 {forfait.volume}</p>
                <ul className="space-y-2">
                  {forfait.comparaisons.map((comp, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-slate-500 line-through text-xs">{comp.avant}</span>
                      <span className={`block ${forfait.accentColor} font-semibold`}>→ {comp.apres}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4 text-center">
                <p className="text-emerald-400 font-bold">{forfait.gainNet}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-3 ${forfait.buttonColor} text-white rounded-xl font-medium transition-all shadow-lg`}
                >
                  Confirmer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT CARTE FORFAIT - STRUCTURE AVANT/APRÈS
// ============================================================================

function ForfaitCard({ 
  forfait, 
  onSelect 
}: { 
  forfait: Forfait; 
  onSelect: (forfait: Forfait) => void;
}) {
  return (
    <div className={`
      relative bg-slate-900/50 border rounded-2xl p-6 flex flex-col
      transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
      ${forfait.popular 
        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
        : 'border-slate-700 hover:border-slate-600'
      }
    `}>
      {/* Badge populaire */}
      {forfait.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full shadow-lg">
            RECOMMANDÉ
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 pt-2">
        <div className={`w-14 h-14 ${forfait.badgeColor} rounded-xl flex items-center justify-center mx-auto mb-3 border`}>
          {forfait.icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{forfait.nom}</h3>
        <p className="text-slate-400 text-sm">{forfait.slogan}</p>
      </div>

      {/* Prix & Volume */}
      <div className="text-center mb-4">
        <p className="text-4xl font-bold text-white">
          {forfait.prix} €
          <span className="text-lg text-slate-400 font-normal">{forfait.periode}</span>
        </p>
        <p className={`${forfait.accentColor} text-sm font-semibold mt-2`}>
          📁 {forfait.volume}
        </p>
      </div>

      {/* Comparaisons AVANT/APRÈS */}
      <div className="space-y-3 flex-1 mb-4">
        {forfait.comparaisons.map((comp, index) => (
          <div key={index} className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-500 text-xs font-semibold uppercase mb-2">{comp.label}</p>
            <div className="space-y-1">
              <p className="text-slate-500 text-sm line-through">
                ❌ {comp.avant}
              </p>
              <p className={`${forfait.accentColor} text-sm font-bold`}>
                ✓ {comp.apres}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Verdict & Gain */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 text-center">
        <p className="text-emerald-400 text-sm font-medium mb-1">
          🎯 {forfait.verdict}
        </p>
        <p className="text-emerald-400 text-2xl font-bold">
          {forfait.gainNet}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(forfait)}
        className={`
          w-full py-4 rounded-xl font-semibold text-white
          transition-all duration-300 shadow-lg
          ${forfait.buttonColor}
        `}
      >
        Sélectionner ce Forfait
      </button>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function TarifsPage() {
  const router = useRouter();
  const { setTier, tier: currentTier } = useSubscription();
  const [selectedForfait, setSelectedForfait] = useState<Forfait | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activatedForfait, setActivatedForfait] = useState<Forfait | null>(null);

  const handleSelectForfait = (forfait: Forfait) => {
    setSelectedForfait(forfait);
    setIsModalOpen(true);
  };

  const handleConfirmSubscription = () => {
    if (!selectedForfait) return;
    
    // Fermer le modal
    setIsModalOpen(false);
    
    // Mettre à jour le statut d'abonnement
    const tierMap: Record<ForfaitNiveau, SubscriptionTier> = {
      essentiel: 'essentiel',
      serenite: 'serenite',
      expert: 'expert',
    };
    setTier(tierMap[selectedForfait.id]);
    
    // Afficher l'animation de succès
    setActivatedForfait(selectedForfait);
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    // Rediriger vers le Dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8 lg:mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Offres Institutionnelles</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Choisissez votre Forfait
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Accédez au Système d'Audit et à la Cellule d'Expertise CAPITAL ÉNERGIE 
            pour sécuriser vos dossiers CEE et maximiser vos revenus.
          </p>
        </header>

        {/* Grille des forfaits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
          {forfaits.map((forfait) => (
            <ForfaitCard 
              key={forfait.id} 
              forfait={forfait} 
              onSelect={handleSelectForfait}
            />
          ))}
        </div>

        {/* Section avantages */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 lg:p-8">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Pourquoi choisir CAPITAL ÉNERGIE ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Conformité Garantie</h3>
                <p className="text-slate-400 text-sm">
                  Chaque dossier est validé par notre Cellule d'Expertise avant transmission.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Support Dédié</h3>
                <p className="text-slate-400 text-sm">
                  Une équipe d'experts disponible pour vous accompagner à chaque étape.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Réactivité</h3>
                <p className="text-slate-400 text-sm">
                  Traitement prioritaire et réponse rapide à toutes vos demandes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mention légale ROI */}
        <div className="max-w-4xl mx-auto mt-8">
          <p className="text-center text-xs text-slate-500 italic px-4">
            * Estimations basées sur un coût horaire de 45 € et 150 € de frais d'audit externe par dossier. 
            ROI dépendant de votre volume réel.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Forfaits & Abonnements</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        forfait={selectedForfait}
        onConfirm={handleConfirmSubscription}
      />

      {/* Animation de succès plein écran */}
      {showSuccess && activatedForfait && (
        <SuccessAnimation
          forfait={activatedForfait}
          onComplete={handleSuccessComplete}
        />
      )}
    </div>
  );
}
