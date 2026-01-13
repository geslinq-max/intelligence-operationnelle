'use client';

import { useState } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import AddCompanyModal, { type CompanyFormData } from '@/components/modals/AddCompanyModal';
import { ComplianceBadgeList } from '@/components/ui/ComplianceBadge';
import { FolderOpen, Send, Hammer, Eye } from 'lucide-react';
import Link from 'next/link';
import BouclierTresorerie from '@/components/ui/BouclierTresorerie';

type EntrepriseStatut = 'client_actif' | 'prospect' | 'chantier_en_cours' | 'transmis';
type ForfaitNiveau = 'essentiel' | 'serenite' | 'expert';

const FORFAIT_BADGES: Record<ForfaitNiveau, { badge: string; label: string; bgColor: string; textColor: string }> = {
  essentiel: { badge: '🔵', label: 'Essentiel', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  serenite: { badge: '⭐', label: 'Sérénité', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' },
  expert: { badge: '👑', label: 'Expert', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
};

const initialEntreprises: Array<{
  id: string;
  raison_sociale: string;
  secteur: string;
  taille: string;
  ville: string;
  statut: EntrepriseStatut;
  score_energie: number | null;
  score_logistique: number | null;
  economie: number | null;
  subventions: number;
  cee_codes: string[];
  dossier_verifie: boolean;
  compliance_fiche: string | null;
  signed_at: string | null;
  co2_reduction: number;
  transmitted: boolean;
  forfait: ForfaitNiveau;
}> = [
  {
    id: '1',
    raison_sociale: 'Métallurgie Dupont SARL',
    secteur: 'Métallurgie',
    taille: 'PME',
    ville: 'Lyon',
    statut: 'client_actif' as const,
    score_energie: 72,
    score_logistique: 65,
    economie: 12500,
    subventions: 8500,
    cee_codes: ['IND-UT-102', 'IND-UT-117'],
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-102',
    signed_at: '2026-01-05T14:30:00Z',
    co2_reduction: 4.2,
    transmitted: false,
    forfait: 'serenite',
  },
  {
    id: '2',
    raison_sociale: 'Plasturgie Ouest',
    secteur: 'Plasturgie',
    taille: 'PME',
    ville: 'Nantes',
    statut: 'client_actif' as const,
    score_energie: 58,
    score_logistique: 81,
    economie: 8200,
    subventions: 5600,
    cee_codes: ['IND-UT-116'],
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-116',
    signed_at: null,
    co2_reduction: 2.8,
    transmitted: false,
    forfait: 'essentiel',
  },
  {
    id: '3',
    raison_sociale: 'Fonderie Martin',
    secteur: 'Fonderie',
    taille: 'ETI',
    ville: 'Marseille',
    statut: 'client_actif' as const,
    score_energie: 45,
    score_logistique: 52,
    economie: 22800,
    subventions: 15200,
    cee_codes: ['IND-UT-102', 'BAT-EQ-133'],
    dossier_verifie: true,
    compliance_fiche: null,
    signed_at: null,
    co2_reduction: 6.5,
    transmitted: false,
    forfait: 'expert',
  },
  {
    id: '4',
    raison_sociale: 'Textiles Innovants SA',
    secteur: 'Textile',
    taille: 'PME',
    ville: 'Lille',
    statut: 'prospect' as const,
    score_energie: null,
    score_logistique: null,
    economie: null,
    subventions: 0,
    cee_codes: [],
    dossier_verifie: false,
    compliance_fiche: null,
    signed_at: null,
    co2_reduction: 0,
    transmitted: false,
    forfait: 'essentiel',
  },
  {
    id: '5',
    raison_sociale: 'Verrerie d\'Azur',
    secteur: 'Verrerie',
    taille: 'ETI',
    ville: 'Nice',
    statut: 'client_actif' as const,
    score_energie: 68,
    score_logistique: 55,
    economie: 18500,
    subventions: 12400,
    cee_codes: ['IND-UT-103'],
    dossier_verifie: true,
    compliance_fiche: 'IND-UT-103',
    signed_at: null,
    co2_reduction: 5.1,
    transmitted: false,
    forfait: 'serenite',
  },
];

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-xs w-16">{label}</span>
        <span className="text-slate-600 text-xs">Non analysé</span>
      </div>
    );
  }

  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-xs w-16">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-slate-400 text-xs w-8">{score}%</span>
    </div>
  );
}

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState(initialEntreprises);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddCompany = async (data: CompanyFormData) => {
    // Entreprise ajoutée via Supabase dans le modal
  };

  const handleTransmitPack = (entreprise: typeof initialEntreprises[0]) => {
    setEntreprises(prev => prev.map(e => 
      e.id === entreprise.id 
        ? { ...e, statut: 'chantier_en_cours' as const, transmitted: true }
        : e
    ));
  };

  const isDossierComplet = (e: typeof initialEntreprises[0]) => {
    return e.cee_codes.length > 0 && e.compliance_fiche && e.signed_at;
  };

  const isDossierPretOuConforme = (e: typeof initialEntreprises[0]) => {
    return e.statut === 'client_actif' && isDossierComplet(e);
  };

  const dossiersPrets = entreprises.filter(isDossierPretOuConforme);
  const capitalSecurise = dossiersPrets.reduce((sum, e) => sum + (e.economie || 0) + e.subventions, 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="ml-64 p-8">
        <header className="mb-8">
          {/* Bouclier de Trésorerie */}
          <BouclierTresorerie 
            montantTotal={capitalSecurise} 
            nombreDossiers={dossiersPrets.length} 
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Artisans Partenaires</h1>
              <p className="text-slate-400 mt-1">
                Suivi des dossiers CEE par artisan
              </p>
            </div>
            <button 
              onClick={() => {
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors pointer-events-auto relative z-50"
            >
              + Ajouter une entreprise
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            className="flex-1 max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
            <option>Tous les secteurs</option>
            <option>Métallurgie</option>
            <option>Plasturgie</option>
            <option>Fonderie</option>
            <option>Textile</option>
          </select>
          <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
            <option>Tous les statuts</option>
            <option>Client actif</option>
            <option>Prospect</option>
          </select>
        </div>

        {/* Entreprises Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold text-lg">
                      {entreprise.raison_sociale}
                    </h3>
                    {/* Bouton Aperçu - Intégré proprement */}
                    {entreprise.statut === 'client_actif' && (
                      <Link
                        href={`/espace-client?id=${entreprise.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-600 hover:border-cyan-500/50 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium hidden group-hover:inline transition-all">Voir l'Espace</span>
                        <span className="text-xs font-medium group-hover:hidden">👁️</span>
                      </Link>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">
                    {entreprise.secteur} • {entreprise.ville}
                  </p>
                  {entreprise.statut === 'client_actif' && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${isDossierComplet(entreprise) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {isDossierComplet(entreprise) ? 'Dossier complet' : 'En cours'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {entreprise.statut === 'client_actif' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${FORFAIT_BADGES[entreprise.forfait].bgColor} ${FORFAIT_BADGES[entreprise.forfait].textColor}`}>
                        <span>{FORFAIT_BADGES[entreprise.forfait].badge}</span>
                        {FORFAIT_BADGES[entreprise.forfait].label}
                      </span>
                    )}
                    {entreprise.statut === 'prospect' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-600/50 text-slate-400">
                        Prospect
                      </span>
                    )}
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                      {entreprise.taille}
                    </span>
                  </div>
                  {entreprise.statut === 'client_actif' && (
                    <ComplianceBadgeList 
                      codes={entreprise.cee_codes} 
                      sector={entreprise.secteur}
                      maxDisplay={2}
                    />
                  )}
                </div>
              </div>

              {/* Infos dossier CEE */}
              {entreprise.subventions > 0 && (
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <span className="text-emerald-400 text-sm font-medium">Prime CEE estimée</span>
                  <span className="text-emerald-400 font-bold">
                    {entreprise.subventions.toLocaleString()} €
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                {entreprise.statut === 'chantier_en_cours' ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm">
                    <Hammer className="w-4 h-4" />
                    Chantier en cours
                  </div>
                ) : entreprise.statut === 'client_actif' && isDossierComplet(entreprise) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTransmitPack(entreprise);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-semibold transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Transmettre le Pack
                  </button>
                ) : entreprise.statut === 'client_actif' ? (
                  <a
                    href="/verificateur"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Gérer le dossier CEE
                  </a>
                ) : (
                  <a
                    href="/verificateur"
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm transition-colors text-center"
                  >
                    Créer un dossier CEE
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Gestion des Artisans Partenaires</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>

      {/* Modal Ajouter Entreprise */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCompany}
      />

    </div>
  );
}
