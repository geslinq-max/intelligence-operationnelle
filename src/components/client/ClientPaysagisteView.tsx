'use client';

import { useState } from 'react';
import { 
  Truck, 
  FileText, 
  Scale,
  Plus,
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface BSD {
  id: string;
  reference: string;
  chantier: string;
  typeDechet: string;
  tonnage: number;
  statut: 'brouillon' | 'signe' | 'enleve' | 'traite';
  dateCreation: string;
}

interface ClientPaysagisteViewProps {
  clientId: string;
  clientNom: string;
  hasData?: boolean;
}

// Données de démonstration
const DEMO_BSD: BSD[] = [
  {
    id: '1',
    reference: 'BSD-2026-0089',
    chantier: 'Résidence Les Jardins',
    typeDechet: 'Terres et cailloux',
    tonnage: 12.5,
    statut: 'traite',
    dateCreation: '2026-01-10',
  },
  {
    id: '2',
    reference: 'BSD-2026-0102',
    chantier: 'Villa Dupont',
    typeDechet: 'Déchets verts',
    tonnage: 3.2,
    statut: 'enleve',
    dateCreation: '2026-01-14',
  },
  {
    id: '3',
    reference: 'BSD-2026-0115',
    chantier: 'Parc Municipal',
    typeDechet: 'Gravats / Béton',
    tonnage: 8.0,
    statut: 'signe',
    dateCreation: '2026-01-17',
  },
];

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  signe: { label: 'Signé', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  enleve: { label: 'Enlevé', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  traite: { label: 'Traité', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

export default function ClientPaysagisteView({ clientId, clientNom, hasData = true }: ClientPaysagisteViewProps) {
  const [bsdList] = useState<BSD[]>(hasData ? DEMO_BSD : []);

  // Calculs
  const totalTonnage = bsdList.reduce((acc, b) => acc + b.tonnage, 0);
  const bsdTraites = bsdList.filter(b => b.statut === 'traite').length;
  const bsdEnCours = bsdList.filter(b => b.statut !== 'traite').length;

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Tonnage total</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {totalTonnage.toFixed(1)} T
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">BSD traités</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {bsdTraites}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">En cours</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {bsdEnCours}
          </p>
        </div>
      </div>

      {/* Accès rapide BSD */}
      <Link 
        href="/paysagiste/bsd"
        className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Plus className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Nouveau BSD</h3>
            <p className="text-sm text-slate-400">Créer un bordereau de suivi des déchets</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Historique BSD */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            Historique BSD
          </h3>
          <span className="text-xs text-slate-400">{bsdList.length} bordereaux</span>
        </div>

        <div className="divide-y divide-slate-700/50">
          {bsdList.map((bsd) => {
            const config = STATUT_CONFIG[bsd.statut];
            
            return (
              <div key={bsd.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{bsd.reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{bsd.chantier}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{bsd.typeDechet}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(bsd.dateCreation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-amber-400">{bsd.tonnage} T</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Récapitulatif conformité */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-emerald-300">
            <strong className="text-white">Conformité Trackdéchets</strong> — Tous vos bordereaux sont 
            automatiquement préparés pour l'envoi réglementaire 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
