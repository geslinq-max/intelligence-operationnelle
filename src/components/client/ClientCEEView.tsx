'use client';

import { useState } from 'react';
import { 
  FileText, 
  Euro, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  ChevronRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface Dossier {
  id: string;
  reference: string;
  type: string;
  montant: number;
  statut: 'en_cours' | 'valide' | 'en_attente' | 'refuse';
  dateCreation: string;
  dateMAJ: string;
}

interface ClientCEEViewProps {
  clientId: string;
  clientNom: string;
  hasData?: boolean;
}

// Données de démonstration
const DEMO_DOSSIERS: Dossier[] = [
  {
    id: '1',
    reference: 'CEE-2026-0142',
    type: 'BAR-TH-164 (Pompe à chaleur)',
    montant: 4500,
    statut: 'valide',
    dateCreation: '2026-01-10',
    dateMAJ: '2026-01-15',
  },
  {
    id: '2',
    reference: 'CEE-2026-0156',
    type: 'BAR-EN-101 (Isolation combles)',
    montant: 2800,
    statut: 'en_cours',
    dateCreation: '2026-01-12',
    dateMAJ: '2026-01-17',
  },
  {
    id: '3',
    reference: 'CEE-2026-0163',
    type: 'BAR-TH-106 (Chaudière biomasse)',
    montant: 5200,
    statut: 'en_attente',
    dateCreation: '2026-01-15',
    dateMAJ: '2026-01-15',
  },
];

const STATUT_CONFIG = {
  en_cours: { label: 'En cours', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Clock },
  valide: { label: 'Validé', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
  en_attente: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
  refuse: { label: 'Refusé', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
};

export default function ClientCEEView({ clientId, clientNom, hasData = true }: ClientCEEViewProps) {
  const [dossiers] = useState<Dossier[]>(hasData ? DEMO_DOSSIERS : []);

  // Calculs
  const totalPrimes = dossiers.filter(d => d.statut === 'valide').reduce((acc, d) => acc + d.montant, 0);
  const primesEnCours = dossiers.filter(d => d.statut === 'en_cours' || d.statut === 'en_attente').reduce((acc, d) => acc + d.montant, 0);
  const dossiersValides = dossiers.filter(d => d.statut === 'valide').length;

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Primes sécurisées</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {totalPrimes.toLocaleString()} €
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">En cours</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {primesEnCours.toLocaleString()} €
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Dossiers validés</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {dossiersValides}
          </p>
        </div>
      </div>

      {/* Accès rapide Scanner */}
      <Link 
        href="/verificateur"
        className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl hover:border-cyan-500/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl">
            <Upload className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Scanner Flash</h3>
            <p className="text-sm text-slate-400">Déposez un devis pour vérification instantanée</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Liste des dossiers */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Mes Dossiers CEE
          </h3>
          <span className="text-xs text-slate-400">{dossiers.length} dossiers</span>
        </div>

        <div className="divide-y divide-slate-700/50">
          {dossiers.map((dossier) => {
            const config = STATUT_CONFIG[dossier.statut];
            const Icon = config.icon;
            
            return (
              <div key={dossier.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{dossier.reference}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 truncate">{dossier.type}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mis à jour le {new Date(dossier.dateMAJ).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">{dossier.montant.toLocaleString()} €</p>
                    <p className="text-xs text-slate-500">Prime estimée</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message d'aide */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-300">
            <strong className="text-white">Besoin d'aide ?</strong> Notre solution analyse automatiquement 
            vos devis et vous guide vers les meilleures primes CEE disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}
