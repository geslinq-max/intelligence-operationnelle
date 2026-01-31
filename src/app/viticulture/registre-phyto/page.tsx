'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf,
  ArrowLeft,
  Plus,
  FileDown,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  Filter,
  Search,
  Grape
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import PhytoRegistreForm from '@/components/phyto/PhytoRegistreForm';
import {
  TraitementPhyto,
  formatDateFR,
  getTypeLabel,
  getTypeColor,
  getJoursRestantsDAR
} from '@/lib/phyto/phyto-products';
import { downloadRegistrePhytoPDF } from '@/lib/pdf/registre-phyto-generator';

export default function RegistrePhytoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [traitements, setTraitements] = useState<TraitementPhyto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les traitements depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('registre-phyto');
    if (saved) {
      try {
        setTraitements(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur chargement registre:', e);
      }
    }
  }, []);

  // Sauvegarder les traitements
  useEffect(() => {
    if (traitements.length > 0) {
      localStorage.setItem('registre-phyto', JSON.stringify(traitements));
    }
  }, [traitements]);

  const handleAddTraitement = (traitement: TraitementPhyto) => {
    setTraitements(prev => [traitement, ...prev]);
    setShowForm(false);
    showToast({ type: 'success', title: 'Traitement enregistré avec succès !' });
  };

  const handleDeleteTraitement = (id: string) => {
    if (confirm('Supprimer ce traitement du registre ?')) {
      setTraitements(prev => prev.filter(t => t.id !== id));
      showToast({ type: 'info', title: 'Traitement supprimé' });
    }
  };

  const handleExportPDF = () => {
    if (traitements.length === 0) {
      showToast({ type: 'error', title: 'Aucun traitement à exporter' });
      return;
    }

    downloadRegistrePhytoPDF({
      exploitant: {
        nom: user?.email?.split('@')[0] || 'Exploitant',
        adresse: 'Adresse de l\'exploitation',
        siret: '123 456 789 00010'
      },
      traitements,
      dateGeneration: new Date().toISOString()
    });

    showToast({ type: 'success', title: 'Registre PDF téléchargé !' });
  };

  // Filtrage
  const filteredTraitements = traitements.filter(t => {
    const matchType = filterType === 'all' || t.produit.type === filterType;
    const matchSearch = searchQuery === '' || 
      t.parcelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.produit.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // Stats rapides
  const stats = {
    total: traitements.length,
    alertesDAR: traitements.filter(t => {
      const jours = getJoursRestantsDAR(t.date, t.produit.dar);
      return jours >= 0 && jours <= 7;
    }).length,
    dernierTraitement: traitements.length > 0 ? traitements[0].date : null
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <Grape className="w-5 h-5 text-purple-400" />
                Registre Phyto Express
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Saisie rapide • Alertes DAR • Export réglementaire
              </p>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={traitements.length === 0}
              className="hidden sm:flex items-center gap-2 px-4 py-3 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors touch-manipulation"
            >
              <FileDown className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs sm:text-sm text-slate-400">Traitements</p>
          </div>
          <div className={`bg-slate-800/50 border rounded-xl p-3 sm:p-4 text-center ${
            stats.alertesDAR > 0 ? 'border-amber-500/40' : 'border-slate-700'
          }`}>
            <p className={`text-2xl sm:text-3xl font-bold ${
              stats.alertesDAR > 0 ? 'text-amber-400' : 'text-white'
            }`}>{stats.alertesDAR}</p>
            <p className="text-xs sm:text-sm text-slate-400">Alertes DAR</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-sm sm:text-lg font-bold text-white">
              {stats.dernierTraitement ? formatDateFR(stats.dernierTraitement) : '-'}
            </p>
            <p className="text-xs sm:text-sm text-slate-400">Dernier</p>
          </div>
        </div>

        {/* Actions mobile */}
        <div className="flex gap-3 sm:hidden">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 min-h-[48px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-semibold transition-colors touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            Nouveau traitement
          </button>
          <button
            onClick={handleExportPDF}
            disabled={traitements.length === 0}
            className="p-3.5 min-h-[48px] min-w-[48px] bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl transition-colors touch-manipulation"
          >
            <FileDown className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire ou liste */}
        {showForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Nouveau traitement</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-400 hover:text-white"
              >
                Annuler
              </button>
            </div>
            <PhytoRegistreForm
              onSubmit={handleAddTraitement}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <>
            {/* Bouton nouveau traitement desktop */}
            <button
              onClick={() => setShowForm(true)}
              className="hidden sm:flex w-full items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-600 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Enregistrer un nouveau traitement (30 sec)
            </button>

            {/* Filtres */}
            {traitements.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher parcelle ou produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {(['all', 'fongicide', 'insecticide', 'herbicide'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition-colors touch-manipulation ${
                        filterType === type
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
                      }`}
                    >
                      {type === 'all' ? 'Tous' : getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des traitements */}
            {filteredTraitements.length > 0 ? (
              <div className="space-y-3">
                {filteredTraitements.map((traitement) => {
                  const joursRestants = getJoursRestantsDAR(traitement.date, traitement.produit.dar);
                  const isAlerte = joursRestants >= 0 && joursRestants <= 7;

                  return (
                    <div
                      key={traitement.id}
                      className={`bg-slate-800/50 border rounded-xl p-4 ${
                        isAlerte ? 'border-amber-500/40' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs border ${getTypeColor(traitement.produit.type)}`}>
                              {getTypeLabel(traitement.produit.type)}
                            </span>
                            {isAlerte && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                DAR
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-white font-medium">{traitement.produit.nom}</h3>
                          <p className="text-sm text-slate-400">
                            {traitement.parcelle} • {traitement.doseAppliquee} {traitement.produit.unite}
                          </p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateFR(traitement.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Récolte : {formatDateFR(traitement.dateRecolteAutorisee)}
                            </span>
                            <span>{traitement.operateur}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTraitement(traitement.id)}
                          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-colors touch-manipulation"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Barre de progression DAR */}
                      {joursRestants >= 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400">Délai Avant Récolte</span>
                            <span className={isAlerte ? 'text-amber-400 font-medium' : 'text-emerald-400'}>
                              {joursRestants} jour(s) restant(s)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isAlerte ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.max(0, Math.min(100, ((traitement.produit.dar - joursRestants) / traitement.produit.dar) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Leaf className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {traitements.length === 0 ? 'Aucun traitement enregistré' : 'Aucun résultat'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {traitements.length === 0 
                    ? 'Commencez par enregistrer votre premier traitement phytosanitaire.'
                    : 'Essayez de modifier vos filtres de recherche.'}
                </p>
                {traitements.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[48px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-semibold transition-colors touch-manipulation"
                  >
                    <Plus className="w-5 h-5" />
                    Premier traitement
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
