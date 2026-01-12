'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components';
import { 
  BarChart3, 
  TrendingUp, 
  Euro, 
  Building2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Send,
  Hammer,
  BadgeCheck,
  Banknote,
  History,
  FileDown
} from 'lucide-react';

type DossierStatus = 'en_cours' | 'pret' | 'transmis' | 'facture' | 'paid';

// Signature de démonstration (base64 PNG simple)
const DEMO_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAALKADAAQAAAABAAAAZAAAAADGhQ7VAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoZXuEHAAADcElEQVR4Ae3csU0DMRSAYZ8oKOhYgQ1YgRFYgRVYgRHYgBUoKCg4fkd0kZCQItzZ7/f5pChKlMT+/HROci9XVwcHBwcHAQIEflfg+ncnO50AAQIErgRcYf0u4ukECBD4vYArrN+1PJ0AAQLXAq6wrvU8mQABAjcFXGHd1PIoAgQIXAu4wrrW82QCBAjcFHCFdVPLowgQIHAt4ArrWs+TCRAgcFNgd/PByw9+envv8kM8ngABAi8VcIX1UkHfT4AAgZsCrrBuanmUAAIEXiPw6ArrtRbwGAIECLxYwBXWi+l8IwECBC4FHl1hXX6xpwgQIEDgpsCjK6ybD/IoAgQIvFbg8OcPX/v9nueLv3z7r59+6ecb/+31TH/4sX77eH3T8d/X8Rj/XuC3K6y/P7mvIECAwNcC97/C+vqT/AQCBC4u8OcV1sUhHD4BAgTeL+AK6/2+fp8AgYsLuMK6+AA4fAIE3i/gCuv9vn6fAIGLC7jCuvgAOHwCBN4v4Arr/b5+nwCBiwu4wrr4ADh8AgTeL+AK6/2+fp8AgYsL3P0V1sXP3+ETIHC4wOH/FdbhInYkQODaAnf/CuvaZ+7oCRA4VsBfYR3r6dcIELi4wP0V1sUP3uETIHCYgCuswzz9FgECVxdwhXV1AY8nQOAwAVdYh3n6LQIEri7gCuvqAh5PgMBhAq6wDvP0WwQIXF3AFdbVBTyeAIHDBFxhHebptwgQuLqAK6yrC3g8AQIPC+xuPujTh1+47k+AwPUE7v8V1vXO2BETIHC4wL+usA4XsgMBAhcVuP8rrIueuMMmQOBwgV2Hw/0aAQIELirw7wrroof8aw7b+yzwazD8HAECLxNwhfUyP99NgACBvwUOc4X1t5JPIUDgaAJXWEeT+j0CBC4mcP9XWBc7Y4dLgMDhAq6wDif1iwQIXEzg/hfWxc7Y4RIgcLiAK6zDSf0iAQIXE3CFdbEB9+cePwoECPz/Av8CAAD//wMAy1MoRQAAAABJRU5ErkJggg==';

const entreprisesData = [
  {
    id: '1',
    raison_sociale: 'Métallurgie Dupont SARL',
    secteur: 'Métallurgie',
    ville: 'Lyon',
    economie: 12500,
    subventions: 8500,
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-102',
    cee_codes: ['IND-UT-102', 'IND-UT-117'],
    signed_at: '2026-01-05T14:30:00Z',
    signature_data: DEMO_SIGNATURE,
    transmitted: true,
    transmitted_at: '2026-01-10T09:30:00Z',
    paid: false,
    paid_at: null as string | null,
    co2_reduction: 4.2,
  },
  {
    id: '2',
    raison_sociale: 'Plasturgie Ouest',
    secteur: 'Plasturgie',
    ville: 'Nantes',
    economie: 8200,
    subventions: 5600,
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-116',
    cee_codes: ['IND-UT-116'],
    signed_at: null,
    signature_data: null as string | null,
    transmitted: false,
    transmitted_at: null,
    paid: false,
    paid_at: null as string | null,
    co2_reduction: 2.8,
  },
  {
    id: '3',
    raison_sociale: 'Fonderie Martin',
    secteur: 'Fonderie',
    ville: 'Marseille',
    economie: 22800,
    subventions: 15200,
    dossier_verifie: true,
    compliance_fiche: null,
    cee_codes: ['IND-UT-102', 'BAT-EQ-133'],
    signed_at: null,
    signature_data: null as string | null,
    transmitted: false,
    transmitted_at: null,
    paid: false,
    paid_at: null as string | null,
    co2_reduction: 6.5,
  },
  {
    id: '4',
    raison_sociale: 'Textiles Innovants SA',
    secteur: 'Textile',
    ville: 'Lille',
    economie: 0,
    subventions: 0,
    dossier_verifie: false,
    compliance_fiche: null,
    cee_codes: [],
    signed_at: null,
    signature_data: null as string | null,
    transmitted: false,
    transmitted_at: null,
    paid: false,
    paid_at: null as string | null,
    co2_reduction: 0,
  },
  {
    id: '5',
    raison_sociale: 'Agrotech Industries',
    secteur: 'Agroalimentaire',
    ville: 'Bordeaux',
    economie: 18500,
    subventions: 12000,
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-117',
    cee_codes: ['IND-UT-117'],
    signed_at: '2026-01-08T10:15:00Z',
    signature_data: DEMO_SIGNATURE,
    transmitted: false,
    transmitted_at: null,
    paid: false,
    paid_at: null as string | null,
    co2_reduction: 5.1,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMaturityInfo(e: typeof entreprisesData[0]) {
  let score = 0;
  if (e.cee_codes.length > 0) score += 35;
  if (e.compliance_fiche) score += 35;
  if (e.signed_at) score += 30;
  
  const percentage = score;
  const status = percentage === 100 ? 'ready' : percentage >= 70 ? 'qualified' : percentage > 30 ? 'in_progress' : 'incomplete';
  const barColor = percentage === 100 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-cyan-500' : percentage > 30 ? 'bg-orange-500' : 'bg-red-500';
  const statusColor = percentage === 100 ? 'text-emerald-400' : percentage >= 70 ? 'text-cyan-400' : percentage > 30 ? 'text-orange-400' : 'text-red-400';
  
  return { percentage, status, barColor, statusColor };
}

export default function GestionPage() {
  const [entreprises, setEntreprises] = useState(entreprisesData);
  
  const entreprisesWithMaturity = entreprises.map(e => ({
    ...e,
    maturity: getMaturityInfo(e),
  }));

  const qualifiedDossiers = entreprisesWithMaturity.filter(e => e.maturity.percentage >= 70);
  const totalPipeline = qualifiedDossiers.reduce((sum, e) => sum + e.economie + e.subventions, 0);
  const totalCommission = totalPipeline * 0.10;
  
  const readyToSend = entreprisesWithMaturity.filter(e => e.maturity.percentage === 100 && !e.transmitted);
  const inProgress = entreprisesWithMaturity.filter(e => e.maturity.percentage > 30 && e.maturity.percentage < 100);
  const incomplete = entreprisesWithMaturity.filter(e => e.maturity.percentage <= 30);
  
  // Dossiers transmis (à facturer) - non payés
  const transmittedDossiers = entreprisesWithMaturity.filter(e => e.transmitted && !e.paid);
  const totalToInvoice = transmittedDossiers.reduce((sum, e) => sum + (e.economie + e.subventions) * 0.10, 0);
  
  // Dossiers payés (historique)
  const paidDossiers = entreprisesWithMaturity.filter(e => e.paid);
  const totalPaid = paidDossiers.reduce((sum, e) => sum + (e.economie + e.subventions) * 0.10, 0);

  // Handler pour confirmer encaissement
  const handleConfirmPayment = (dossierId: string) => {
    setEntreprises(prev => prev.map(e => 
      e.id === dossierId 
        ? { ...e, paid: true, paid_at: new Date().toISOString() }
        : e
    ));
  };

  // Handler pour télécharger le PDF (désactivé temporairement)
  const handleDownloadPDF = () => {
    alert('Fonctionnalité PDF en cours de refonte.');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="ml-64 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Espace Gestion</h1>
              <p className="text-slate-400">
                Suivi confidentiel de votre pipeline et commissions
              </p>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Pipeline Total */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded-full">
                ≥70%
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Pipeline Qualifié</p>
            <p className="text-2xl font-bold text-violet-400">{formatCurrency(totalPipeline)}</p>
            <p className="text-slate-500 text-xs mt-2">
              {qualifiedDossiers.length} dossier{qualifiedDossiers.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Commission */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                10%
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Pipeline Commissions</p>
            <p className="text-2xl font-bold text-cyan-400">
              {formatCurrency(totalCommission)}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Estimé sur qualifiés
            </p>
          </div>

          {/* NOUVEAU: Revenus Encaissés */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4 relative">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Banknote className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />
                Réel
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Revenus Encaissés</p>
            <p className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              {paidDossiers.length} paiement{paidDossiers.length > 1 ? 's' : ''} confirmé{paidDossiers.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Dossiers Prêts */}
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">À Facturer</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalToInvoice)}</p>
            <p className="text-slate-500 text-xs mt-2">
              {transmittedDossiers.length} dossier{transmittedDossiers.length > 1 ? 's' : ''} transmis
            </p>
          </div>

          {/* En cours */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">En Cours</p>
            <p className="text-2xl font-bold text-orange-400">{inProgress.length + readyToSend.length}</p>
            <p className="text-slate-500 text-xs mt-2">
              Dossiers actifs
            </p>
          </div>
        </div>

        {/* Tableau Récapitulatif */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              Tableau de Bord Commissions
            </h2>
            <span className="text-xs text-slate-500">
              Mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Secteur
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Maturité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Économies + Subv.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Commission (10%)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {entreprisesWithMaturity.map((entreprise) => {
                  const totalValue = entreprise.economie + entreprise.subventions;
                  const commission = entreprise.maturity.percentage >= 70 ? totalValue * 0.10 : 0;
                  
                  return (
                    <tr 
                      key={entreprise.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{entreprise.raison_sociale}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-sm">{entreprise.secteur}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${entreprise.maturity.barColor}`}
                              style={{ width: `${entreprise.maturity.percentage}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${entreprise.maturity.statusColor}`}>
                            {entreprise.maturity.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-300">
                          {totalValue > 0 ? formatCurrency(totalValue) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {commission > 0 ? (
                          <span className="text-emerald-400 font-semibold">
                            {formatCurrency(commission)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {entreprise.maturity.percentage === 100 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Prêt
                          </span>
                        ) : entreprise.maturity.percentage >= 70 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs">
                            <ArrowUpRight className="w-3 h-3" />
                            Qualifié
                          </span>
                        ) : entreprise.maturity.percentage > 30 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs">
                            <Clock className="w-3 h-3" />
                            En cours
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Incomplet
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800/80 border-t border-slate-600">
                  <td colSpan={3} className="px-6 py-4">
                    <span className="text-slate-400 font-medium">
                      Total Pipeline Qualifié (≥70%)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-semibold">
                      {formatCurrency(totalPipeline)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-400 font-bold text-lg">
                      {formatCurrency(totalCommission)}
                    </span>
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section À Facturer */}
        {transmittedDossiers.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-500/30 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-500/20 bg-amber-500/10">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  À Facturer
                  <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                    {transmittedDossiers.length}
                  </span>
                </h2>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total à facturer</p>
                  <p className="text-xl font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    {formatCurrency(totalToInvoice)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {transmittedDossiers.map((dossier) => {
                const commission = (dossier.economie + dossier.subventions) * 0.10;
                const transmittedDate = dossier.transmitted_at 
                  ? new Date(dossier.transmitted_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Récemment';
                
                return (
                  <div 
                    key={dossier.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Hammer className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{dossier.raison_sociale}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{dossier.secteur}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            <Send className="w-3 h-3" />
                            Transmis le {transmittedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Commission (10%)</p>
                        <p className="text-xl font-bold text-amber-400">
                          {formatCurrency(commission)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {dossier.cee_codes.map((code, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF()}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                        title="Télécharger le PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(dossier.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        Confirmer Encaissement
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-6 py-3 bg-amber-500/5 border-t border-amber-500/20">
              <p className="text-xs text-slate-500 text-center">
                💰 Ces dossiers ont été transmis aux artisans RGE. Facturez dès réception de la confirmation de chantier.
              </p>
            </div>
          </div>
        )}

        {/* Historique des Paiements */}
        {paidDossiers.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/30 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-500/20 bg-emerald-500/10">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  Historique des Paiements
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                    {paidDossiers.length}
                  </span>
                </h2>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total encaissé</p>
                  <p className="text-xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {paidDossiers.map((dossier) => {
                const commission = (dossier.economie + dossier.subventions) * 0.10;
                const paidDate = dossier.paid_at 
                  ? new Date(dossier.paid_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Récemment';
                
                return (
                  <div 
                    key={dossier.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-emerald-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{dossier.raison_sociale}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                            <BadgeCheck className="w-3 h-3" />
                            Payé
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{dossier.secteur}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <Banknote className="w-3 h-3" />
                            Encaissé le {paidDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Commission perçue</p>
                        <p className="text-xl font-bold text-emerald-400">
                          {formatCurrency(commission)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {dossier.cee_codes.map((code, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF()}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm transition-colors"
                        title="Télécharger le PDF"
                      >
                        <FileDown className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-6 py-3 bg-emerald-500/5 border-t border-emerald-500/20">
              <p className="text-xs text-slate-500 text-center">
                ✅ Ces commissions ont été confirmées et encaissées. Dossiers clôturés avec succès.
              </p>
            </div>
          </div>
        )}

        {/* Note de confidentialité */}
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <p className="text-slate-500 text-xs text-center">
            🔒 Ces données sont strictement confidentielles et réservées à l&apos;administrateur du cabinet.
            Les commissions sont calculées sur la base de 10% du montant total (économies + subventions) des dossiers qualifiés.
          </p>
        </div>
      </main>
    </div>
  );
}
