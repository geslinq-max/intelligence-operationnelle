'use client';

import { useState, useCallback, useEffect } from 'react';
import { useIndustry } from '@/contexts/IndustryContext';
import { 
  X, 
  Radar, 
  Search, 
  MapPin, 
  Briefcase, 
  Loader2, 
  Phone, 
  Globe, 
  Star,
  Activity,
  CheckCircle,
  Check,
  RefreshCw,
  Users,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface RadarProspect {
  place_id: string;
  raison_sociale: string;
  adresse: string;
  ville: string;
  telephone: string | null;
  site_web: string | null;
  note_google: number | null;
  nombre_avis: number;
  pain_score: number;
  urgency_level: string;
  pain_summary: string;
  top_issues: string[];
  is_new: boolean;
}

interface RadarResponse {
  success: boolean;
  query: string;
  total: number;
  new_count: number;
  updated_count: number;
  high_potential_count: number;
  prospects: RadarProspect[];
  mode?: 'PRODUCTION' | 'SIMULATION';
}

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (newCount: number, highPotentialCount: number) => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function RadarModal({ isOpen, onClose, onComplete }: RadarModalProps) {
  const { config } = useIndustry();
  const [metier, setMetier] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<RadarProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{ total: number; newCount: number; highPotential: number; mode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  // Toggle sélection d'un prospect - VERSION DEBUG
  const toggleSelection = useCallback((placeId: string, prospectName?: string) => {
    console.log('%c[RADAR CLICK] ' + (prospectName || placeId), 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
    
    setSelectedIds(prevIds => {
      const newSet = new Set(prevIds);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
        console.log('%c[RADAR] Désélectionné: ' + (prospectName || placeId), 'color: #f59e0b;');
      } else {
        newSet.add(placeId);
        console.log('%c[RADAR] Sélectionné: ' + (prospectName || placeId), 'color: #10b981;');
      }
      console.log('%c[RADAR] Total sélectionnés: ' + newSet.size, 'color: #3b82f6; font-weight: bold;');
      return newSet;
    });
  }, []);

  // Sélectionner/Désélectionner tous
  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(p => p.place_id)));
    }
  };

  // Enregistrer les prospects sélectionnés dans localStorage
  const handleSaveSelected = async () => {
    if (selectedIds.size === 0) {
      setError('Veuillez sélectionner au moins un prospect');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Filtrer les prospects sélectionnés
      const selectedProspects = results.filter(p => selectedIds.has(p.place_id));
      const highPotentialCount = selectedProspects.filter(p => p.pain_score > 40).length;

      // Log pour debug
      console.log('%c[RADAR] Enregistrement de ' + selectedProspects.length + ' prospects...', 'background: #10b981; color: white; padding: 4px 8px;');

      // Récupérer les prospects existants du localStorage
      const existingData = localStorage.getItem('radar_prospects');
      const existingProspects: typeof selectedProspects = existingData ? JSON.parse(existingData) : [];

      // Fusionner avec les nouveaux (éviter les doublons par place_id)
      const existingIds = new Set(existingProspects.map(p => p.place_id));
      const newProspects = selectedProspects.filter(p => !existingIds.has(p.place_id));
      const mergedProspects = [...existingProspects, ...newProspects];

      // Sauvegarder dans localStorage
      localStorage.setItem('radar_prospects', JSON.stringify(mergedProspects));
      localStorage.setItem('radar_last_update', new Date().toISOString());

      // Mettre à jour le compteur global
      const totalCount = mergedProspects.length;
      const totalHighPotential = mergedProspects.filter(p => p.pain_score > 40).length;
      localStorage.setItem('radar_total_count', String(totalCount));
      localStorage.setItem('radar_high_potential_count', String(totalHighPotential));

      console.log('%c[RADAR] ✓ Sauvegarde réussie!', 'background: #10b981; color: white; padding: 4px 8px;');
      console.log('[RADAR] Total prospects:', totalCount, '| Haut potentiel:', totalHighPotential);

      // Déclencher un événement pour rafraîchir la Tour de Contrôle
      window.dispatchEvent(new CustomEvent('radar-prospects-updated', {
        detail: { total: totalCount, highPotential: totalHighPotential, newCount: newProspects.length }
      }));

      // Succès - fermer le modal
      setIsSaving(false);
      onComplete(newProspects.length, highPotentialCount);
      handleClose();

    } catch (err) {
      console.error('[RADAR] Erreur sauvegarde:', err);
      setError('Erreur lors de l\'enregistrement');
      setIsSaving(false);
    }
  };

  // Pré-remplir le métier selon le contexte métier actif
  useEffect(() => {
    if (isOpen && !metier) {
      setMetier(config.radarDefaultMetier);
    }
  }, [isOpen, config.radarDefaultMetier]);

  // Animation de fondu progressif
  const animateResults = useCallback((prospects: RadarProspect[]) => {
    setVisibleCount(0);
    prospects.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, index * 150);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!metier.trim() || !localisation.trim()) {
      setError('Veuillez remplir les deux champs');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metier: metier.trim(), localisation: localisation.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data: RadarResponse = await response.json();

      if (data.success) {
        setResults(data.prospects);
        setStats({
          total: data.total,
          newCount: data.new_count,
          highPotential: data.high_potential_count,
          mode: data.mode,
        });
        animateResults(data.prospects);
      } else {
        setError('Aucun résultat trouvé');
      }
    } catch (err) {
      console.error('[Radar] Erreur:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setMetier('');
    setLocalisation('');
    setResults([]);
    setSelectedIds(new Set());
    setStats(null);
    setError(null);
    onClose();
  };

  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case 'URGENCE_HAUTE':
        return { 
          bg: 'bg-red-500/20', 
          border: 'border-red-500/40', 
          text: 'text-red-400',
          label: 'Urgence haute'
        };
      case 'URGENCE_MOYENNE':
        return { 
          bg: 'bg-amber-500/20', 
          border: 'border-amber-500/40', 
          text: 'text-amber-400',
          label: 'Urgence moyenne'
        };
      default:
        return { 
          bg: 'bg-slate-500/20', 
          border: 'border-slate-500/40', 
          text: 'text-slate-400',
          label: 'Normal'
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Radar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Radar de Prospection</h2>
              <p className="text-slate-400 text-sm">Recherche d'artisans à haut potentiel</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Métier */}
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">
                Métier recherché
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={metier}
                  onChange={(e) => setMetier(e.target.value)}
                  placeholder="Ex: Électricien, Plombier..."
                  disabled={isSearching}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">
                Localisation
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={localisation}
                  onChange={(e) => setLocalisation(e.target.value)}
                  placeholder="Ex: Romilly-sur-Seine, 10100..."
                  disabled={isSearching}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Scan en cours...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Lancer le Radar</span>
              </>
            )}
          </button>
        </form>

        {/* Stats */}
        {stats && (
          <div className="p-4 border-b border-slate-700 flex-shrink-0">
            {/* Mode indicator */}
            <div className={`mb-3 px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
              stats.mode === 'PRODUCTION' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {stats.mode === 'PRODUCTION' 
                ? '🔗 Données réelles Google Places' 
                : '🧪 Mode démonstration (données simulées)'}
            </div>
            <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
              <p className="text-slate-500 text-xs">Trouvés</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{stats.newCount}</span>
              </div>
              <p className="text-emerald-500/70 text-xs">Nouveaux</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">{stats.highPotential}</span>
              </div>
              <p className="text-amber-500/70 text-xs">Haut potentiel</p>
            </div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ pointerEvents: 'auto' }}>
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-pulse" />
                <Radar className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: '2s' }} />
              </div>
              <p className="text-slate-400 mt-4">Scan du territoire en cours...</p>
              <p className="text-slate-500 text-sm">Analyse des signaux de détresse</p>
            </div>
          )}

          {!isSearching && results.length === 0 && !stats && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Radar className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400">Entrez un métier et une localisation</p>
              <p className="text-slate-500 text-sm">pour lancer la prospection automatique</p>
            </div>
          )}

          {/* Barre de sélection avec compteur visible */}
          {results.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-1 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <button
                onClick={() => {
                  console.log('[TOUT SÉLECTIONNER] Clic');
                  toggleSelectAll();
                }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors px-2"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedIds.size === results.length 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'border-slate-600 hover:border-emerald-500'
                }`}>
                  {selectedIds.size === results.length && <Check className="w-3 h-3 text-white" />}
                </div>
                {selectedIds.size === results.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                selectedIds.size > 0 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {selectedIds.size} / {results.length}
              </div>
            </div>
          )}

          {results.slice(0, visibleCount).map((prospect, index) => {
            const urgencyConfig = getUrgencyConfig(prospect.urgency_level);
            const isSelected = selectedIds.has(prospect.place_id);
            
            return (
              <div
                key={prospect.place_id}
                className={`relative rounded-xl p-4 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-800/50 border-2 border-slate-700'
                }`}
                style={{
                  animation: 'fadeSlideIn 0.3s ease-out forwards',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* ========== BOUTON SÉLECTION PRINCIPAL ========== */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[CLICK] Bouton cliqué pour:', prospect.raison_sociale);
                    toggleSelection(prospect.place_id, prospect.raison_sociale);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[MOUSEDOWN] Bouton pressé pour:', prospect.raison_sociale);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    console.log('[TOUCH] Bouton touché pour:', prospect.raison_sociale);
                    toggleSelection(prospect.place_id, prospect.raison_sociale);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '48px',
                    height: '48px',
                    zIndex: 9999,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                  }}
                  className={`rounded-xl border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' 
                      : 'bg-slate-700 border-slate-500 text-slate-300 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Désélectionner ${prospect.raison_sociale}` : `Sélectionner ${prospect.raison_sociale}`}
                >
                  {isSelected ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-2xl font-bold">+</span>
                  )}
                </button>

                {/* Contenu de la carte */}
                <div className="pr-14">
                  {/* Header avec nom */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className={`font-semibold text-base ${
                      isSelected ? 'text-emerald-300' : 'text-white'
                    }`}>
                      {prospect.raison_sociale}
                    </h3>
                    {prospect.is_new && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                        Nouveau
                      </span>
                    )}
                    {!prospect.is_new && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Mis à jour
                      </span>
                    )}
                  </div>
                  
                  {/* Infos localisation et contact */}
                  <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {prospect.ville}
                    </span>
                    {prospect.telephone && (
                      <span 
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        {prospect.telephone}
                      </span>
                    )}
                    {prospect.site_web && (
                      <a 
                        href={prospect.site_web} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Site
                      </a>
                    )}
                  </div>
                  
                  {/* Note Google */}
                  {prospect.note_google && (
                    <div className="flex items-center gap-1 text-sm mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{prospect.note_google.toFixed(1)}</span>
                      <span className="text-slate-500">({prospect.nombre_avis} avis)</span>
                    </div>
                  )}

                  {/* Pain Score inline */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${urgencyConfig.bg} ${urgencyConfig.border} border`}>
                    <Activity className={`w-4 h-4 ${urgencyConfig.text}`} />
                    <span className={`font-bold ${urgencyConfig.text}`}>
                      Score: {prospect.pain_score}
                    </span>
                    <span className={`text-xs ${urgencyConfig.text} opacity-80`}>
                      ({urgencyConfig.label})
                    </span>
                  </div>

                  {/* Pain Summary */}
                  {prospect.pain_score > 0 && prospect.pain_summary && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-sm">{prospect.pain_summary}</p>
                      {prospect.top_issues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {prospect.top_issues.map((issue, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {stats && (
          <div className="p-4 border-t border-slate-700 flex-shrink-0 space-y-2">
            {error && (
              <p className="text-red-400 text-sm text-center mb-2">{error}</p>
            )}
            <button
              onClick={handleSaveSelected}
              disabled={isSaving || selectedIds.size === 0}
              className={`w-full px-4 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                selectedIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {selectedIds.size > 0 
                    ? `Ajouter ${selectedIds.size} prospect${selectedIds.size > 1 ? 's' : ''} sélectionné${selectedIds.size > 1 ? 's' : ''}`
                    : '0 ajoutés - Sélectionnez des prospects'
                  }
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Fermer sans enregistrer
            </button>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
