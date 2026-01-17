'use client';

import { useState } from 'react';
import { 
  Grape, 
  AlertTriangle, 
  Calendar,
  Download,
  ChevronRight,
  Leaf,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface Traitement {
  id: string;
  parcelle: string;
  produit: string;
  date: string;
  dar: number;
  dateRecolteAutorisee: string;
  joursRestants: number;
}

interface ClientViticulteurViewProps {
  clientId: string;
  clientNom: string;
  hasData?: boolean;
  onExportPDF?: () => void;
}

// Données de démonstration
const DEMO_TRAITEMENTS: Traitement[] = [
  {
    id: '1',
    parcelle: 'Parcelle A - Chardonnay',
    produit: 'Bouillie bordelaise',
    date: '2026-01-10',
    dar: 21,
    dateRecolteAutorisee: '2026-01-31',
    joursRestants: 14,
  },
  {
    id: '2',
    parcelle: 'Parcelle B - Pinot Noir',
    produit: 'Soufre mouillable',
    date: '2026-01-15',
    dar: 5,
    dateRecolteAutorisee: '2026-01-20',
    joursRestants: 3,
  },
  {
    id: '3',
    parcelle: 'Parcelle C - Merlot',
    produit: 'Cuivre hydroxyde',
    date: '2026-01-08',
    dar: 14,
    dateRecolteAutorisee: '2026-01-22',
    joursRestants: 5,
  },
];

export default function ClientViticulteurView({ 
  clientId, 
  clientNom,
  hasData = true,
  onExportPDF 
}: ClientViticulteurViewProps) {
  const [traitements] = useState<Traitement[]>(hasData ? DEMO_TRAITEMENTS : []);

  // Calculs
  const alertesDAR = traitements.filter(t => t.joursRestants <= 7 && t.joursRestants >= 0).length;
  const traitementsRecents = traitements.length;
  const prochainDAR = traitements.reduce((min, t) => 
    t.joursRestants >= 0 && t.joursRestants < min ? t.joursRestants : min, 999
  );

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className={`border rounded-xl p-4 ${
          alertesDAR > 0 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-5 h-5 ${alertesDAR > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className={`text-xs font-medium ${alertesDAR > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Alertes DAR
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {alertesDAR}
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">Traitements</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {traitementsRecents}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Prochain DAR</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {prochainDAR < 999 ? `${prochainDAR}j` : '-'}
          </p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link 
          href="/viticulture/registre-phyto"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Grape className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Nouveau traitement</h3>
              <p className="text-sm text-slate-400">Saisie rapide</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button 
          onClick={onExportPDF}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Download className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Télécharger registre</h3>
              <p className="text-sm text-slate-400">Export PDF réglementaire</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Liste des traitements récents */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Dernières interventions
          </h3>
        </div>

        <div className="divide-y divide-slate-700/50">
          {traitements.map((traitement) => {
            const isAlert = traitement.joursRestants <= 7 && traitement.joursRestants >= 0;
            const isPast = traitement.joursRestants < 0;
            
            return (
              <div key={traitement.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{traitement.parcelle}</span>
                      {isAlert && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          DAR proche
                        </span>
                      )}
                      {isPast && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Récolte OK
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{traitement.produit}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Traité le {new Date(traitement.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${
                      isAlert ? 'text-amber-400' : isPast ? 'text-emerald-400' : 'text-purple-400'
                    }`}>
                      {traitement.joursRestants >= 0 ? `${traitement.joursRestants}j` : 'OK'}
                    </p>
                    <p className="text-xs text-slate-500">avant récolte</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info réglementaire */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
        <Grape className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-purple-300">
            <strong className="text-white">Registre conforme</strong> — Votre registre phytosanitaire 
            est automatiquement formaté selon l'Article L. 254-3-1 du Code rural.
          </p>
        </div>
      </div>
    </div>
  );
}
