'use client';

import { useState, useEffect } from 'react';
import { APP_VERSION_FULL, FOOTER_LABELS } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { Zap, Loader2, FolderOpen, Euro } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dossiersEnCours, setDossiersEnCours] = useState(0);
  const [commissionsAPercevoir, setCommissionsAPercevoir] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: dossiers } = await supabase
        .from('dossiers_cee')
        .select('id, statut, commission')
        .eq('statut', 'en_cours');
      
      setDossiersEnCours(dossiers?.length || 0);
      
      const totalCommissions = dossiers?.reduce((sum, d) => sum + (d.commission || 0), 0) || 0;
      setCommissionsAPercevoir(totalCommissions);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMontant = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')} k€`;
    }
    return `${value.toFixed(0)} €`;
  };

  const isEmpty = dossiersEnCours === 0 && commissionsAPercevoir === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 mt-1 text-sm lg:text-base">
                Gestion Administrative CEE
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs sm:text-sm">Opérationnel</span>
            </div>
          </div>
        </header>

        {/* Compteurs principaux */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Dossiers en cours */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Dossiers en cours</p>
                  <p className="text-3xl font-bold text-white">{dossiersEnCours}</p>
                </div>
              </div>
            </div>

            {/* Commissions à percevoir */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Euro className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Commissions à percevoir</p>
                  <p className="text-3xl font-bold text-white">{formatMontant(commissionsAPercevoir)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Zap className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Bienvenue sur CAPITAL ÉNERGIE
            </h2>
            <p className="text-slate-400 text-center max-w-md mb-8">
              Espace de gestion administrative CEE. 
              Les dossiers des artisans partenaires apparaîtront ici.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Système opérationnel</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
