'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components';
import { ProtectedRoute } from '@/contexts/AuthContext';
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
  Radar,
  Eye,
  Zap,
  Leaf,
  Grape,
  RefreshCw,
  Timer
} from 'lucide-react';
import RadarModal from '@/components/modals/RadarModal';
import { useToast } from '@/components/ui/Toast';
import { useAdminClients, type ClientProfile } from '@/hooks/useAdminClients';
import type { ClientIndustry } from '@/lib/auth/role-config';

// Configuration des industries
const INDUSTRY_CONFIG: Record<ClientIndustry, { label: string; icon: React.ReactNode; color: string }> = {
  CEE: { label: 'Artisan CEE', icon: <Zap className="w-4 h-4" />, color: 'text-emerald-400' },
  PAYSAGISTE: { label: 'Paysagiste', icon: <Leaf className="w-4 h-4" />, color: 'text-amber-400' },
  VITICULTEUR: { label: 'Viticulteur', icon: <Grape className="w-4 h-4" />, color: 'text-purple-400' },
};

// Type pour les filtres industrie
type IndustryFilter = 'tous' | ClientIndustry;

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

function IndustryBadge({ industry }: { industry: ClientIndustry | null }) {
  if (!industry) return null;
  const config = INDUSTRY_CONFIG[industry];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function HeuresGagneesBadge({ heures }: { heures: number }) {
  if (heures === 0) return <span className="text-slate-500 text-sm">-</span>;
  
  return (
    <div className="flex items-center gap-1 text-emerald-400">
      <Timer className="w-4 h-4" />
      <span className="font-medium">{heures}h</span>
    </div>
  );
}

function ClientsPageContent() {
  const { clients, stats, isLoading, error, refetch } = useAdminClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [filterIndustry, setFilterIndustry] = useState<IndustryFilter>('tous');
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarProspectsCount, setRadarProspectsCount] = useState(0);
  const { showToast } = useToast();

  // Charger le compteur de prospects Radar depuis localStorage
  useEffect(() => {
    const loadRadarCount = () => {
      const count = localStorage.getItem('radar_total_count');
      setRadarProspectsCount(count ? parseInt(count, 10) : 0);
    };
    
    // Charger au montage
    loadRadarCount();
    
    // Écouter les mises à jour du Radar
    const handleRadarUpdate = (event: CustomEvent) => {
      console.log('[Tour de Contrôle] Radar mis à jour:', event.detail);
      setRadarProspectsCount(event.detail.total || 0);
    };
    
    window.addEventListener('radar-prospects-updated', handleRadarUpdate as EventListener);
    
    return () => {
      window.removeEventListener('radar-prospects-updated', handleRadarUpdate as EventListener);
    };
  }, []);

  // Filtrer les clients
  const filteredClients = clients.filter(client => {
    const matchSearch = 
      client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.entreprise?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (client.ville?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchStatut = filterStatut === 'tous' || client.statut === filterStatut;
    const matchIndustry = filterIndustry === 'tous' || client.industry === filterIndustry;
    return matchSearch && matchStatut && matchIndustry;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-3 sm:p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header - Mobile First */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Tour de Contrôle</h1>
                <p className="text-emerald-400 text-xs sm:text-sm font-medium">
                  {stats.total} clients • {radarProspectsCount} prospects • {stats.totalHeuresGagnees.toFixed(1)}h économisées
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={refetch}
                disabled={isLoading}
                className="p-2.5 border border-slate-600 hover:bg-slate-700 active:bg-slate-600 text-slate-400 rounded-xl transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsRadarOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 border border-emerald-500/50 hover:bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm sm:text-base font-medium transition-colors"
              >
                <Radar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Radar</span>
              </button>
              <Link
                href="/inscription"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm sm:text-base font-medium transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Inviter</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Onglets Industrie */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['tous', 'CEE', 'PAYSAGISTE', 'VITICULTEUR'] as const).map((industry) => {
            const isActive = filterIndustry === industry;
            const count = industry === 'tous' ? stats.total : stats.parIndustrie[industry];
            const config = industry === 'tous' 
              ? { label: 'Tous', icon: <Users className="w-4 h-4" />, color: 'text-white' }
              : INDUSTRY_CONFIG[industry];
            
            return (
              <button
                key={industry}
                onClick={() => setFilterIndustry(industry)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' 
                    : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {config.icon}
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-emerald-500/30' : 'bg-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-base text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-base text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="en_attente">En attente</option>
              <option value="inactif">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Stats rapides - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mb-1 sm:mb-0" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.actifs}</p>
                <p className="text-slate-400 text-xs sm:text-sm">Actifs</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-1 sm:mb-0" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.enAttente}</p>
                <p className="text-slate-400 text-xs sm:text-sm">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mb-1 sm:mb-0" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalHeuresGagnees.toFixed(0)}h</p>
                <p className="text-slate-400 text-xs sm:text-sm">Économisées</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-1 sm:mb-0" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-slate-400 text-xs sm:text-sm">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Liste des clients */}
        {!isLoading && (
          <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Clients Inscrits</h2>
              <span className="text-sm text-slate-400">{filteredClients.length} résultats</span>
            </div>
            
            {/* Vue Desktop (md+) */}
            <div className="hidden md:block divide-y divide-slate-700/50">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Aucun client trouvé</p>
                  <p className="text-slate-500 text-sm mt-1">Les nouveaux inscrits apparaîtront ici automatiquement</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-lg">
                          {client.nom.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-medium truncate max-w-[180px] lg:max-w-[250px]">{client.nom}</h3>
                          <StatutBadge statut={client.statut} />
                          <IndustryBadge industry={client.industry} />
                        </div>
                        <p className="text-slate-400 text-sm truncate">{client.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          {client.ville && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {client.ville}
                            </span>
                          )}
                          {client.telephone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.telephone}
                            </span>
                          )}
                          <span className="text-slate-600">
                            Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* KPI Heures Gagnées */}
                      <div className="text-right min-w-[80px]">
                        <HeuresGagneesBadge heures={client.heuresGagnees} />
                        <p className="text-slate-500 text-xs">gagnées</p>
                      </div>
                      
                      {/* Activité */}
                      <div className="text-right min-w-[60px]">
                        <p className="text-white font-medium">
                          {client.dossiersCount + client.bsdCount + client.traitementsCount}
                        </p>
                        <p className="text-slate-400 text-xs">actions</p>
                      </div>

                      {/* Bouton Aperçu Client */}
                      <Link
                        href={`/client/dashboard?preview=${client.id}&industry=${client.industry || 'CEE'}`}
                        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm font-medium transition-colors touch-manipulation"
                        title="Voir le dashboard client"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Aperçu</span>
                      </Link>

                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors touch-manipulation"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400 hover:text-emerald-400" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Vue Mobile (< md) */}
            <div className="md:hidden p-3 space-y-3">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Aucun client trouvé</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-lg">
                          {client.nom.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-semibold truncate max-w-[150px]">{client.nom}</h3>
                          <StatutBadge statut={client.statut} />
                        </div>
                        <p className="text-slate-400 text-sm truncate">{client.email}</p>
                        <IndustryBadge industry={client.industry} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between py-3 border-t border-b border-slate-700/50 mb-3">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <HeuresGagneesBadge heures={client.heuresGagnees} />
                          <p className="text-slate-500 text-xs">gagnées</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700"></div>
                        <div className="text-center">
                          <p className="text-white font-bold">
                            {client.dossiersCount + client.bsdCount + client.traitementsCount}
                          </p>
                          <p className="text-slate-500 text-xs">actions</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <Link
                      href={`/client/dashboard?preview=${client.id}&industry=${client.industry || 'CEE'}`}
                      className="flex items-center justify-center gap-2 py-3.5 min-h-[48px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl font-semibold touch-manipulation active:bg-cyan-500/30"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Voir le Dashboard Client</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Radar Modal */}
      <RadarModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        onComplete={(newCount) => {
          setIsRadarOpen(false);
          showToast({
            type: 'success',
            title: 'Radar terminé',
            message: `${newCount} nouveaux prospects identifiés.`,
            duration: 6000,
          });
          refetch();
        }}
      />
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
