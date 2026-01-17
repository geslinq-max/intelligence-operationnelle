'use client';

import { useState, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Scale,
  MapPin,
  Truck,
  FileWarning,
  Sparkles
} from 'lucide-react';
import { processWasteTicket, WasteTicketExtractionResult, requiresBSDD } from '@/lib/agents/waste-ticket-extractor';
import { BSDFormData } from './BSDExpressForm';

interface WasteTicketScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: Partial<BSDFormData>) => void;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'dangerous' | 'error';

export default function WasteTicketScanner({ 
  isOpen, 
  onClose, 
  onDataExtracted 
}: WasteTicketScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [extractedData, setExtractedData] = useState<WasteTicketExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus('scanning');
    setError(null);
    setExtractedData(null);

    try {
      const result = await processWasteTicket(file);
      setExtractedData(result);

      if (result.is_dangerous) {
        setStatus('dangerous');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
      setStatus('error');
    }
  }, []);

  const handleApplyData = useCallback(() => {
    if (!extractedData) return;

    // Mapper les données extraites vers le format BSDFormData
    const mappedData: Partial<BSDFormData> = {};

    // Tonnage
    if (extractedData.poids_tonnes.value) {
      mappedData.tonnageEstime = extractedData.poids_tonnes.value;
    }

    // Type de déchet
    if (extractedData.type_dechet.value) {
      mappedData.typeDechet = extractedData.type_dechet.value;
    }

    // Code déchet
    if (extractedData.code_dechet.value) {
      mappedData.codeDechet = extractedData.code_dechet.value;
    }

    // Destination
    if (extractedData.destination_nom.value) {
      mappedData.destinationNom = extractedData.destination_nom.value;
    }
    if (extractedData.destination_adresse.value) {
      mappedData.destinationAdresse = extractedData.destination_adresse.value;
    }
    if (extractedData.destination_type.value) {
      mappedData.destinationType = extractedData.destination_type.value;
    }

    // Transporteur
    if (extractedData.transporteur_nom.value) {
      mappedData.transporteurNom = extractedData.transporteur_nom.value;
    }
    if (extractedData.immatriculation.value) {
      mappedData.immatriculationVehicule = extractedData.immatriculation.value;
    }

    // Date
    if (extractedData.date_pesee.value) {
      mappedData.dateEnlevement = extractedData.date_pesee.value;
    }

    onDataExtracted(mappedData);
    handleReset();
    onClose();
  }, [extractedData, onDataExtracted, onClose]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setExtractedData(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Camera className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scanner Flash</h2>
              <p className="text-xs text-slate-400">Ticket de pesée → BSD</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* État: Idle - Zone d'upload */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 border border-slate-600 border-dashed rounded-xl p-6 text-center">
                <div className="space-y-4">
                  {/* Bouton Photo (prioritaire mobile) */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium cursor-pointer transition-all active:scale-[0.98]">
                      <Camera className="w-6 h-6" />
                      <span className="text-lg">Prendre une photo</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-600" />
                    <span className="text-slate-500 text-sm">ou</span>
                    <div className="flex-1 h-px bg-slate-600" />
                  </div>

                  {/* Bouton Fichier */}
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium cursor-pointer transition-all border border-slate-600">
                      <Upload className="w-5 h-5" />
                      <span>Choisir un fichier</span>
                    </div>
                  </label>
                </div>

                <p className="text-slate-500 text-xs mt-4">
                  PDF, PNG, JPG • Max 10 Mo
                </p>
              </div>

              {/* Info IA */}
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium">Extraction IA automatique</p>
                  <p className="text-slate-400 mt-1">
                    Le scanner détecte automatiquement le poids, le type de déchet et la destination 
                    pour pré-remplir votre BSD.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* État: Scanning */}
          {status === 'scanning' && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Analyse en cours...</p>
              <p className="text-slate-400 text-sm mt-1">
                Extraction des données du ticket
              </p>
            </div>
          )}

          {/* État: Success - Données extraites */}
          {status === 'success' && extractedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium">Extraction réussie</p>
                  <p className="text-slate-400 text-xs">
                    Confiance globale : {Math.round(extractedData.confidence_globale * 100)}%
                  </p>
                </div>
              </div>

              {/* Données extraites */}
              <div className="space-y-3">
                {/* Poids */}
                {extractedData.poids_tonnes.value && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <Scale className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs">Tonnage</p>
                      <p className="text-white font-bold text-lg">
                        {extractedData.poids_tonnes.value} T
                      </p>
                    </div>
                    <ConfidenceBadge confidence={extractedData.poids_tonnes.confidence} />
                  </div>
                )}

                {/* Type de déchet */}
                {extractedData.type_dechet.value && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <div className="w-5 h-5 text-amber-400">🗑️</div>
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs">Type de déchet</p>
                      <p className="text-white font-medium">
                        {extractedData.type_dechet.value}
                        {extractedData.code_dechet.value && (
                          <span className="text-slate-400 text-sm ml-2">
                            ({extractedData.code_dechet.value})
                          </span>
                        )}
                      </p>
                    </div>
                    <ConfidenceBadge confidence={extractedData.type_dechet.confidence} />
                  </div>
                )}

                {/* Destination */}
                {extractedData.destination_nom.value && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <MapPin className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs">Destination</p>
                      <p className="text-white font-medium">
                        {extractedData.destination_nom.value}
                      </p>
                      {extractedData.destination_adresse.value && (
                        <p className="text-slate-400 text-xs">
                          {extractedData.destination_adresse.value}
                        </p>
                      )}
                    </div>
                    <ConfidenceBadge confidence={extractedData.destination_nom.confidence} />
                  </div>
                )}

                {/* Transporteur */}
                {extractedData.transporteur_nom.value && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <Truck className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs">Transporteur</p>
                      <p className="text-white font-medium">
                        {extractedData.transporteur_nom.value}
                        {extractedData.immatriculation.value && (
                          <span className="text-slate-400 text-sm ml-2">
                            ({extractedData.immatriculation.value})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Champs à vérifier */}
              {extractedData.champs_a_verifier.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Champs à vérifier manuellement
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {extractedData.champs_a_verifier.join(', ')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Recommencer
                </button>
                <button
                  onClick={handleApplyData}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Appliquer
                </button>
              </div>
            </div>
          )}

          {/* État: Dangerous - Déchet dangereux détecté */}
          {status === 'dangerous' && extractedData && (
            <div className="space-y-4">
              {/* Alerte BSDD */}
              <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-xl">
                <div className="flex items-start gap-3">
                  <FileWarning className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-bold text-lg">
                      ⚠️ DÉCHET DANGEREUX DÉTECTÉ
                    </p>
                    <p className="text-white mt-2">
                      {extractedData.dangerous_alert}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations détectées */}
              <div className="p-4 bg-slate-700/50 rounded-xl">
                <p className="text-slate-300 text-sm font-medium mb-3">
                  Informations détectées :
                </p>
                <div className="space-y-2 text-sm">
                  {extractedData.poids_tonnes.value && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Poids :</span>
                      <span className="text-white">{extractedData.poids_tonnes.value} T</span>
                    </div>
                  )}
                  {extractedData.type_dechet.raw_text && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Description :</span>
                      <span className="text-red-400">{extractedData.type_dechet.raw_text}</span>
                    </div>
                  )}
                  {extractedData.destination_nom.value && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination :</span>
                      <span className="text-white">{extractedData.destination_nom.value}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message d'action */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-400 text-sm">
                  <strong>Action requise :</strong> Utilisez le formulaire BSDD (Bordereau de Suivi 
                  des Déchets Dangereux) pour ce type de déchet. Le BSD Express ne convient pas 
                  pour les déchets dangereux.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
                >
                  Scanner autre ticket
                </button>
              </div>
            </div>
          )}

          {/* État: Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 font-medium">Erreur d'analyse</p>
                <p className="text-slate-400 text-sm mt-1">{error}</p>
              </div>

              <button
                onClick={handleReset}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant Badge de confiance
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const color = percent >= 90 ? 'text-emerald-400' : percent >= 75 ? 'text-amber-400' : 'text-red-400';
  
  return (
    <span className={`text-xs font-medium ${color}`}>
      {percent}%
    </span>
  );
}
