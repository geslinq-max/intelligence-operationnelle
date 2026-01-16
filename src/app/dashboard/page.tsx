'use client';

import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { 
  Zap, 
  Loader2, 
  FolderOpen, 
  Euro, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  ArrowRight,
  Activity,
  Shield,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscription, SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/contexts/SubscriptionContext';

// ============================================================================
// DONNÉES RÉELLES - ESPACE ARTISAN (POST-SANITIZATION)
// ============================================================================

import { DOSSIERS_SPECIMEN, ARTISAN_SPECIMEN, SCANNER_RESULTS_SPECIMEN, CELLULE_INTERVENTIONS_SPECIMEN } from '@/lib/data/specimen-data';

// Dossiers de l'Artisan Spécimen
const DOSSIERS_ARTISAN = DOSSIERS_SPECIMEN.map(d => ({
  id: d.id,
  client: d.client,
  type: d.type,
  statut: d.statut,
  montant: d.prime_cee,
  date: d.date_soumission,
}));

const STATUT_CONFIG = {
  valide: { label: 'Validé', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle2 },
  en_analyse: { label: 'En analyse', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Clock },
  en_attente: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertCircle },
  rejete: { label: 'Rejeté', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

// ============================================================================
// COMPOSANTS
// ============================================================================

// Quota de Liberté - Barre de progression des dossiers
function QuotaLiberte({ used, total, isUnlimited }: { used: number; total: number; isUnlimited: boolean }) {
  if (isUnlimited) {
    return (
      <div className="bg-slate-800/50 border border-violet-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-violet-400" />
            <span className="text-slate-300 text-sm">Dossiers analysés par le Scanner Flash</span>
          </div>
          <span className="text-violet-400 font-semibold text-sm">Usage Illimité</span>
        </div>
      </div>
    );
  }

  const percentage = Math.min((used / total) * 100, 100);
  const isAtLimit = used >= total;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isAtLimit ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-slate-300 text-sm">Dossiers analysés par le Scanner Flash</span>
        </div>
        <span className={`font-semibold text-sm ${isAtLimit ? 'text-amber-400' : 'text-emerald-400'}`}>
          {used} / {total}
        </span>
      </div>
      {/* Barre de progression fine - fond sombre, remplissage vert émeraude */}
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-amber-400 text-xs mt-2">
          Votre quota actuel de Scanner Flash est atteint
        </p>
      )}
    </div>
  );
}

// Drop Zone - Zone de Dépôt Premier Scan (Style Soft Contrast)
interface DropZoneProps {
  onFileSelect: () => void;
  isQuotaReached: boolean;
  nextTier: SubscriptionTier | null;
}

function DropZonePremierScan({ onFileSelect, isQuotaReached, nextTier }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isQuotaReached) {
      setIsDragOver(true);
    }
  }, [isQuotaReached]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isQuotaReached) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      router.push('/verificateur');
    }, 1500);
  }, [router, isQuotaReached]);

  const handleClick = () => {
    if (isQuotaReached) {
      // Rediriger vers tarifs avec upsell
      router.push(`/tarifs?upgrade=${nextTier || 'serenite'}`);
    } else {
      router.push('/verificateur');
    }
  };

  // Zone grisée si quota atteint
  if (isQuotaReached) {
    return (
      <div
        onClick={handleClick}
        className="relative cursor-pointer rounded-2xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 border-2 border-dashed border-slate-700 bg-slate-900/50"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">
            Quota Scanner Flash atteint
          </h3>
          <p className="text-slate-500 mb-6">
            Votre quota actuel de Scanner Flash est atteint
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all shadow-lg"
          >
            <Unlock className="w-5 h-5" />
            Débloquer plus de dossiers
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-2xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8
        border-2 border-dashed transition-all duration-300
        ${isDragOver 
          ? 'border-emerald-500 bg-emerald-500/10' 
          : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
        }
      `}
      style={{
        backgroundColor: isDragOver ? 'rgba(34, 197, 94, 0.1)' : undefined
      }}
    >
      <div className="text-center">
        {isAnalyzing ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Analyse Flash en cours...
            </h3>
            <p className="text-slate-400">
              Scanner Flash en action — Vérification de conformité
            </p>
          </>
        ) : (
          <>
            <div className={`
              w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors
              ${isDragOver ? 'bg-emerald-500/30' : 'bg-slate-700/50'}
            `}>
              <Upload className={`w-8 h-8 ${isDragOver ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Déposez votre dossier ici
            </h3>
            <p className="text-slate-400 mb-4">
              PDF, Photos, Scans — Analyse Flash en 30 secondes
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Scanner Flash prêt</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Compteur Impact Financier (Primes CEE Sécurisées)
function ImpactFinancierCard({ montant }: { montant: number }) {
  const [displayedMontant, setDisplayedMontant] = useState(0);

  useEffect(() => {
    // Animation fluide du compteur
    const duration = 1500;
    const steps = 60;
    const increment = montant / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= montant) {
        setDisplayedMontant(montant);
        clearInterval(timer);
      } else {
        setDisplayedMontant(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [montant]);

  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium">Primes CEE Sécurisées</p>
          <p className="text-2xl font-bold text-emerald-400">
            {displayedMontant.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>
    </div>
  );
}

// Checkpoints Visuels d'Audit (Résultats Scanner Flash)
function CheckpointsAudit() {
  const checkpoints = [
    { label: 'Validité RGE', statut: 'ok', detail: 'Certification vérifiée' },
    { label: 'Cohérence Date Signature', statut: 'ok', detail: 'Dates conformes' },
    { label: 'Adresse Chantier', statut: 'ok', detail: 'Géolocalisation validée' },
    { label: 'Montant Prime CEE', statut: 'ok', detail: 'Calcul vérifié' },
    { label: 'Documents Obligatoires', statut: 'ok', detail: 'Pièces présentes' },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Résultats Scanner Flash</h3>
          <p className="text-slate-400 text-sm">Vérification complète en 30 secondes</p>
        </div>
      </div>

      <div className="space-y-2">
        {checkpoints.map((cp, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{cp.label} : OK</p>
              <p className="text-slate-500 text-xs">{cp.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Barre de Santé du Système d'Audit
function SystemeAuditSante() {
  const santeGlobale = 94;
  const composants = [
    { nom: 'Extraction Devis', sante: 98, statut: 'optimal' },
    { nom: 'Validation CEE', sante: 95, statut: 'optimal' },
    { nom: 'Génération PDF', sante: 92, statut: 'optimal' },
    { nom: 'Envoi Notifications', sante: 89, statut: 'attention' },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Santé du Système d'Audit</h3>
            <p className="text-slate-400 text-sm">Tous les services opérationnels</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-emerald-400">{santeGlobale}%</p>
          <p className="text-slate-500 text-xs">Disponibilité</p>
        </div>
      </div>

      {/* Barre principale */}
      <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all"
          style={{ width: `${santeGlobale}%` }}
        />
      </div>

      {/* Composants individuels */}
      <div className="grid grid-cols-2 gap-3">
        {composants.map((comp) => (
          <div key={comp.nom} className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">{comp.nom}</span>
              <span className={`text-sm font-medium ${
                comp.sante >= 95 ? 'text-emerald-400' :
                comp.sante >= 85 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {comp.sante}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  comp.sante >= 95 ? 'bg-emerald-500' :
                  comp.sante >= 85 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${comp.sante}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Validations Cellule d'Expertise
function ValidationsCellule() {
  const validations = [
    { type: 'Conformité technique', statut: 'ok', message: 'Tous les champs requis présents' },
    { type: 'Éligibilité CEE', statut: 'ok', message: 'Opération éligible confirmée' },
    { type: 'Calcul prime', statut: 'ok', message: 'Montant vérifié et validé' },
    { type: 'Documents joints', statut: 'warning', message: '1 attestation en attente' },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center border border-violet-500/30">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Validations Cellule d'Expertise</h3>
          <p className="text-slate-400 text-sm">Dernier audit en cours</p>
        </div>
      </div>

      <div className="space-y-3">
        {validations.map((v, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
            {v.statut === 'ok' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{v.type}</p>
              <p className="text-slate-500 text-xs">{v.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE - DASHBOARD (CLÉ ARTISAN)
// ============================================================================

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dossiersEnCours, setDossiersEnCours] = useState(0);
  const [commissionsAPercevoir, setCommissionsAPercevoir] = useState(0);
  const [dossiersUtilises, setDossiersUtilises] = useState(0); // Quota remis à 0 après paiement
  const [showActivationBanner, setShowActivationBanner] = useState(false);
  
  // Récupération du forfait actuel
  const { tier, config, setTier } = useSubscription();
  
  // Calcul des quotas selon le forfait
  const maxDossiers = config.features.maxDossiers;
  const isUnlimited = maxDossiers === 'illimite';
  const quotaTotal = typeof maxDossiers === 'number' ? maxDossiers : 0;
  const isQuotaReached = !isUnlimited && dossiersUtilises >= quotaTotal;
  
  // Déterminer le forfait supérieur pour l'upsell
  const getNextTier = (): SubscriptionTier | null => {
    const tierOrder: SubscriptionTier[] = ['prospect', 'essentiel', 'serenite', 'expert'];
    const currentIndex = tierOrder.indexOf(tier);
    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1];
    }
    return null;
  };

  useEffect(() => {
    // Vérifier si l'utilisateur vient d'activer un forfait
    const urlParams = new URLSearchParams(window.location.search);
    const activated = urlParams.get('activated');
    
    if (activated === 'true') {
      setShowActivationBanner(true);
      setDossiersUtilises(0); // Reset quota à 0 après paiement
      // Nettoyer l'URL
      router.replace('/dashboard');
      
      // Masquer la bannière après 5 secondes
      setTimeout(() => setShowActivationBanner(false), 5000);
    }
    
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const { data: dossiers } = await supabase
        .from('dossiers_cee')
        .select('id, statut, commission')
        .eq('statut', 'en_cours');
      
      setDossiersEnCours(dossiers?.length || 0);
      
      const totalCommissions = dossiers?.reduce((sum, d) => sum + (d.commission || 0), 0) || 0;
      setCommissionsAPercevoir(totalCommissions);
    } catch (error) {
      // Silencieux en production
    } finally {
      setIsLoading(false);
    }
  };

  const formatMontant = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')} k€`;
    }
    return `${value.toFixed(0)} €`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-2">Initialisation de votre Scanner Flash...</p>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Bannière d'activation réussie */}
        {showActivationBanner && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">🎉 Forfait activé avec succès !</p>
                <p className="text-emerald-400 text-sm">Votre Scanner Flash est prêt. Quota : 0 / {quotaTotal} dossiers</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Espace Artisan</h1>
                <p className="text-emerald-400 text-sm font-medium">
                  Clé Artisan • Dépôt et suivi de dossiers CEE
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs sm:text-sm">Système Opérationnel</span>
            </div>
          </div>
        </header>

        {/* Quota de Liberté - Barre de progression */}
        <QuotaLiberte 
          used={dossiersUtilises} 
          total={quotaTotal} 
          isUnlimited={isUnlimited} 
        />

        {/* Drop Zone Premier Scan */}
        <DropZonePremierScan 
          onFileSelect={() => {}} 
          isQuotaReached={isQuotaReached}
          nextTier={getNextTier()}
        />

        {/* Stats rapides avec Impact Financier en premier */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Carte Impact Financier (Primes CEE Sécurisées) */}
          <div className="lg:col-span-1">
            <ImpactFinancierCard montant={commissionsAPercevoir || 12450} />
          </div>
          
          {/* Autres stats */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Dossiers en cours</p>
                <p className="text-xl font-bold text-white">{dossiersEnCours || DOSSIERS_ARTISAN.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Validés ce mois</p>
                <p className="text-xl font-bold text-emerald-400">12</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Primes estimées</p>
                <p className="text-xl font-bold text-white">{formatMontant(commissionsAPercevoir || 8700)}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Délai moyen</p>
                <p className="text-xl font-bold text-white">24h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoints Scanner Flash et Santé Système */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <CheckpointsAudit />
          <SystemeAuditSante />
        </div>

        {/* Tableau des dossiers récents */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Mes Dossiers Récents</h3>
                <p className="text-slate-400 text-sm">Suivi des soumissions</p>
              </div>
            </div>
            <Link href="/gestion" className="text-cyan-400 text-sm hover:underline">
              Voir tout →
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {DOSSIERS_ARTISAN.map((dossier) => {
              const statutConfig = STATUT_CONFIG[dossier.statut as keyof typeof STATUT_CONFIG];
              const StatutIcon = statutConfig.icon;
              
              return (
                <div key={dossier.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${statutConfig.bg} rounded-lg flex items-center justify-center`}>
                        <StatutIcon className={`w-5 h-5 ${statutConfig.color}`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{dossier.client}</p>
                        <p className="text-slate-500 text-sm">{dossier.id} • {dossier.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">{dossier.montant.toLocaleString()} €</p>
                      <span className={`text-xs ${statutConfig.color}`}>{statutConfig.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Espace Artisan — Système d'Audit CAPITAL ÉNERGIE</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
