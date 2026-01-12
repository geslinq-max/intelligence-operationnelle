'use client';

import { useState, useCallback } from 'react';
import { 
  Copy, 
  Check, 
  Calculator, 
  Euro, 
  Zap,
  TrendingUp,
  FileText,
  Wrench
} from 'lucide-react';
import { 
  genererDevisMiroir, 
  formaterDevisTexte,
  type DevisMiroir,
  type DonneesAudit
} from '@/lib/devis/devisMiroir';

interface DevisMiroirCardProps {
  entreprise: string;
  donnees?: DonneesAudit;
  onGenerate?: (devis: DevisMiroir) => void;
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString('fr-FR')} €`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

export default function DevisMiroirCard({ 
  entreprise, 
  donnees: initialDonnees,
  onGenerate 
}: DevisMiroirCardProps) {
  const [donnees, setDonnees] = useState<DonneesAudit>(initialDonnees || {
    puissanceKW: 22,
    heuresFonctionnement: 3500,
    nombreMoteurs: 1,
  });
  
  const [devis, setDevis] = useState<DevisMiroir | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCalcul, setShowCalcul] = useState(false);

  const handleGenerate = useCallback(() => {
    const newDevis = genererDevisMiroir(donnees);
    setDevis(newDevis);
    onGenerate?.(newDevis);
  }, [donnees, onGenerate]);

  const handleCopy = useCallback(async () => {
    if (!devis) return;
    
    const texte = formaterDevisTexte(devis, entreprise);
    
    try {
      await navigator.clipboard.writeText(texte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  }, [devis, entreprise]);

  const updateDonnees = (key: keyof DonneesAudit, value: number) => {
    setDonnees(prev => ({ ...prev, [key]: value }));
    setDevis(null);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Simulation de Devis Miroir</h3>
            <p className="text-amber-400/80 text-sm">Copier-Coller • IND-UT-102</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Puissance (kW)</label>
            <input
              type="number"
              value={donnees.puissanceKW}
              onChange={(e) => updateDonnees('puissanceKW', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
              min={1}
              step={0.5}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Heures/an</label>
            <input
              type="number"
              value={donnees.heuresFonctionnement}
              onChange={(e) => updateDonnees('heuresFonctionnement', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
              min={500}
              step={100}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">Nb moteurs</label>
            <input
              type="number"
              value={donnees.nombreMoteurs || 1}
              onChange={(e) => updateDonnees('nombreMoteurs', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
              min={1}
              max={10}
            />
          </div>
        </div>

        {/* Generate Button */}
        {!devis && (
          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Générer la simulation
          </button>
        )}

        {/* Devis Results */}
        {devis && (
          <div className="space-y-4">
            {/* Table */}
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="text-left text-slate-400 font-medium px-3 py-2">Désignation</th>
                    <th className="text-center text-slate-400 font-medium px-2 py-2 w-12">Qté</th>
                    <th className="text-right text-slate-400 font-medium px-3 py-2 w-24">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {devis.lignes.map((ligne, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-t border-slate-700 ${
                        ligne.montantHT < 0 ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-white">
                        <div className="flex items-center gap-2">
                          {ligne.montantHT < 0 ? (
                            <Zap className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : idx === 0 ? (
                            <Wrench className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <span className="w-4" />
                          )}
                          <span className={ligne.montantHT < 0 ? 'text-green-400' : ''}>
                            {ligne.designation}
                          </span>
                        </div>
                      </td>
                      <td className="text-center text-slate-300 px-2 py-2">
                        {ligne.quantite}
                      </td>
                      <td className={`text-right px-3 py-2 font-medium ${
                        ligne.montantHT < 0 ? 'text-green-400' : 'text-white'
                      }`}>
                        {formatCurrency(ligne.montantHT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 bg-slate-800">
                    <td colSpan={2} className="px-3 py-2 text-slate-300">Total Brut HT</td>
                    <td className="text-right px-3 py-2 text-white font-medium">
                      {formatCurrency(devis.totalBrutHT)}
                    </td>
                  </tr>
                  <tr className="bg-green-500/10 border-t border-green-500/30">
                    <td colSpan={2} className="px-3 py-2 text-green-400">Déduction Prime CEE</td>
                    <td className="text-right px-3 py-2 text-green-400 font-medium">
                      {formatCurrency(-devis.deductionCEE)}
                    </td>
                  </tr>
                  <tr className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-t-2 border-cyan-500/50">
                    <td colSpan={2} className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Euro className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-400 font-bold">RESTE À CHARGE CLIENT</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3">
                      <span className={`text-xl font-bold ${
                        devis.resteAChargeClient === 0 
                          ? 'text-green-400' 
                          : devis.resteAChargeClient < 500 
                            ? 'text-cyan-400' 
                            : 'text-white'
                      }`}>
                        {devis.resteAChargeClient === 0 ? '0 € ✓' : formatCurrency(devis.resteAChargeClient)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Marge Artisan */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300">Marge Brute Artisan Estimée</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-400">
                    {formatCurrency(devis.margeBruteArtisan)}
                  </span>
                  <span className="text-purple-400/60 text-sm ml-2">
                    ({devis.tauxMargeArtisan}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Détail calcul CEE (expandable) */}
            <button
              onClick={() => setShowCalcul(!showCalcul)}
              className="w-full text-left text-sm text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {showCalcul ? 'Masquer' : 'Voir'} le détail du calcul CEE
            </button>
            
            {showCalcul && (
              <div className="bg-slate-900/50 rounded-lg p-3 text-sm space-y-2">
                <p className="text-slate-400">
                  <span className="text-slate-300 font-medium">Fiche CEE :</span> IND-UT-102
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-300 font-medium">Calcul :</span> {devis.detailCalculCEE}
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-300 font-medium">Prime :</span>{' '}
                  {formatNumber(devis.kWhCumac)} kWh cumac × 8,50 €/MWh = {formatCurrency(devis.primeCEE)}
                </p>
              </div>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Tableau copié !
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copier le tableau pour mon devis
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={() => setDevis(null)}
              className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Modifier les paramètres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
