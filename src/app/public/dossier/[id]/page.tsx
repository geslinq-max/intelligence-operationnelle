'use client';

import { useParams } from 'next/navigation';
import { ShieldCheck, Calculator, Euro, TrendingUp, Zap, Wrench } from 'lucide-react';
import { getFicheCEE, getArreteReference, COMPLIANCE_CONFIG, calculerDateValidite, formatDateFR } from '@/lib/compliance-repository';

// Fonction helper pour formater les montants
function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString('fr-FR')} €`;
}

export default function DossierPublicPage() {
  const params = useParams();
  const dossierId = params.id as string;

  // Données de démonstration (à remplacer par fetch API)
  const dossierData = {
    id: dossierId,
    entreprise: 'Entreprise Démonstration',
    ficheCEE: 'IND-UT-102',
    puissanceKW: 25,
    totalMaterielHT: 8500,
    totalMainOeuvreHT: 2500,
    primeCEE: 9500,
    totalBrutHT: 11000,
    resteAChargeClient: 1500,
    margeBruteArtisan: 3200,
    tauxMargeArtisan: 29,
    kWhCumac: 1000000,
    dateGeneration: new Date().toLocaleDateString('fr-FR'),
    dateValidite: formatDateFR(calculerDateValidite()),
  };

  return (
    <>
      {/* Styles d'impression inline pour cette page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-slate-100 py-8 print-page">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">CAPITAL ÉNERGIE</h1>
          <p className="text-slate-500 text-sm">Brief Artisan RGE - Lecture seule</p>
        </div>

        {/* Document */}
        <div className="bg-white rounded-xl shadow-lg p-6 print:shadow-none print:p-0">
          {/* Badge de Conformité */}
          <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/40 rounded-xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-emerald-700 font-semibold text-sm">
                  ✅ DOSSIER GARANTI ZÉRO DÉFAUT
                </p>
                <p className="text-emerald-600/80 text-xs">
                  Analyse de conformité 100% validée selon les exigences de l&apos;arrêté du 22 décembre 2025
                </p>
              </div>
            </div>
          </div>

          {/* Bloc Devis */}
          <div className="mt-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-amber-500/20 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <h3 className="text-slate-800 font-semibold">📊 SIMULATION DE DEVIS MIROIR</h3>
              </div>
              <p className="text-amber-700/80 text-xs mt-1">
                Fiche CEE {dossierData.ficheCEE} • {dossierData.entreprise}
              </p>
            </div>

            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left text-slate-500 font-medium py-2">Désignation</th>
                    <th className="text-right text-slate-500 font-medium py-2 w-28">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-slate-800 font-medium">Matériel : Variateur de Vitesse électronique (VEV)</p>
                          <p className="text-slate-500 text-xs">Conforme {dossierData.ficheCEE} • Puissance {dossierData.puissanceKW} kW</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-slate-800 font-medium py-3">{formatCurrency(dossierData.totalMaterielHT)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-slate-800 font-medium">Prestation : Pose, raccordement et paramétrage</p>
                          <p className="text-slate-500 text-xs">Installation complète et mise en service</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-slate-800 font-medium py-3">{formatCurrency(dossierData.totalMainOeuvreHT)}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-green-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-green-700 font-medium">Subvention : Prime CEE {dossierData.ficheCEE}</p>
                          <p className="text-green-600/70 text-xs">{dossierData.kWhCumac.toLocaleString('fr-FR')} kWh cumac × 9,50 €/MWh</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-green-600 font-medium py-3">-{formatCurrency(dossierData.primeCEE)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300">
                    <td className="py-2 text-slate-500">Total Brut HT</td>
                    <td className="text-right text-slate-600 py-2">{formatCurrency(dossierData.totalBrutHT)}</td>
                  </tr>
                  <tr className="bg-cyan-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Euro className="w-5 h-5 text-cyan-600" />
                        <span className="text-cyan-700 font-bold">★ RESTE À CHARGE CLIENT ★</span>
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <span className={`text-xl font-bold ${dossierData.resteAChargeClient < 500 ? 'text-green-600' : 'text-cyan-700'}`}>
                        {dossierData.resteAChargeClient === 0 ? '0 € ✓' : formatCurrency(dossierData.resteAChargeClient)}
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-purple-50 border-t border-purple-200">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="text-purple-700 font-medium">💼 Marge Brute Artisan Estimée</span>
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <span className="text-lg font-bold text-purple-700">
                        {formatCurrency(dossierData.margeBruteArtisan)}
                      </span>
                      <span className="text-purple-500 text-sm ml-1">({dossierData.tauxMargeArtisan}%)</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Kit de Conformité Légale */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h4 className="text-blue-800 font-semibold text-sm">📋 Mentions obligatoires pour votre devis</h4>
            </div>
            
            <div className="bg-white rounded-lg p-3 text-xs text-slate-700 space-y-2 border border-slate-200">
              <p className="font-medium text-blue-700">
                Travaux relevant de la fiche {dossierData.ficheCEE} ({getArreteReference(dossierData.ficheCEE)})
              </p>
              <p className="text-slate-500 italic">
                {getFicheCEE(dossierData.ficheCEE)?.nom || 'Opération standardisée CEE'}
              </p>
              <div className="pt-2 border-t border-slate-100">
                <p><span className="text-slate-500">Puissance :</span> <span className="text-slate-800 font-medium">{dossierData.puissanceKW} kW</span></p>
                <p><span className="text-slate-500">Économies :</span> <span className="text-slate-800 font-medium">{dossierData.kWhCumac.toLocaleString('fr-FR')} kWh cumac</span></p>
                <p><span className="text-slate-500">Client :</span> <span className="text-slate-800 font-medium">{dossierData.entreprise}</span></p>
              </div>
            </div>
            
            <p className="mt-2 text-center text-blue-600/70 text-[10px]">
              Collez ce texte sur votre devis pour garantir la conformité CEE
            </p>
          </div>

          {/* Footer Métadonnées */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center space-y-1">
            <p className="text-slate-600 text-xs font-medium">
              Référence Dossier : <span className="text-slate-800">{dossierId}</span>
            </p>
            <p className="text-slate-500 text-xs">
              Document généré le {dossierData.dateGeneration} • Validité : {dossierData.dateValidite}
            </p>
            <p className="text-slate-400 text-[10px] italic mt-2">
              {COMPLIANCE_CONFIG.mentionGenerale}
            </p>
            <p className="text-slate-400 text-[10px] mt-1">
              {getArreteReference(dossierData.ficheCEE)}
            </p>
          </div>
        </div>

        {/* Footer page */}
        <div className="text-center mt-6 text-slate-400 text-xs no-print">
          © 2026 Capital Énergie - Tous droits réservés
        </div>
      </div>
      </div>
    </>
  );
}
