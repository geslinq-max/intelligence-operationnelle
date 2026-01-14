'use client';

import { useState, useMemo } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { 
  Search,
  Target,
  TrendingUp,
  Users,
  Send,
  Check,
  X,
  Loader2,
  Building2,
  Euro,
  Clock,
  Sparkles,
  Award,
  Filter,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================

type InvitationStatus = 'a_inviter' | 'invite' | 'en_attente' | 'converti';

interface ArtisanProspect {
  id: string;
  nom: string;
  logo?: string;
  ville: string;
  secteur: string;
  potentiel_estime: number;
  statut: InvitationStatus;
  date_invitation?: string;
  score_chaleur: number; // 1-100, plus élevé = plus chaud
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  a_inviter: { 
    label: 'À INVITER', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20', 
    borderColor: 'border-amber-500/30' 
  },
  invite: { 
    label: 'INVITÉ', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20', 
    borderColor: 'border-cyan-500/30' 
  },
  en_attente: { 
    label: 'EN ATTENTE', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20', 
    borderColor: 'border-orange-500/30' 
  },
  converti: { 
    label: 'CONVERTI', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20', 
    borderColor: 'border-emerald-500/30' 
  },
};

// ============================================================================
// DONNÉES RÉELLES - PROSPECTION (POST-SANITIZATION)
// ============================================================================

import { PROSPECTION_DATA } from '@/lib/data/specimen-data';

// L'Artisan Spécimen est le seul converti - objectif 50 à atteindre
const DEMO_ARTISANS: ArtisanProspect[] = PROSPECTION_DATA.artisans.map(a => ({
  id: a.id,
  nom: a.nom,
  ville: a.ville,
  secteur: a.secteur,
  potentiel_estime: a.potentiel_estime,
  statut: a.statut,
  date_invitation: a.date_invitation,
  score_chaleur: a.score_chaleur,
}));

// ============================================================================
// COMPOSANTS
// ============================================================================

const OBJECTIF_ARTISANS = 50;

// Jauge de progression pour l'objectif 50 artisans
function ObjectifGauge({ convertis }: { convertis: number }) {
  const percentage = Math.min((convertis / OBJECTIF_ARTISANS) * 100, 100);
  
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Objectif Lancement</h2>
            <p className="text-slate-400 text-sm">Campagne des 50 premiers artisans certifiés</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">
            <span className="text-emerald-400">{convertis}</span>
            <span className="text-slate-500">/{OBJECTIF_ARTISANS}</span>
          </p>
          <p className="text-slate-400 text-sm">Artisans certifiés</p>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div className="relative">
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Marqueurs */}
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center">
          {[25, 50, 75].map(mark => (
            <div 
              key={mark}
              className="absolute w-0.5 h-4 bg-slate-600"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>Démarrage</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>Objectif</span>
      </div>
    </div>
  );
}

// Badge de statut
function StatusBadge({ status }: { status: InvitationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.bgColor} ${config.color} ${config.borderColor}`}>
      {config.label}
    </span>
  );
}

// Indicateur de chaleur (prospect chaud)
function ChaleurIndicator({ score }: { score: number }) {
  const isHot = score >= 80;
  const isWarm = score >= 60 && score < 80;
  
  return (
    <div className="flex items-center gap-1">
      {isHot ? (
        <span className="text-amber-400 text-lg">🔥</span>
      ) : isWarm ? (
        <span className="text-orange-400 text-lg">⚡</span>
      ) : (
        <span className="text-slate-500 text-lg">○</span>
      )}
    </div>
  );
}

// Modal d'invitation
function InvitationModal({
  isOpen,
  onClose,
  artisan,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  artisan: ArtisanProspect | null;
  onConfirm: () => void;
}) {
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !artisan) return null;

  const handleConfirm = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onConfirm();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!isSending ? onClose : undefined} />
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {!isSending && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center">
          {isSending ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Envoi de l'invitation...
              </h3>
              <p className="text-slate-400 mb-6">
                La Cellule d'Expertise prépare l'invitation prioritaire pour {artisan.nom}
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Traitement en cours</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                <Send className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Invitation Prioritaire
              </h3>
              <p className="text-slate-400 mb-6">
                L'invitation de la Cellule d'Expertise est prête à être envoyée à <strong className="text-white">{artisan.nom}</strong>
              </p>
              
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Potentiel détecté</span>
                  <span className="text-emerald-400 font-bold">{artisan.potentiel_estime.toLocaleString()} €</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Secteur</span>
                  <span className="text-white">{artisan.secteur}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Localisation</span>
                  <span className="text-white">{artisan.ville}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-medium transition-all shadow-lg"
                >
                  Envoyer l'Invitation
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ProspectionPage() {
  const [artisans, setArtisans] = useState<ArtisanProspect[]>(DEMO_ARTISANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvitationStatus | 'tous'>('tous');
  const [selectedArtisan, setSelectedArtisan] = useState<ArtisanProspect | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const handleInvite = (artisan: ArtisanProspect) => {
    setSelectedArtisan(artisan);
    setIsModalOpen(true);
  };

  const handleConfirmInvitation = () => {
    if (!selectedArtisan) return;
    
    setArtisans(prev => prev.map(a => 
      a.id === selectedArtisan.id ? { ...a, statut: 'invite', date_invitation: new Date().toISOString() } : a
    ));
    
    setIsModalOpen(false);
    showNotification('success', `Invitation envoyée à ${selectedArtisan.nom}`);
    setSelectedArtisan(null);
  };

  // Filtrage
  const filteredArtisans = useMemo(() => {
    let filtered = [...artisans];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.nom.toLowerCase().includes(query) ||
        a.ville.toLowerCase().includes(query) ||
        a.secteur.toLowerCase().includes(query)
      );
    }
    
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(a => a.statut === filterStatus);
    }
    
    // Tri par score de chaleur décroissant
    filtered.sort((a, b) => b.score_chaleur - a.score_chaleur);
    
    return filtered;
  }, [artisans, searchQuery, filterStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: artisans.length,
    aInviter: artisans.filter(a => a.statut === 'a_inviter').length,
    invites: artisans.filter(a => a.statut === 'invite').length,
    enAttente: artisans.filter(a => a.statut === 'en_attente').length,
    convertis: artisans.filter(a => a.statut === 'converti').length,
    potentielTotal: artisans.reduce((sum, a) => sum + a.potentiel_estime, 0),
  }), [artisans]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="ml-2 hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Campagne Artisans</h1>
              <p className="text-slate-400 text-sm">
                Suivi des invitations - Système d'Audit CAPITAL ÉNERGIE
              </p>
            </div>
          </div>
        </header>

        {/* Jauge d'objectif */}
        <ObjectifGauge convertis={stats.convertis} />

        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">Potentiel Total</p>
            <p className="text-xl font-bold text-emerald-400">{(stats.potentielTotal / 1000).toFixed(0)}K €</p>
          </div>
          <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-400 text-xs mb-1">À Inviter</p>
            <p className="text-xl font-bold text-amber-400">{stats.aInviter}</p>
          </div>
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-4">
            <p className="text-cyan-400 text-xs mb-1">Invités</p>
            <p className="text-xl font-bold text-cyan-400">{stats.invites}</p>
          </div>
          <div className="bg-slate-800/50 border border-orange-500/30 rounded-xl p-4">
            <p className="text-orange-400 text-xs mb-1">En Attente</p>
            <p className="text-xl font-bold text-orange-400">{stats.enAttente}</p>
          </div>
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 text-xs mb-1">Convertis</p>
            <p className="text-xl font-bold text-emerald-400">{stats.convertis}</p>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un artisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InvitationStatus | 'tous')}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="a_inviter">À Inviter</option>
              <option value="invite">Invités</option>
              <option value="en_attente">En Attente</option>
              <option value="converti">Convertis</option>
            </select>
          </div>
        </div>

        {/* Tableau de suivi */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Header du tableau */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-slate-800/50 border-b border-slate-700 text-sm font-medium text-slate-400">
            <div className="col-span-4">Artisan</div>
            <div className="col-span-2">Potentiel Détecté</div>
            <div className="col-span-2">Chaleur</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-slate-800">
            {filteredArtisans.length === 0 ? (
              <div className="p-12 text-center">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">Aucun artisan trouvé</h3>
                <p className="text-slate-400">Modifiez vos critères de recherche.</p>
              </div>
            ) : (
              filteredArtisans.map(artisan => (
                <div 
                  key={artisan.id}
                  className={`p-4 hover:bg-slate-800/30 transition-colors ${
                    artisan.statut === 'converti' ? 'bg-emerald-500/5' : 
                    artisan.score_chaleur >= 90 ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                    {/* Artisan */}
                    <div className="col-span-4 flex items-center gap-3 mb-3 lg:mb-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{artisan.nom}</p>
                        <p className="text-slate-500 text-sm">{artisan.ville} • {artisan.secteur}</p>
                      </div>
                    </div>

                    {/* Potentiel */}
                    <div className="col-span-2 mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-emerald-400 lg:hidden" />
                        <span className="text-emerald-400 font-bold">{artisan.potentiel_estime.toLocaleString()} €</span>
                      </div>
                      <p className="text-slate-500 text-xs lg:hidden">Potentiel estimé par le Système d'Audit</p>
                    </div>

                    {/* Chaleur */}
                    <div className="col-span-2 mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <ChaleurIndicator score={artisan.score_chaleur} />
                        <span className={`text-sm font-medium ${
                          artisan.score_chaleur >= 90 ? 'text-amber-400' :
                          artisan.score_chaleur >= 80 ? 'text-orange-400' :
                          artisan.score_chaleur >= 60 ? 'text-cyan-400' : 'text-slate-400'
                        }`}>
                          {artisan.score_chaleur}%
                        </span>
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="col-span-2 mb-3 lg:mb-0">
                      <StatusBadge status={artisan.statut} />
                    </div>

                    {/* Action */}
                    <div className="col-span-2 lg:text-right">
                      {artisan.statut === 'a_inviter' ? (
                        <button
                          onClick={() => handleInvite(artisan)}
                          className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Envoyer l'Invitation
                        </button>
                      ) : artisan.statut === 'converti' ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg">
                          <Check className="w-4 h-4" />
                          Partenaire Actif
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm flex items-center gap-2 justify-center lg:justify-end">
                          <Clock className="w-4 h-4" />
                          En cours...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{filteredArtisans.length} artisan(s) affiché(s) sur {artisans.length}</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>

      {/* Modal d'invitation */}
      <InvitationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artisan={selectedArtisan}
        onConfirm={handleConfirmInvitation}
      />
    </div>
  );
}
