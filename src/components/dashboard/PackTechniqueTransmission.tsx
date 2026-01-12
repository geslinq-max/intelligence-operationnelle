'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  Camera, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Send,
  Image as ImageIcon
} from 'lucide-react';

interface FicheCEE {
  code: string;
  libelle: string;
  kWhCumac: number;
  montantCEE: number;
}

interface PhotoValidee {
  id: string;
  url: string;
  type: 'plaque' | 'tableau' | 'equipement' | 'autre';
  validee: boolean;
  dateCapture: string;
}

interface PackTechniqueProps {
  entrepriseId: string;
  entrepriseNom: string;
  fichesCEE: FicheCEE[];
  photos: PhotoValidee[];
  onStatusChange?: (status: DossierStatus) => void;
}

type DossierStatus = 
  | 'incomplet' 
  | 'en_attente_validation' 
  | 'pret_pour_artisan_rge' 
  | 'transmis';

interface PackCompletude {
  fichesCEEValides: boolean;
  photosPlaquesPresentes: boolean;
  photosTableauPresentes: boolean;
  kWhCumacCalcule: boolean;
  isComplete: boolean;
}

export default function PackTechniqueTransmission({
  entrepriseId,
  entrepriseNom,
  fichesCEE,
  photos,
  onStatusChange,
}: PackTechniqueProps) {
  const [status, setStatus] = useState<DossierStatus>('incomplet');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Calcul de la complétude du pack
  const completude = useMemo<PackCompletude>(() => {
    const fichesCEEValides = fichesCEE.length > 0 && fichesCEE.every(f => f.code && f.kWhCumac > 0);
    const photosPlaquesPresentes = photos.some(p => p.type === 'plaque' && p.validee);
    const photosTableauPresentes = photos.some(p => p.type === 'tableau' && p.validee);
    const kWhCumacCalcule = fichesCEE.reduce((sum, f) => sum + f.kWhCumac, 0) > 0;
    
    const isComplete = fichesCEEValides && photosPlaquesPresentes && photosTableauPresentes && kWhCumacCalcule;
    
    return {
      fichesCEEValides,
      photosPlaquesPresentes,
      photosTableauPresentes,
      kWhCumacCalcule,
      isComplete,
    };
  }, [fichesCEE, photos]);

  // ═══════════════════════════════════════════════════════════════
  // AUTOMATISATION DU STATUT - Changement automatique si pack complet
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    let newStatus: DossierStatus = 'incomplet';
    
    if (completude.isComplete) {
      // Si le pack est complet, passer automatiquement en "Prêt pour l'Artisan RGE"
      newStatus = 'pret_pour_artisan_rge';
    } else if (completude.fichesCEEValides || completude.photosPlaquesPresentes) {
      // Si partiellement complet
      newStatus = 'en_attente_validation';
    }
    
    if (newStatus !== status) {
      setStatus(newStatus);
      // Notifier le parent du changement de statut
      onStatusChange?.(newStatus);
    }
  }, [completude, status, onStatusChange]);

  // Calculs totaux
  const totalKWhCumac = fichesCEE.reduce((sum, f) => sum + f.kWhCumac, 0);
  const totalMontantCEE = fichesCEE.reduce((sum, f) => sum + f.montantCEE, 0);
  const photosValidees = photos.filter(p => p.validee);

  const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(n);

  const getStatusConfig = (s: DossierStatus) => {
    switch (s) {
      case 'pret_pour_artisan_rge':
        return { 
          label: 'Dossier Prêt pour l\'Artisan RGE', 
          color: 'text-green-400', 
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          icon: CheckCircle2 
        };
      case 'en_attente_validation':
        return { 
          label: 'En attente de validation', 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          icon: AlertCircle 
        };
      case 'transmis':
        return { 
          label: 'Transmis à l\'artisan', 
          color: 'text-cyan-400', 
          bg: 'bg-cyan-500/20',
          border: 'border-cyan-500/50',
          icon: Send 
        };
      default:
        return { 
          label: 'Dossier incomplet', 
          color: 'text-slate-400', 
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/50',
          icon: AlertCircle 
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header avec statut */}
      <div className={`p-4 ${statusConfig.bg} border-b ${statusConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className={`w-6 h-6 ${statusConfig.color}`} />
            <div>
              <h3 className="text-white font-bold">Pack Technique de Transmission</h3>
              <p className="text-slate-400 text-sm">{entrepriseNom}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            <span className={`text-sm font-semibold ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Section Fiches CEE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className={`w-5 h-5 ${completude.fichesCEEValides ? 'text-green-400' : 'text-slate-500'}`} />
            <h4 className="text-white font-semibold">Fiches CEE Applicables</h4>
            {completude.fichesCEEValides && (
              <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
            )}
          </div>
          
          <div className="space-y-2">
            {fichesCEE.map((fiche, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
                    {fiche.code}
                  </span>
                  <span className="text-slate-300 text-sm">{fiche.libelle}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatNumber(fiche.kWhCumac)} kWh cumac</p>
                  <p className="text-green-400 text-sm">{formatCurrency(fiche.montantCEE)}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-lg border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-300">Total économies d'énergie</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{formatNumber(totalKWhCumac)} kWh cumac</p>
                <p className="text-green-400 font-semibold">{formatCurrency(totalMontantCEE)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Galerie Photos Validées */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className={`w-5 h-5 ${(completude.photosPlaquesPresentes && completude.photosTableauPresentes) ? 'text-green-400' : 'text-slate-500'}`} />
            <h4 className="text-white font-semibold">Galerie Photos Validées</h4>
            <span className="text-slate-500 text-sm">({photosValidees.length} validées)</span>
            {(completude.photosPlaquesPresentes && completude.photosTableauPresentes) && (
              <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
            )}
          </div>
          
          {/* Checklist photos */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className={`flex items-center gap-2 p-2 rounded-lg ${completude.photosPlaquesPresentes ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-700/50'}`}>
              {completude.photosPlaquesPresentes ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span className={`text-sm ${completude.photosPlaquesPresentes ? 'text-green-400' : 'text-slate-400'}`}>
                Photos plaques signalétiques
              </span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${completude.photosTableauPresentes ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-700/50'}`}>
              {completude.photosTableauPresentes ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span className={`text-sm ${completude.photosTableauPresentes ? 'text-green-400' : 'text-slate-400'}`}>
                Photos tableau électrique
              </span>
            </div>
          </div>

          {/* Galerie */}
          <div className="grid grid-cols-4 gap-2">
            {photosValidees.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.url)}
                className="relative aspect-square bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-cyan-500 transition-all group"
              >
                {photo.url ? (
                  <img 
                    src={photo.url} 
                    alt={photo.type}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60">
                  <span className="text-xs text-white capitalize">{photo.type}</span>
                </div>
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton de transmission si prêt */}
        {status === 'pret_pour_artisan_rge' && (
          <button
            onClick={() => {
              setStatus('transmis');
              onStatusChange?.('transmis');
            }}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Transmettre le Pack à l'Artisan RGE
          </button>
        )}
      </div>

      {/* Modal photo plein écran */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setSelectedPhoto(null)}
        >
          <img 
            src={selectedPhoto} 
            alt="Photo agrandie"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
