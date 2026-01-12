'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components';
import { 
  Search,
  Filter,
  MapPin,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Users,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import { 
  findHighValueProspects, 
  searchProspects,
  type Prospect, 
  type ProspectStatus 
} from '@/lib/agents/cee-prospector';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; bgColor: string }> = {
  nouveau: { label: 'NOUVEAU', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  a_contacter: { label: 'À CONTACTER', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30' },
  contacte: { label: 'CONTACTÉ', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  interesse: { label: 'DOSSIER TEST', color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
  rdv_pris: { label: 'RDV PRIS', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
  converti: { label: 'PARTENAIRE', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  non_interesse: { label: 'NON INTÉRESSÉ', color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/30' },
};

const SECTEURS = [
  'Tous les secteurs',
  'Pompage',
  'Ventilation',
  'Compresseur',
  'Maintenance industrielle',
  'Électricité',
  'Convoyage',
  'Agroalimentaire',
  'Broyage',
];

const ZONES = [
  'Toutes les zones',
  'Lyon',
  'Marseille',
  'Lille',
  'Nantes',
  'Strasbourg',
  'Rennes',
  'Bordeaux',
  'Toulouse',
  'Paris',
  'Nice',
];

// ============================================================================
// COMPOSANTS
// ============================================================================

function ScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return 'from-emerald-500 to-green-400';
    if (score >= 80) return 'from-cyan-500 to-blue-400';
    if (score >= 60) return 'from-amber-500 to-yellow-400';
    return 'from-slate-500 to-slate-400';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${
        score >= 90 ? 'text-emerald-400' : 
        score >= 80 ? 'text-cyan-400' : 
        score >= 60 ? 'text-amber-400' : 'text-slate-400'
      }`}>
        {score}
      </span>
    </div>
  );
}

function StatusBadge({ status, onClick }: { status: ProspectStatus; onClick?: () => void }) {
  const config = STATUS_CONFIG[status];
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded border ${config.bgColor} ${config.color} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {config.label}
    </button>
  );
}

function ProspectCard({ 
  prospect, 
  onStatusChange,
  onCopyMessage 
}: { 
  prospect: Prospect;
  onStatusChange: (newStatus: ProspectStatus) => void;
  onCopyMessage: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleCopy = async () => {
    if (prospect.message_personnalise) {
      await navigator.clipboard.writeText(prospect.message_personnalise);
      setCopied(true);
      onCopyMessage();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = () => {
    if (prospect.email && prospect.message_personnalise) {
      const subject = encodeURIComponent(`Partenariat CEE - ${prospect.raison_sociale}`);
      const body = encodeURIComponent(prospect.message_personnalise);
      window.open(`mailto:${prospect.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-semibold text-lg truncate">
                {prospect.raison_sociale}
              </h3>
              <ScoreGauge score={prospect.score_pertinence} />
            </div>
            <p className="text-slate-400 text-sm mb-2 line-clamp-1">
              {prospect.activite_principale}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {prospect.ville && (
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {prospect.ville} {prospect.code_postal && `(${prospect.code_postal})`}
                </span>
              )}
              {prospect.contact_nom && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {prospect.contact_nom}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="relative">
              <StatusBadge 
                status={prospect.statut} 
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              />
              {showStatusMenu && (
                <div className="absolute right-0 top-8 z-10 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[160px]">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onStatusChange(key as ProspectStatus);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${config.color}`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {prospect.fiches_cee_potentielles.length > 0 && (
              <div className="flex gap-1">
                {prospect.fiches_cee_potentielles.map(fiche => (
                  <span key={fiche} className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">
                    {fiche}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700">
          {prospect.telephone && (
            <a
              href={`tel:${prospect.telephone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              Appeler
            </a>
          )}
          {prospect.email && (
            <button
              onClick={handleEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-sm rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          )}
          {prospect.site_web && (
            <a
              href={prospect.site_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Site
            </a>
          )}
          
          <div className="flex-1" />
          
          {prospect.message_personnalise && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Message IA
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Message personnalisé (expandable) */}
      {isExpanded && prospect.message_personnalise && (
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Message de Conversion Personnalisé
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                <button
                  onClick={handleEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </div>
            </div>
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {prospect.message_personnalise}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ProspectionPage() {
  const [prospects, setProspects] = useState<Prospect[]>(() => {
    const result = findHighValueProspects();
    return result.prospects;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState('Tous les secteurs');
  const [selectedZone, setSelectedZone] = useState('Toutes les zones');
  const [sortBy, setSortBy] = useState<'score' | 'nom' | 'ville'>('score');
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (prospectId: string, newStatus: ProspectStatus) => {
    setProspects(prev => prev.map(p => 
      p.id === prospectId ? { ...p, statut: newStatus } : p
    ));
  };

  const handleRefresh = () => {
    const criteria = {
      secteurs: selectedSecteur !== 'Tous les secteurs' ? [selectedSecteur] : [],
      zone_geographique: selectedZone !== 'Toutes les zones' ? selectedZone : undefined,
    };
    const result = searchProspects(criteria);
    setProspects(result.prospects);
  };

  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.raison_sociale.toLowerCase().includes(query) ||
        p.activite_principale.toLowerCase().includes(query) ||
        p.ville?.toLowerCase().includes(query) ||
        p.contact_nom?.toLowerCase().includes(query)
      );
    }
    
    // Filtre par secteur
    if (selectedSecteur !== 'Tous les secteurs') {
      filtered = filtered.filter(p => {
        const allActivites = [p.activite_principale, ...p.activites_secondaires].join(' ').toLowerCase();
        return allActivites.includes(selectedSecteur.toLowerCase());
      });
    }
    
    // Filtre par zone
    if (selectedZone !== 'Toutes les zones') {
      filtered = filtered.filter(p => 
        p.ville?.toLowerCase().includes(selectedZone.toLowerCase())
      );
    }
    
    // Tri
    switch (sortBy) {
      case 'score':
        filtered.sort((a, b) => b.score_pertinence - a.score_pertinence);
        break;
      case 'nom':
        filtered.sort((a, b) => a.raison_sociale.localeCompare(b.raison_sociale));
        break;
      case 'ville':
        filtered.sort((a, b) => (a.ville || '').localeCompare(b.ville || ''));
        break;
    }
    
    return filtered;
  }, [prospects, searchQuery, selectedSecteur, selectedZone, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: prospects.length,
    highScore: prospects.filter(p => p.score_pertinence >= 90).length,
    nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
    convertis: prospects.filter(p => p.statut === 'converti').length,
  }), [prospects]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Prospection CEE</h1>
              <p className="text-slate-400 mt-1 text-sm lg:text-base">
                Cibles haute valeur pour partenariats IND-UT-102
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total prospects</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Score ≥ 90</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.highScore}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Nouveaux</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.nouveaux}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Convertis</p>
                <p className="text-2xl font-bold text-violet-400">{stats.convertis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par nom, activité, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            {/* Toggle filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors lg:hidden"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filtres desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <select
                value={selectedSecteur}
                onChange={(e) => setSelectedSecteur(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                {SECTEURS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                {ZONES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'nom' | 'ville')}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="score">Tri: Pertinence</option>
                <option value="nom">Tri: Nom A-Z</option>
                <option value="ville">Tri: Ville</option>
              </select>
            </div>
          </div>

          {/* Filtres mobile */}
          {showFilters && (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-700 lg:hidden">
              <select
                value={selectedSecteur}
                onChange={(e) => setSelectedSecteur(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white"
              >
                {SECTEURS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white"
              >
                {ZONES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'nom' | 'ville')}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white"
              >
                <option value="score">Tri: Pertinence</option>
                <option value="nom">Tri: Nom A-Z</option>
                <option value="ville">Tri: Ville</option>
              </select>
            </div>
          )}
        </div>

        {/* Liste des prospects */}
        <div className="space-y-4">
          {filteredProspects.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Aucun prospect trouvé</h3>
              <p className="text-slate-400">
                Modifiez vos critères de recherche ou actualisez la liste.
              </p>
            </div>
          ) : (
            filteredProspects.map(prospect => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                onStatusChange={(newStatus) => handleStatusChange(prospect.id, newStatus)}
                onCopyMessage={() => {}}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{filteredProspects.length} prospect(s) affiché(s)</span>
            <span>v1.0.0 - CAPITAL ÉNERGIE</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
