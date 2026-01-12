'use client';

import { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { NoteSyntheseTechnique, EligibiliteMathematique } from '@/lib/technical/noteSynthese';

interface NoteSyntheseCardProps {
  note: NoteSyntheseTechnique;
  onExportPDF?: () => void;
}

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

function formatCurrency(value: number): string {
  return `${formatNumber(value)} €`;
}

function ScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'text-green-400 bg-green-500/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getColor()}`}>
      <span className="text-lg font-bold">{score}</span>
      <span className="text-sm opacity-80">/100</span>
    </div>
  );
}

function EligibiliteBlock({ eligibilite }: { eligibilite: EligibiliteMathematique }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Éligibilité Mathématique</h3>
            <p className="text-slate-400 text-sm">Analyse du gisement technique</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreGauge score={eligibilite.scoreEligibilite} />
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Ratio de perte réactive */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-sm">Ratio de perte réactive</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {eligibilite.ratioPerteReactive}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Énergie réactive / Consommation totale
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">Gisement technique</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatNumber(eligibilite.gisementTechnique)} kWh/an
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Économies d'énergie récupérables
              </p>
            </div>
          </div>

          {/* Facteur de puissance */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Facteur de puissance (cos φ)</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Actuel</span>
                  <span className={`font-medium ${
                    eligibilite.facteurPuissanceCalcule < 0.85 
                      ? 'text-red-400' 
                      : eligibilite.facteurPuissanceCalcule < 0.92 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                  }`}>
                    {eligibilite.facteurPuissanceCalcule}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      eligibilite.facteurPuissanceCalcule < 0.85 
                        ? 'bg-red-500' 
                        : eligibilite.facteurPuissanceCalcule < 0.92 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${eligibilite.facteurPuissanceCalcule * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center px-3">
                <span className="text-slate-500 text-xs">→</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Cible</span>
                  <span className="text-cyan-400 font-medium">
                    {eligibilite.facteurPuissanceCible}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${eligibilite.facteurPuissanceCible * 100}%` }}
                  />
                </div>
              </div>
            </div>
            {eligibilite.puissanceReactiveACompenser > 0 && (
              <p className="text-sm text-slate-400 mt-3">
                <span className="text-cyan-400 font-medium">
                  {eligibilite.puissanceReactiveACompenser} kVAR
                </span>
                {' '}de compensation nécessaire pour atteindre la cible
              </p>
            )}
          </div>

          {/* Justification technique */}
          <div className={`rounded-lg p-4 ${
            eligibilite.eligible 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {eligibilite.eligible ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${
                  eligibilite.eligible ? 'text-green-400' : 'text-red-400'
                }`}>
                  {eligibilite.eligible 
                    ? 'Éligible aux dispositifs CEE' 
                    : 'Non éligible aux dispositifs CEE'}
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  {eligibilite.justification}
                </p>
              </div>
            </div>
          </div>

          {/* Économies potentielles */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Économies potentielles</span>
              <span className="text-2xl font-bold text-cyan-400">
                {formatCurrency(eligibilite.economiesPotentielles)}/an
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NoteSyntheseCard({ note, onExportPDF }: NoteSyntheseCardProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Note de Synthèse Technique</h2>
          <p className="text-slate-400 text-sm">
            {note.entreprise} • {note.secteur}
          </p>
        </div>
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Exporter PDF
          </button>
        )}
      </div>

      {/* Bloc 1: Éligibilité Mathématique */}
      <EligibiliteBlock eligibilite={note.eligibiliteMathematique} />

      {/* Bloc 2: Diagnostic Technique */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          Diagnostic Technique
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Équipements analysés */}
          <div>
            <h4 className="text-slate-400 text-sm mb-2">Équipements analysés</h4>
            <ul className="space-y-1">
              {note.diagnosticTechnique.equipementsAnalyses.map((eq, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  {eq}
                </li>
              ))}
            </ul>
          </div>

          {/* Points faibles */}
          <div>
            <h4 className="text-slate-400 text-sm mb-2">Points faibles détectés</h4>
            {note.diagnosticTechnique.pointsFaibles.length > 0 ? (
              <ul className="space-y-1">
                {note.diagnosticTechnique.pointsFaibles.map((pf, i) => (
                  <li key={i} className="text-orange-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {pf}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">Aucun point critique détecté</p>
            )}
          </div>
        </div>

        {/* Recommandations */}
        <div>
          <h4 className="text-slate-400 text-sm mb-2">Recommandations</h4>
          <ul className="space-y-2">
            {note.diagnosticTechnique.recommandations.map((rec, i) => (
              <li key={i} className="text-green-400 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bloc 3: Fiche CEE applicable */}
      {note.ficheCEE && (
        <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-400" />
            </div>
            Fiche CEE Applicable
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-xs">Code</p>
              <p className="text-white font-mono font-bold">{note.ficheCEE.code}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Opération</p>
              <p className="text-white text-sm">{note.ficheCEE.nom}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Montant estimé</p>
              <p className="text-green-400 font-bold">
                {formatCurrency(note.ficheCEE.montantEstime)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
