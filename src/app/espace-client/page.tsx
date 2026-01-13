'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock,
  Shield,
  Loader2,
  X,
  FileCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

type DossierStatus = 'depot' | 'analyse' | 'certification' | 'valide';

interface Dossier {
  id: string;
  nom: string;
  dateDepot: string;
  status: DossierStatus;
  montantEconomies: number;
  montantSubventions: number;
}

const demoData: Dossier[] = [
  {
    id: '1',
    nom: 'Pompe à chaleur - Dupont Industries',
    dateDepot: '2026-01-10',
    status: 'valide',
    montantEconomies: 12500,
    montantSubventions: 8500,
  },
  {
    id: '2',
    nom: 'Isolation thermique - Garage Martin',
    dateDepot: '2026-01-12',
    status: 'certification',
    montantEconomies: 6200,
    montantSubventions: 4100,
  },
  {
    id: '3',
    nom: 'Variateur de vitesse - Atelier Legrand',
    dateDepot: '2026-01-13',
    status: 'analyse',
    montantEconomies: 8900,
    montantSubventions: 5600,
  },
];

function useCountAnimation(target: number, duration: number = 2500) {
  const [count, setCount] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * target);

      setCount(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return count;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const TIMELINE_STEPS = [
  { key: 'depot', label: 'Dépôt', icon: Upload },
  { key: 'analyse', label: 'Analyse Algorithmique', icon: Clock },
  { key: 'certification', label: 'Certification', icon: Shield },
  { key: 'valide', label: 'Validé', icon: CheckCircle2 },
];

function getStepIndex(status: DossierStatus): number {
  return TIMELINE_STEPS.findIndex(s => s.key === status);
}

function ChronologieConfiance({ status }: { status: DossierStatus }) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all
                  ${isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                      ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500 animate-pulse' 
                      : 'bg-slate-700 text-slate-500'
                  }
                `}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 text-center max-w-[60px] sm:max-w-[80px] leading-tight ${
                isCompleted || isCurrent ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
            {index < TIMELINE_STEPS.length - 1 && (
              <div className={`w-4 sm:w-8 h-0.5 mx-1 ${
                index < currentIndex ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EspaceClientPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>(demoData);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dossiersValides = dossiers.filter(d => d.status === 'valide' || d.status === 'certification');
  const capitalSecurise = dossiersValides.reduce(
    (sum, d) => sum + d.montantEconomies + d.montantSubventions, 
    0
  );
  const animatedCapital = useCountAnimation(capitalSecurise, 2500);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newDossier: Dossier = {
      id: Date.now().toString(),
      nom: file.name.replace(/\.[^/.]+$/, ''),
      dateDepot: new Date().toISOString().split('T')[0],
      status: 'depot',
      montantEconomies: 0,
      montantSubventions: 0,
    };

    setDossiers(prev => [newDossier, ...prev]);
    setIsUploading(false);
    setUploadSuccess(true);

    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">CAPITAL ÉNERGIE</h1>
              <p className="text-slate-500 text-xs">Espace Partenaire</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Cellule Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Bouclier de Trésorerie - Monumental */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/20 p-8 sm:p-12">
            {/* Glow effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center">
              {/* Shield Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/40 shadow-inner mb-6">
                <span className="text-5xl sm:text-6xl">🛡️</span>
              </div>

              {/* Label */}
              <p className="text-emerald-400/80 text-sm sm:text-base font-medium tracking-widest uppercase mb-4">
                Capital Sécurisé par la Cellule
              </p>

              {/* Amount */}
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-5xl sm:text-7xl font-bold text-white tracking-tight">
                  <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                    {formatCurrency(animatedCapital)}
                  </span>
                </p>
                <span className="text-emerald-400/80 text-3xl sm:text-4xl font-light">€</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>{dossiersValides.length} dossier{dossiersValides.length > 1 ? 's' : ''} validé{dossiersValides.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{dossiers.filter(d => d.status === 'analyse').length} en analyse</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Zone de Dépôt Drag & Drop */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Déposer un nouveau devis
          </h2>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center cursor-pointer
              transition-all duration-300 ease-out
              ${isDragOver 
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-lg shadow-cyan-500/20' 
                : isUploading
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : uploadSuccess
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              onChange={handleInputChange}
              className="hidden"
            />

            {isUploading ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-amber-400 mb-2">
                  Analyse en cours...
                </h3>
                <p className="text-slate-400">Votre devis est en cours de traitement</p>
              </>
            ) : uploadSuccess ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-400 mb-2">
                  Dossier déposé avec succès !
                </h3>
                <p className="text-slate-400">L'analyse algorithmique a démarré</p>
              </>
            ) : (
              <>
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                  ${isDragOver ? 'bg-cyan-500/20' : 'bg-slate-700/50'}
                  transition-colors
                `}>
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>

                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  Glissez votre devis ici
                </h3>
                <p className="text-slate-400 mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    PNG, JPG, PDF
                  </span>
                  <span>•</span>
                  <span>Taille max : 10 Mo</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Liste des Dossiers avec Chronologie */}
        <section>
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            Vos dossiers
          </h2>

          <div className="space-y-4">
            {dossiers.map((dossier) => (
              <div
                key={dossier.id}
                className={`
                  bg-slate-800/50 border rounded-xl p-5 sm:p-6 transition-all
                  ${dossier.status === 'valide' 
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                    : 'border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info dossier */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${dossier.status === 'valide' 
                          ? 'bg-emerald-500/20' 
                          : dossier.status === 'certification'
                            ? 'bg-cyan-500/20'
                            : 'bg-slate-700/50'
                        }
                      `}>
                        {dossier.status === 'valide' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : dossier.status === 'certification' ? (
                          <Shield className="w-5 h-5 text-cyan-400" />
                        ) : dossier.status === 'analyse' ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{dossier.nom}</h3>
                        <p className="text-slate-500 text-sm">
                          Déposé le {formatDate(dossier.dateDepot)}
                        </p>
                        {dossier.status === 'valide' && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-emerald-400 font-semibold">
                              +{formatCurrency(dossier.montantEconomies + dossier.montantSubventions)} €
                            </span>
                            <span className="text-xs text-slate-500">
                              économies + subventions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chronologie de Confiance */}
                  <div className="lg:flex-shrink-0">
                    <ChronologieConfiance status={dossier.status} />
                  </div>
                </div>
              </div>
            ))}

            {dossiers.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun dossier pour le moment</p>
                <p className="text-sm">Déposez votre premier devis ci-dessus</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            Cellule d'Expertise CAPITAL ÉNERGIE • Système d'Audit Sécurisé
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
          </p>
        </footer>
      </main>
    </div>
  );
}
