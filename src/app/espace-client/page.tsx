'use client';

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  AlertCircle,
  ArrowLeft,
  Eye,
  Download,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';

type DossierStatus = 'depot' | 'analyse' | 'certification' | 'valide';

type DocumentType = 'devis' | 'note_technique' | 'attestation_honneur' | 'photo_avant' | 'photo_apres';

const DOCUMENTS_REQUIS: { key: DocumentType; label: string }[] = [
  { key: 'devis', label: 'Devis signé' },
  { key: 'note_technique', label: 'Note technique' },
  { key: 'attestation_honneur', label: 'Attestation sur l\'honneur' },
  { key: 'photo_avant', label: 'Photo avant travaux' },
  { key: 'photo_apres', label: 'Photo après travaux' },
];

interface Dossier {
  id: string;
  nom: string;
  dateDepot: string;
  status: DossierStatus;
  montantEconomies: number;
  montantSubventions: number;
  clientId: string;
  documents: Partial<Record<DocumentType, boolean>>;
}

interface ClientData {
  id: string;
  nom: string;
  secteur: string;
  ville: string;
}

const CLIENTS_DATA: Record<string, ClientData> = {
  '1': { id: '1', nom: 'Métallurgie Dupont SARL', secteur: 'Métallurgie', ville: 'Lyon' },
  '2': { id: '2', nom: 'Plasturgie Ouest', secteur: 'Plasturgie', ville: 'Nantes' },
  '3': { id: '3', nom: 'Fonderie Martin', secteur: 'Fonderie', ville: 'Marseille' },
  '4': { id: '4', nom: 'Textiles Innovants SA', secteur: 'Textile', ville: 'Lille' },
  '5': { id: '5', nom: "Verrerie d'Azur", secteur: 'Verrerie', ville: 'Nice' },
};

const ALL_DOSSIERS: Dossier[] = [
  {
    id: 'd1',
    nom: 'Pompe à chaleur - Bâtiment A',
    dateDepot: '2026-01-10',
    status: 'valide',
    montantEconomies: 12500,
    montantSubventions: 8500,
    clientId: '1',
    documents: { devis: true, note_technique: true, attestation_honneur: true, photo_avant: true, photo_apres: true },
  },
  {
    id: 'd2',
    nom: 'Variateur de vitesse VFD-200',
    dateDepot: '2026-01-08',
    status: 'certification',
    montantEconomies: 4200,
    montantSubventions: 3100,
    clientId: '1',
    documents: { devis: true, note_technique: true, attestation_honneur: true, photo_avant: true, photo_apres: false },
  },
  {
    id: 'd3',
    nom: 'Isolation thermique - Atelier principal',
    dateDepot: '2026-01-12',
    status: 'certification',
    montantEconomies: 6200,
    montantSubventions: 4100,
    clientId: '2',
    documents: { devis: true, note_technique: true, attestation_honneur: false, photo_avant: true, photo_apres: false },
  },
  {
    id: 'd4',
    nom: 'Récupérateur de chaleur RCH-500',
    dateDepot: '2026-01-05',
    status: 'valide',
    montantEconomies: 18500,
    montantSubventions: 15200,
    clientId: '3',
    documents: { devis: true, note_technique: true, attestation_honneur: true, photo_avant: true, photo_apres: true },
  },
  {
    id: 'd5',
    nom: 'Compresseur haute efficacité',
    dateDepot: '2026-01-11',
    status: 'analyse',
    montantEconomies: 9800,
    montantSubventions: 7400,
    clientId: '3',
    documents: { devis: true, note_technique: false, attestation_honneur: false, photo_avant: false, photo_apres: false },
  },
  {
    id: 'd6',
    nom: 'Échangeur thermique ET-350',
    dateDepot: '2026-01-09',
    status: 'valide',
    montantEconomies: 11200,
    montantSubventions: 8900,
    clientId: '5',
    documents: { devis: true, note_technique: true, attestation_honneur: true, photo_avant: true, photo_apres: true },
  },
  {
    id: 'd7',
    nom: 'Moteur IE4 - Ligne production',
    dateDepot: '2026-01-13',
    status: 'depot',
    montantEconomies: 0,
    montantSubventions: 0,
    clientId: '5',
    documents: { devis: true, note_technique: false, attestation_honneur: false, photo_avant: false, photo_apres: false },
  },
];

const DEFAULT_DOSSIERS: Dossier[] = [
  {
    id: 'default1',
    nom: 'Pompe à chaleur - Démo',
    dateDepot: '2026-01-10',
    status: 'valide',
    montantEconomies: 12500,
    montantSubventions: 8500,
    clientId: 'default',
    documents: { devis: true, note_technique: true, attestation_honneur: true, photo_avant: true, photo_apres: true },
  },
  {
    id: 'default2',
    nom: 'Isolation thermique - Démo',
    dateDepot: '2026-01-12',
    status: 'certification',
    montantEconomies: 6200,
    montantSubventions: 4100,
    clientId: 'default',
    documents: { devis: true, note_technique: true, attestation_honneur: false, photo_avant: true, photo_apres: false },
  },
];

function calculerSanteAdministrative(documents: Partial<Record<DocumentType, boolean>>) {
  const total = DOCUMENTS_REQUIS.length;
  const presentsCount = DOCUMENTS_REQUIS.filter(d => documents[d.key]).length;
  const pourcentage = Math.round((presentsCount / total) * 100);
  const manquants = DOCUMENTS_REQUIS.filter(d => !documents[d.key]);
  
  return {
    pourcentage,
    presentsCount,
    total,
    manquants,
    estComplet: manquants.length === 0,
  };
}

function getBarreColor(pourcentage: number): { bg: string; glow: string } {
  if (pourcentage >= 71) {
    return { 
      bg: 'bg-gradient-to-r from-emerald-500 to-emerald-400', 
      glow: 'shadow-lg shadow-emerald-500/30' 
    };
  } else if (pourcentage >= 31) {
    return { 
      bg: 'bg-gradient-to-r from-orange-500 to-amber-400', 
      glow: '' 
    };
  } else {
    return { 
      bg: 'bg-gradient-to-r from-red-600 to-red-400', 
      glow: '' 
    };
  }
}

interface DepotModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierNom: string;
  documentManquant: { key: DocumentType; label: string };
  onDepot: (docKey: DocumentType) => void;
}

function DepotModal({ isOpen, onClose, dossierNom, documentManquant, onDepot }: DepotModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCertifying, setIsCertifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsUploading(false);
    
    setIsCertifying(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsCertifying(false);
    
    setIsSuccess(true);
    onDepot(documentManquant.key);
    
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">
              Document certifié !
            </h3>
            <p className="text-slate-400 text-sm">La Cellule d'Expertise a validé votre document</p>
          </div>
        ) : isCertifying ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              Certification en cours...
            </h3>
            <p className="text-slate-400 text-sm">La Cellule d'Expertise analyse votre document</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : isUploading ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">Téléchargement...</h3>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Dépôt de document</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
              <p className="text-slate-400 text-sm mb-1">Dépôt requis pour</p>
              <p className="text-white font-medium">{dossierNom}</p>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Document demandé</p>
                <p className="text-amber-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {documentManquant.label}
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Déposer le document
            </button>
            
            <p className="text-slate-500 text-xs text-center mt-4">
              Système d'Audit • Formats acceptés : PDF, JPG, PNG
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface BarreSanteProps {
  documents: Partial<Record<DocumentType, boolean>>;
  dossierNom: string;
  onDocumentDepose?: (docKey: DocumentType) => void;
}

function BarreSanteAdministrative({ documents, dossierNom, onDocumentDepose }: BarreSanteProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const sante = calculerSanteAdministrative(documents);
  const colors = getBarreColor(sante.pourcentage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(sante.pourcentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [sante.pourcentage]);

  useEffect(() => {
    if (sante.pourcentage === 100 && !isComplete) {
      setIsComplete(true);
    }
  }, [sante.pourcentage, isComplete]);

  const handleDepot = (docKey: DocumentType) => {
    if (onDocumentDepose) {
      onDocumentDepose(docKey);
    }
  };

  const premierManquant = sante.manquants[0];

  return (
    <div className="mt-3 relative">
      {/* Modal de dépôt */}
      {premierManquant && (
        <DepotModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          dossierNom={dossierNom}
          documentManquant={premierManquant}
          onDepot={handleDepot}
        />
      )}

      {/* Barre de progression animée - cliquable si documents manquants */}
      <div 
        className={`relative h-2 bg-slate-700/50 rounded-full overflow-hidden ${
          sante.manquants.length > 0 ? 'cursor-pointer hover:ring-2 hover:ring-cyan-500/50' : 'cursor-default'
        } ${isComplete ? 'animate-pulse' : ''}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => sante.manquants.length > 0 && setModalOpen(true)}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${colors.bg} ${colors.glow} ${
            isComplete ? 'animate-[shimmer_2s_ease-in-out_infinite]' : ''
          }`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      {/* Libellé dynamique - cliquable */}
      <div className="flex items-center justify-between mt-1.5">
        <button
          onClick={() => sante.manquants.length > 0 && setModalOpen(true)}
          className={`text-xs font-medium flex items-center gap-1 ${
            sante.estComplet ? 'text-emerald-400' : 
            sante.pourcentage >= 31 ? 'text-amber-400 hover:text-amber-300' : 'text-red-400 hover:text-red-300'
          } ${sante.manquants.length > 0 ? 'cursor-pointer underline-offset-2 hover:underline' : ''}`}
        >
          {sante.estComplet 
            ? '✅ Dossier Complet' 
            : <><Upload className="w-3 h-3" /> Déposer {sante.manquants.length} pièce{sante.manquants.length > 1 ? 's' : ''}</>
          }
        </button>
        <span className="text-xs text-slate-500">
          {sante.presentsCount}/{sante.total} pièces
        </span>
      </div>

      {/* Tooltip avec pièces manquantes - pointer-events: none pour éviter scintillement */}
      {showTooltip && sante.manquants.length > 0 && (
        <div 
          className="absolute left-0 right-0 z-50"
          style={{ 
            top: 'calc(100% + 10px)',
            pointerEvents: 'none'
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Pièces manquantes (Système d'Audit)
            </p>
            <ul className="space-y-1">
              {sante.manquants.map((doc) => (
                <li key={doc.key} className="text-xs text-red-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  {doc.label}
                </li>
              ))}
            </ul>
            <p className="text-xs text-cyan-400 mt-3 pt-2 border-t border-slate-700">
              👆 Cliquez pour déposer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier;
}

function AttestationModal({ isOpen, onClose, dossier }: AttestationModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatMontantFR = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/\s/g, ' ') + ' euros';
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    await new Promise(r => setTimeout(r, 2000));
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const dateValidite = new Date();
    dateValidite.setFullYear(dateValidite.getFullYear() + 1);
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPITAL ENERGIE', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Cellule d\'Expertise - Systeme d\'Audit de Conformite', pageWidth / 2, 42, { align: 'center' });
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTESTATION DE CONFORMITE', pageWidth / 2, 75, { align: 'center' });
    
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, 82, pageWidth - margin, 82);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const today = new Date().toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
    doc.text(`Date d'emission : ${today}`, margin, 100);
    doc.text(`Reference : DOSSIER-${dossier.id}`, margin, 110);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const bodyText = [
      'La Cellule d\'Expertise CAPITAL ENERGIE certifie que le dossier :',
    ];
    
    let yPos = 130;
    bodyText.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 8;
    });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`"${dossier.nom}"`, pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 18;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const bodyText2 = [
      'a ete integralement audite et valide par notre Systeme d\'Audit.',
      '',
      'L\'ensemble des pieces justificatives requises ont ete verifiees :',
    ];
    bodyText2.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 8;
    });
    
    const checkItems = [
      'Devis signe par les parties',
      'Note technique detaillee',
      'Attestation sur l\'honneur',
      'Photos avant et apres travaux'
    ];
    checkItems.forEach(item => {
      doc.setTextColor(16, 185, 129);
      doc.text('>', margin + 5, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(item, margin + 12, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    doc.text('Ce dossier repond aux criteres d\'eligibilite aux aides a la renovation energetique.', margin, yPos);
    
    const capitalSecurise = dossier.montantEconomies + dossier.montantSubventions;
    
    yPos += 15;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 40, 4, 4, 'FD');
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Capital Securise :', pageWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMontantFR(capitalSecurise), pageWidth / 2, yPos + 32, { align: 'center' });
    
    yPos += 55;
    
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth / 2 - 50, yPos, 100, 28, 4, 4, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIE PAR LA CELLULE', pageWidth / 2, yPos + 12, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const validiteStr = dateValidite.toLocaleDateString('fr-FR');
    doc.text(`Valide jusqu'au ${validiteStr}`, pageWidth / 2, yPos + 22, { align: 'center' });
    
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Certification issue du Systeme d\'Audit de Conformite Algorithmique',
      pageWidth / 2, 
      pageHeight - 25, 
      { align: 'center' }
    );
    doc.text(
      'Cellule d\'Expertise CAPITAL ENERGIE - Validation technique par un professionnel RGE requise.',
      pageWidth / 2, 
      pageHeight - 18, 
      { align: 'center' }
    );
    
    doc.save(`Attestation_${dossier.nom.replace(/\s+/g, '_')}.pdf`);
    
    setIsGenerating(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">
              Attestation generee !
            </h3>
            <p className="text-slate-400 text-sm">Telechargement en cours...</p>
          </div>
        ) : isGenerating ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Award className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              Generation en cours...
            </h3>
            <p className="text-slate-400 text-sm">
              Generation de votre certificat par la Cellule d'Expertise
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Attestation de Conformite
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{dossier.nom}</p>
                  <p className="text-emerald-400 text-sm">Dossier 100% complet</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Capital Securise</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(dossier.montantEconomies + dossier.montantSubventions)} €
                </p>
              </div>
            </div>

            <button
              onClick={generatePDF}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Telecharger l'Attestation PDF
            </button>
            
            <p className="text-slate-500 text-xs text-center mt-4">
              Cellule d'Expertise • Document officiel CAPITAL ENERGIE
            </p>
          </>
        )}
      </div>
    </div>
  );
}

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

function EspaceClientContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');
  const isModeMiroir = !!clientId;
  
  const clientInfo = clientId ? CLIENTS_DATA[clientId] : null;
  
  const initialDossiers = useMemo(() => {
    if (clientId) {
      return ALL_DOSSIERS.filter(d => d.clientId === clientId);
    }
    return DEFAULT_DOSSIERS;
  }, [clientId]);
  
  const [dossiers, setDossiers] = useState<Dossier[]>(initialDossiers);
  
  useEffect(() => {
    setDossiers(initialDossiers);
  }, [initialDossiers]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [attestationDossier, setAttestationDossier] = useState<Dossier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDossierComplet = (dossier: Dossier) => {
    const sante = calculerSanteAdministrative(dossier.documents);
    return sante.pourcentage === 100;
  };

  const dossiersValides = dossiers.filter(d => d.status === 'valide' || d.status === 'certification');
  const capitalSecurise = dossiersValides.reduce(
    (sum, d) => sum + d.montantEconomies + d.montantSubventions, 
    0
  );
  const animatedCapital = useCountAnimation(capitalSecurise, 2500);

  const handleDocumentDepose = (dossierId: string, docKey: DocumentType) => {
    setDossiers(prev => prev.map(d => {
      if (d.id === dossierId) {
        return {
          ...d,
          documents: { ...d.documents, [docKey]: true }
        };
      }
      return d;
    }));
  };

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
      clientId: clientId || 'default',
      documents: { devis: true, note_technique: false, attestation_honneur: false, photo_avant: false, photo_apres: false },
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
      {/* Bannière Mode Consultation (patron uniquement) */}
      {/* Modal Attestation de Conformité */}
      {attestationDossier && (
        <AttestationModal
          isOpen={true}
          onClose={() => setAttestationDossier(null)}
          dossier={attestationDossier}
        />
      )}

      {isModeMiroir && clientInfo && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 border-b border-amber-500">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                ⚠️ Mode Consultation : Vous visualisez l'espace de <strong>{clientInfo.nom}</strong>
              </span>
            </div>
            <Link
              href="/entreprises"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">CAPITAL ÉNERGIE</h1>
              <p className="text-slate-500 text-xs">
                {isModeMiroir && clientInfo ? `Espace de ${clientInfo.nom}` : 'Espace Partenaire'}
              </p>
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
                        
                        {/* Barre de Santé Administrative */}
                        <BarreSanteAdministrative 
                          documents={dossier.documents} 
                          dossierNom={dossier.nom}
                          onDocumentDepose={(docKey) => handleDocumentDepose(dossier.id, docKey)}
                        />
                        
                        {/* Bouton Télécharger Attestation - visible uniquement si 100% complet */}
                        {isDossierComplet(dossier) && (
                          <button
                            onClick={() => setAttestationDossier(dossier)}
                            className="mt-3 w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-medium rounded-lg transition-all flex items-center justify-center gap-2 group"
                          >
                            <Award className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>📄 Télécharger l'Attestation</span>
                          </button>
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

export default function EspaceClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l'espace client...</p>
        </div>
      </div>
    }>
      <EspaceClientContent />
    </Suspense>
  );
}
