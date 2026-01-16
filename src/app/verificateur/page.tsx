'use client';

import { useState, useCallback, useRef } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Zap,
  Shield,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Building2,
  MapPin,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { processAndValidateQuote, type ValidationReport, type ExtractionResult } from '@/lib/agents/cee-validator';
import { downloadConformityPack } from '@/lib/agents/cee-document-generator';

type AnalysisState = 'idle' | 'uploading' | 'extracting' | 'validating' | 'complete' | 'error';

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

function formatCurrency(value: number): string {
  return `${formatNumber(value)} €`;
}

export default function VerificateurPage() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAnalysis = useCallback(() => {
    setAnalysisState('idle');
    setSelectedFile(null);
    setExtraction(null);
    setValidation(null);
    setError(null);
    setShowFullReport(false);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez PNG, JPG ou PDF.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setAnalysisState('uploading');

    try {
      // Simulation d'upload
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisState('extracting');

      // Lancement du pipeline Validation + Certification
      const result = await processAndValidateQuote(file);
      
      setExtraction(result.extraction);
      setValidation(result.validation);
      setAnalysisState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
      setAnalysisState('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const getVerdictDisplay = () => {
    if (!validation) return null;
    
    switch (validation.statut) {
      case 'VALIDE':
        return {
          icon: <CheckCircle2 className="w-8 h-8" />,
          label: 'VALIDE',
          color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
          bgGlow: 'shadow-emerald-500/20',
        };
      case 'ALERTE_DISCORDANCE':
        return {
          icon: <AlertTriangle className="w-8 h-8" />,
          label: 'ALERTE DISCORDANCE',
          color: 'bg-red-500/20 border-red-500/50 text-red-400',
          bgGlow: 'shadow-red-500/20',
        };
      case 'VERIFICATION_MANUELLE_REQUISE':
        return {
          icon: <AlertCircle className="w-8 h-8" />,
          label: 'VÉRIFICATION REQUISE',
          color: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
          bgGlow: 'shadow-amber-500/20',
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-400';
    if (confidence >= 0.8) return 'text-cyan-400';
    if (confidence >= 0.7) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDE':
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">Validé</span>;
      case 'A_VERIFIER_MANUELLEMENT':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">À vérifier</span>;
      case 'NON_TROUVE':
        return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded">Non trouvé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Vérificateur de Dossiers</h1>
              <p className="text-slate-400 mt-1 text-sm lg:text-base">
                Analyse IA des devis avec Validation Algorithmique et Certification de Conformité
              </p>
            </div>
            {analysisState === 'complete' && (
              <button
                onClick={resetAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nouvelle analyse
              </button>
            )}
          </div>
        </header>

        {/* Zone de Dépôt (état idle) */}
        {analysisState === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-6 sm:p-8 lg:p-12 text-center cursor-pointer
              transition-all duration-300
              ${isDragOver 
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]' 
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
            
            <div className={`
              w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center
              ${isDragOver ? 'bg-cyan-500/20' : 'bg-slate-700/50'}
              transition-colors
            `}>
              <Upload className={`w-10 h-10 ${isDragOver ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              Déposez votre devis ici
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
            
            {/* Pipeline indicator */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-slate-500 text-sm mb-3">Pipeline d'analyse</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Validation Algorithmique</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Certification de Conformité</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* États de chargement */}
        {(analysisState === 'uploading' || analysisState === 'extracting' || analysisState === 'validating') && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sm:p-8 lg:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {analysisState === 'uploading' && 'Chargement du document...'}
              {analysisState === 'extracting' && 'Validation Algorithmique en cours...'}
              {analysisState === 'validating' && 'Certification de Conformité en cours...'}
            </h3>
            
            {selectedFile && (
              <p className="text-slate-400 mb-6">{selectedFile.name}</p>
            )}
            
            {/* Progress steps */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8">
              <div className={`flex items-center gap-2 ${analysisState === 'uploading' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {analysisState === 'uploading' ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span className="text-sm">Upload</span>
              </div>
              <div className={`w-8 h-0.5 ${analysisState !== 'uploading' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <div className={`flex items-center gap-2 ${
                analysisState === 'extracting' ? 'text-cyan-400' : 
                analysisState === 'validating' ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {analysisState === 'extracting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : analysisState === 'validating' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                <span className="text-sm">Validation</span>
              </div>
              <div className={`w-8 h-0.5 ${analysisState === 'validating' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <div className={`flex items-center gap-2 ${analysisState === 'validating' ? 'text-cyan-400' : 'text-slate-500'}`}>
                {analysisState === 'validating' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                <span className="text-sm">Certification</span>
              </div>
            </div>
          </div>
        )}

        {/* État d'erreur */}
        {analysisState === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-400 mb-2">Erreur d'analyse</h3>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={resetAnalysis}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Résultats complets */}
        {analysisState === 'complete' && extraction && validation && (
          <div className="space-y-6">
            {/* Verdict Badge */}
            {(() => {
              const verdict = getVerdictDisplay();
              if (!verdict) return null;
              return (
                <div className={`
                  flex items-center justify-center gap-4 p-6 rounded-2xl border-2
                  ${verdict.color} shadow-lg ${verdict.bgGlow}
                `}>
                  {verdict.icon}
                  <span className="text-2xl font-bold">{verdict.label}</span>
                  <span className="text-sm opacity-70 ml-4">
                    Confiance globale : {(extraction.confidence_globale * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })()}

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Données techniques extraites */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Données Techniques (Validation Algorithmique)</h3>
                </div>

                <div className="space-y-4">
                  {/* Puissance */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-slate-400 text-sm">Puissance nominale</p>
                      <p className="text-2xl font-bold text-white">
                        {extraction.puissance_nominale_kw.value ?? '—'} kW
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(extraction.puissance_nominale_kw.status)}
                      <p className={`text-sm mt-1 ${getConfidenceColor(extraction.puissance_nominale_kw.confidence)}`}>
                        {(extraction.puissance_nominale_kw.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Type moteur */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-slate-400 text-sm">Type moteur</p>
                      <p className="text-xl font-semibold text-white">
                        {extraction.type_moteur.value ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(extraction.type_moteur.status)}
                      <p className={`text-sm mt-1 ${getConfidenceColor(extraction.type_moteur.confidence)}`}>
                        {(extraction.type_moteur.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Variateur */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-slate-400 text-sm">Variateur de vitesse</p>
                      <p className="text-xl font-semibold text-white">
                        {extraction.presence_variateur.value === true ? 'Oui' : 
                         extraction.presence_variateur.value === false ? 'Non' : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(extraction.presence_variateur.status)}
                      <p className={`text-sm mt-1 ${getConfidenceColor(extraction.presence_variateur.confidence)}`}>
                        {(extraction.presence_variateur.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calcul CEE */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Calcul CEE (Certification de Conformité)</h3>
                </div>

                {extraction.calcul_cee && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-400 text-sm mb-1">Fiche de référence</p>
                      <p className="text-xl font-bold text-white">{extraction.calcul_cee.fiche_reference}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <p className="text-slate-400 text-sm">kWh cumac</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {formatNumber(extraction.calcul_cee.kwh_cumac)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Prime estimée</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {formatCurrency(extraction.calcul_cee.prime_estimee_euros)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/30 rounded-lg">
                      <p className="text-slate-500 text-xs font-mono">
                        {extraction.calcul_cee.detail_calcul}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vérification calcul Certification */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">Certification croisée</p>
                  <div className="flex items-center gap-2">
                    {validation.verification_calcul.concordance_prime ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">Calcul vérifié et concordant</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 text-sm">
                          Écart détecté : {validation.verification_calcul.ecart_prime_euros} €
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Coordonnées client */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Building2 className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-white">Client</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-white">{extraction.coordonnees_client.nom.value ?? '—'}</p>
                      {getStatusBadge(extraction.coordonnees_client.nom.status)}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-white">
                        {extraction.coordonnees_client.adresse.value ?? '—'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {extraction.coordonnees_client.code_postal.value} {extraction.coordonnees_client.ville.value}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SIRET Artisan */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Artisan RGE</h3>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
                  <p className="text-slate-400 text-sm">SIRET</p>
                  <p className="text-xl font-mono text-white">
                    {extraction.siret_artisan.value ?? '—'}
                  </p>
                  {getStatusBadge(extraction.siret_artisan.status)}
                </div>

                {validation.verification_siret && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Format valide</span>
                      {validation.verification_siret.valide_format ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Entreprise trouvée</span>
                      {validation.verification_siret.entreprise_trouvee ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    {validation.verification_siret.raison_sociale && (
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-slate-500">Raison sociale</p>
                        <p className="text-white">{validation.verification_siret.raison_sociale}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Qualification RGE</span>
                      {validation.verification_siret.qualification_rge ? (
                        <span className="text-emerald-400">✓ Qualifié</span>
                      ) : (
                        <span className="text-amber-400">⚠ Non vérifié</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Discordances détectées */}
            {validation.discordances.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400">
                    Discordances détectées ({validation.discordances.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {validation.discordances.map((d, i) => (
                    <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          d.gravite === 'CRITIQUE' ? 'bg-red-500/30 text-red-300' :
                          d.gravite === 'MAJEURE' ? 'bg-orange-500/30 text-orange-300' :
                          'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {d.gravite}
                        </span>
                        <span className="text-white font-medium">{d.champ}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{d.description}</p>
                      {d.ecart && (
                        <p className="text-slate-400 text-xs mt-1">Écart : {d.ecart}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rapport d'audit complet */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFullReport(!showFullReport)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="text-white font-medium">Rapport d'audit complet</span>
                </div>
                {showFullReport ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {showFullReport && (
                <div className="p-4 border-t border-slate-700">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                    {validation.rapport_audit}
                  </pre>
                  <p className="text-slate-500 text-xs mt-3">
                    Durée de validation : {validation.duree_validation_ms} ms
                  </p>
                </div>
              )}
            </div>

            {/* Bouton Générer Pack Conformité */}
            <div className="flex justify-center pt-4">
              <button
                disabled={validation.statut !== 'VALIDE' || isGenerating}
                onClick={async () => {
                  if (validation.statut !== 'VALIDE' || !extraction) return;
                  setIsGenerating(true);
                  try {
                    await downloadConformityPack({ extraction, validation });
                  } catch {
                    // Erreur silencieuse - le téléchargement a échoué
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className={`
                  flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg
                  transition-all duration-300
                  ${validation.statut === 'VALIDE' && !isGenerating
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <FileCheck className="w-6 h-6" />
                )}
                {isGenerating ? 'Génération en cours...' : 'Générer le Pack Conformité'}
              </button>
            </div>
            
            {validation.statut !== 'VALIDE' && (
              <p className="text-center text-slate-500 text-sm">
                Le pack conformité ne peut être généré que si le verdict est VALIDE.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Vérificateur IA - Validation & Certification</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
