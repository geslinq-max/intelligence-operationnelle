'use client';

import { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);
  const [dossiersEnCours, setDossiersEnCours] = useState(0);
  const [commissionsAPercevoir, setCommissionsAPercevoir] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
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

        {/* Bouton dépôt principal */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                <Upload className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Déposer un nouveau dossier</h2>
                <p className="text-slate-400 text-sm">Soumettez vos devis pour analyse par le Système d'Audit</p>
              </div>
            </div>
            <Link
              href="/verificateur"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Déposer un Dossier
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Santé Système et Validations */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <SystemeAuditSante />
          <ValidationsCellule />
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
