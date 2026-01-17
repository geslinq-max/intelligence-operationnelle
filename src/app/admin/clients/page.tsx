'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Filter,
  Activity
} from 'lucide-react';
import { ProspectInsight, UrgencyLevel } from '@/lib/ai/pain-signals';
import { ProspectInsightsService } from '@/lib/services/prospect-insights-cache';

// Données specimen pour les artisans
const ARTISANS_DATA = [
  {
    id: '1',
    nom: 'Martin Dupont',
    entreprise: 'Dupont Plomberie',
    email: 'martin@dupont-plomberie.fr',
    telephone: '06 12 34 56 78',
    ville: 'Lyon',
    statut: 'actif',
    dossiersEnCours: 3,
    dossiersValides: 12,
    derniereDossier: '2026-01-15',
  },
  {
    id: '2',
    nom: 'Sophie Bernard',
    entreprise: 'Bernard Chauffage',
    email: 'sophie@bernard-chauffage.fr',
    telephone: '06 98 76 54 32',
    ville: 'Paris',
    statut: 'actif',
    dossiersEnCours: 1,
    dossiersValides: 8,
    derniereDossier: '2026-01-14',
  },
  {
    id: '3',
    nom: 'Pierre Moreau',
    entreprise: 'Moreau Isolation',
    email: 'pierre@moreau-isolation.fr',
    telephone: '06 11 22 33 44',
    ville: 'Marseille',
    statut: 'en_attente',
    dossiersEnCours: 0,
    dossiersValides: 0,
    derniereDossier: null,
  },
];

function StatutBadge({ statut }: { statut: string }) {
  const config = {
    actif: { label: 'Actif', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    en_attente: { label: 'En attente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    inactif: { label: 'Inactif', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  }[statut] || { label: statut, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

/**
 * Composant Diagnostic Pain Signals
 * Affiche une icône d'alerte avec tooltip au survol
 */
function DiagnosticBadge({ insight }: { insight: ProspectInsight | null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!insight || insight.urgencyLevel === 'NORMAL' || insight.urgencyLevel === 'UNKNOWN') {
    return null; // Fallback silencieux
  }
  
  const config = {
    URGENCE_HAUTE: {
      icon: 'bg-red-500/20 text-red-400 border-red-500/40',
      label: 'Urgence haute',
      bgTooltip: 'bg-red-950 border-red-500/50',
    },
    URGENCE_MOYENNE: {
      icon: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      label: 'Urgence moyenne',
      bgTooltip: 'bg-amber-950 border-amber-500/50',
    },
  }[insight.urgencyLevel] || null;
  
  if (!config) return null;
  
  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border cursor-help ${config.icon}`}>
        <Activity className="w-4 h-4" />
      </div>
      
      {/* Tooltip au survol */}
      {showTooltip && (
        <div className={`absolute z-50 right-0 top-full mt-2 w-64 p-3 rounded-xl border shadow-xl ${config.bgTooltip}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" />
            <span className="font-semibold text-sm">{config.label}</span>
            <span className="ml-auto text-xs opacity-70">Score: {insight.painScore}/100</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {insight.summary}
          </p>
          {insight.topIssues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-xs text-slate-400">
                {insight.topIssues.join(' • ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientsPageContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [insights, setInsights] = useState<Map<string, ProspectInsight>>(new Map());

  // Charger les Pain Signals en arrière-plan
  useEffect(() => {
    const loadInsights = async () => {
      try {
        const prospectIds = ARTISANS_DATA.map(a => a.id);
        const results = await ProspectInsightsService.getProspectsInsights(prospectIds);
        setInsights(results);
      } catch (error) {
        // Fallback silencieux - pas d'erreur affichée
        console.error('[PainSignals] Erreur chargement:', error);
      }
    };
    loadInsights();
  }, []);

  const filteredArtisans = ARTISANS_DATA.filter(artisan => {
    const matchSearch = artisan.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.entreprise.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.ville.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = filterStatut === 'tous' || artisan.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Clients / Artisans</h1>
                <p className="text-emerald-400 text-sm font-medium">
                  {ARTISANS_DATA.length} artisans enregistres
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
              <Plus className="w-5 h-5" />
              <span>Nouvel Artisan</span>
            </button>
          </div>
        </header>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un artisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="en_attente">En attente</option>
              <option value="inactif">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">{ARTISANS_DATA.filter(a => a.statut === 'actif').length}</p>
                <p className="text-slate-400 text-sm">Actifs</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{ARTISANS_DATA.filter(a => a.statut === 'en_attente').length}</p>
                <p className="text-slate-400 text-sm">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-white">{ARTISANS_DATA.reduce((acc, a) => acc + a.dossiersEnCours, 0)}</p>
                <p className="text-slate-400 text-sm">Dossiers en cours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des artisans - Acces rapide (1 clic) */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Liste des Artisans</h2>
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {filteredArtisans.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucun artisan trouve</p>
              </div>
            ) : (
              filteredArtisans.map((artisan) => (
                <Link
                  key={artisan.id}
                  href={`/admin/clients/${artisan.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                      <span className="text-emerald-400 font-bold text-lg">
                        {artisan.nom.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                          {artisan.nom}
                        </h3>
                        <StatutBadge statut={artisan.statut} />
                      </div>
                      <p className="text-slate-400 text-sm">{artisan.entreprise}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {artisan.ville}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {artisan.telephone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Colonne Diagnostic Pain Signals */}
                    <DiagnosticBadge insight={insights.get(artisan.id) || null} />
                    
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-medium">{artisan.dossiersValides} dossiers</p>
                      <p className="text-slate-400 text-xs">{artisan.dossiersEnCours} en cours</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ClientsPageContent />
    </ProtectedRoute>
  );
}
