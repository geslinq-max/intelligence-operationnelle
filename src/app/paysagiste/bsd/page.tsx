'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, FileText, Shield, Camera, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useIndustry } from '@/contexts/IndustryContext';
import { useToast } from '@/components/ui/Toast';
import BSDExpressForm, { BSDFormData } from '@/components/bsd/BSDExpressForm';
import { openBSDPdfPreview, downloadBSDPdf } from '@/lib/pdf/bsd-generator';
import WasteTicketScanner from '@/components/bsd/WasteTicketScanner';

export default function BSDExpressPage() {
  const router = useRouter();
  const { currentMode, config } = useIndustry();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<Partial<BSDFormData> | null>(null);

  // Callback pour recevoir les données du scanner
  const handleScannedData = useCallback((data: Partial<BSDFormData>) => {
    setScannedData(data);
    showToast({
      type: 'success',
      title: 'Données importées',
      message: 'Le formulaire a été pré-rempli avec les données du ticket.',
      duration: 4000,
    });
  }, [showToast]);

  // Vérifier que le mode est bien PAYSAGISTE_DEMOLITION
  useEffect(() => {
    if (currentMode !== 'PAYSAGISTE_DEMOLITION') {
      showToast({
        type: 'error',
        title: 'Accès refusé',
        message: 'Ce module est réservé au mode Paysagiste/Démolition.',
        duration: 5000,
      });
      router.push('/admin');
    } else {
      setIsAuthorized(true);
    }
  }, [currentMode, router, showToast]);

  const handleSubmit = async (data: BSDFormData) => {
    setIsLoading(true);
    try {
      // Simuler l'envoi vers Trackdéchets (à implémenter avec l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Générer et télécharger le PDF
      downloadBSDPdf(data);

      showToast({
        type: 'success',
        title: 'BSD validé',
        message: 'Le bordereau a été enregistré et le PDF téléchargé.',
        duration: 5000,
      });

      // Rediriger vers le dashboard
      router.push('/admin');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la validation.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = (data: BSDFormData) => {
    openBSDPdfPreview(data);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20 lg:pb-0">
      {/* Header - Mobile First */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">BSD Express</h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">Bordereau de Suivi des Déchets</p>
            </div>
          </div>

          {/* Bouton Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium transition-all text-sm active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner ticket</span>
          </button>

          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border flex-shrink-0`}>
            <span className="text-lg">{config.icon}</span>
            <span className={`text-sm font-medium ${config.color}`}>{config.shortLabel}</span>
          </div>
        </div>
      </header>

      {/* Contenu principal - Mobile First */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Alerte conformité */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-8 flex items-start gap-2 sm:gap-3">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-amber-400 font-medium text-sm sm:text-base">Conformité Trackdéchets</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Ce formulaire génère un bordereau conforme aux exigences réglementaires. 
              Les signatures tactiles valident l'enlèvement sur le terrain.
            </p>
          </div>
        </div>

        {/* Bandeau Scanner Flash */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-amber-400 font-medium text-sm sm:text-base">Scanner Flash IA</p>
              <p className="text-xs text-slate-400 truncate">
                Scannez un ticket de pesée pour pré-remplir automatiquement le formulaire
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>

        {/* Formulaire BSD */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 sm:p-6">
          <BSDExpressForm
            onSubmit={handleSubmit}
            onGeneratePDF={handleGeneratePDF}
            isLoading={isLoading}
            initialData={scannedData || undefined}
          />
        </div>
      </main>

      {/* Scanner Modal */}
      <WasteTicketScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDataExtracted={handleScannedData}
      />

      {/* Footer mobile */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-3 sm:p-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs sm:text-sm">
          <FileText className="w-4 h-4" />
          <span>BSD Express - Capital Énergie</span>
        </div>
      </footer>
    </div>
  );
}
