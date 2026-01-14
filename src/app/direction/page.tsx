'use client';

import { useState, useMemo } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute, ROLE_CONFIG } from '@/contexts/AuthContext';
import {
  Target,
  Users,
  Euro,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  UserPlus,
  BarChart3
} from 'lucide-react';

// ============================================================================
// DONNÉES RÉELLES - ESPACE MANAGER (POST-SANITIZATION)
// Note: AUCUNE donnée de marge globale ne transite ici
// ============================================================================

import { DIRECTION_DATA } from '@/lib/data/specimen-data';

// Volume de vente de l'équipe (basé sur le Spécimen uniquement)
const EQUIPE_STATS = {
  volumeVenteTotal: DIRECTION_DATA.volumeVenteTotal,
  nombreVendeurs: DIRECTION_DATA.nombreVendeurs,
  clientsTotaux: DIRECTION_DATA.clientsTotaux,
  nouveauxClientsMois: DIRECTION_DATA.nouveauxClientsMois,
  objectifMensuel: DIRECTION_DATA.objectifMensuel,
  commissionManager: DIRECTION_DATA.commissionManager,
};

// Commission du Manager (10% du volume)
const COMMISSION_MANAGER = {
  tauxCommission: DIRECTION_DATA.commissionManager,
  commissionMensuelle: DIRECTION_DATA.commissionMensuelle,
  commissionAnnuelle: DIRECTION_DATA.commissionMensuelle * 12,
};

// Performance de l'équipe commerciale - Vide (aucun compte fictif)
// Les vrais partenaires apparaîtront ici lors de leur création
const EQUIPE_VENDEURS: { 
  id: string; 
  nom: string; 
  clients: number; 
  volumeVente: number; 
  objectif: number;
  nouveauxMois: number;
  status: string;
  trend: string;
}[] = DIRECTION_DATA.equipe;

// Historique des ventes - Réinitialisé (départ janvier 2025)
const VENTES_HISTORY = [
  { mois: 'Jan 2025', volume: DIRECTION_DATA.volumeVenteTotal },
];

// ============================================================================
// COMPOSANTS
// ============================================================================

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'violet'
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'emerald' | 'amber' | 'violet' | 'cyan';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

function CommissionCard() {
  return (
    <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-violet-500/30 rounded-xl flex items-center justify-center">
          <Euro className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Votre Commission</h3>
          <p className="text-violet-300 text-sm">{COMMISSION_MANAGER.tauxCommission}% sur le volume équipe</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Ce mois</p>
          <p className="text-2xl font-bold text-violet-400">{COMMISSION_MANAGER.commissionMensuelle.toLocaleString()} €</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Projection annuelle</p>
          <p className="text-2xl font-bold text-white">{COMMISSION_MANAGER.commissionAnnuelle.toLocaleString()} €</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-violet-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Volume équipe base</span>
          <span className="text-white font-medium">{EQUIPE_STATS.volumeVenteTotal.toLocaleString()} €</span>
        </div>
      </div>
    </div>
  );
}

function ObjectifJauge() {
  const progression = (EQUIPE_STATS.volumeVenteTotal / EQUIPE_STATS.objectifMensuel) * 100;
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Objectif Mensuel</h3>
            <p className="text-slate-400 text-sm">{progression.toFixed(0)}% atteint</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{EQUIPE_STATS.volumeVenteTotal.toLocaleString()} €</p>
          <p className="text-slate-400 text-sm">/ {EQUIPE_STATS.objectifMensuel.toLocaleString()} €</p>
        </div>
      </div>
      
      <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            progression >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
            progression >= 80 ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' :
            progression >= 50 ? 'bg-gradient-to-r from-amber-500 to-cyan-500' :
            'bg-gradient-to-r from-red-500 to-amber-500'
          }`}
          style={{ width: `${Math.min(progression, 100)}%` }}
        />
        {/* Marqueur objectif */}
        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/50" />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>0%</span>
        <span>50%</span>
        <span>Objectif</span>
      </div>
    </div>
  );
}

function EquipeTable() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Performance Équipe</h3>
            <p className="text-slate-400 text-sm">{EQUIPE_VENDEURS.length} partenaires actifs</p>
          </div>
        </div>
      </div>

      {/* Header tableau */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-slate-900/50 text-xs font-medium text-slate-400">
        <div className="col-span-3">Partenaire</div>
        <div className="col-span-2 text-center">Clients</div>
        <div className="col-span-3 text-center">Volume Vente</div>
        <div className="col-span-2 text-center">Objectif</div>
        <div className="col-span-2 text-center">Nouveaux</div>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-slate-800">
        {EQUIPE_VENDEURS.map((vendeur) => {
          const progressionObjectif = (vendeur.volumeVente / vendeur.objectif) * 100;
          
          return (
            <div 
              key={vendeur.id}
              className={`p-4 hover:bg-slate-800/30 transition-colors ${
                vendeur.status === 'warning' ? 'bg-amber-500/5' : ''
              }`}
            >
              <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                {/* Partenaire */}
                <div className="col-span-3 flex items-center gap-3 mb-3 lg:mb-0">
                  <div className={`w-2 h-2 rounded-full ${
                    vendeur.status === 'actif' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{vendeur.nom}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      {vendeur.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                      {vendeur.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-400" />}
                      <span>Tendance {vendeur.trend === 'up' ? 'hausse' : vendeur.trend === 'down' ? 'baisse' : 'stable'}</span>
                    </div>
                  </div>
                </div>

                {/* Clients */}
                <div className="col-span-2 text-center mb-2 lg:mb-0">
                  <span className="text-white font-medium">{vendeur.clients}</span>
                  <span className="text-slate-500 text-xs lg:hidden ml-2">clients</span>
                </div>

                {/* Volume */}
                <div className="col-span-3 mb-2 lg:mb-0">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-emerald-400 font-bold">{vendeur.volumeVente.toLocaleString()} €</span>
                  </div>
                </div>

                {/* Objectif */}
                <div className="col-span-2 text-center mb-2 lg:mb-0">
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-medium ${
                      progressionObjectif >= 100 ? 'text-emerald-400' :
                      progressionObjectif >= 80 ? 'text-cyan-400' : 'text-amber-400'
                    }`}>
                      {progressionObjectif.toFixed(0)}%
                    </span>
                    <div className="w-full max-w-[80px] h-1.5 bg-slate-700 rounded-full mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          progressionObjectif >= 100 ? 'bg-emerald-500' :
                          progressionObjectif >= 80 ? 'bg-cyan-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(progressionObjectif, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nouveaux ce mois */}
                <div className="col-span-2 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    vendeur.nouveauxMois >= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                    vendeur.nouveauxMois >= 2 ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    <UserPlus className="w-3 h-3" />
                    +{vendeur.nouveauxMois}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VentesChart() {
  const maxVolume = Math.max(...VENTES_HISTORY.map(v => v.volume));
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Évolution Volume Équipe</h3>
          <p className="text-slate-400 text-sm">6 derniers mois</p>
        </div>
      </div>

      <div className="flex items-end gap-4 h-40">
        {VENTES_HISTORY.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all hover:opacity-80"
              style={{ height: `${(data.volume / maxVolume) * 100}%` }}
              title={`${data.volume.toLocaleString()} €`}
            />
            <span className="text-slate-500 text-xs">{data.mois}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE - DIRECTION (CLÉ MANAGER)
// ============================================================================

function DirectionPageContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Espace Direction</h1>
              <p className="text-violet-400 text-sm font-medium">
                {ROLE_CONFIG.manager.cle} • Bras Droit
              </p>
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            Bienvenue {user?.nom}. Pilotez la performance de votre équipe commerciale.
          </p>
        </header>

        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Volume Équipe"
            value={`${EQUIPE_STATS.volumeVenteTotal.toLocaleString()} €`}
            subtitle="MRR total généré"
            icon={Euro}
            trend="up"
            trendValue="+12.5%"
            color="emerald"
          />
          <StatCard
            title="Partenaires Actifs"
            value={EQUIPE_STATS.nombreVendeurs.toString()}
            subtitle="Dans votre équipe"
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Clients Totaux"
            value={EQUIPE_STATS.clientsTotaux.toString()}
            subtitle={`+${EQUIPE_STATS.nouveauxClientsMois} ce mois`}
            icon={Award}
            trend="up"
            trendValue={`+${EQUIPE_STATS.nouveauxClientsMois}`}
            color="violet"
          />
          <StatCard
            title="Taux Objectif"
            value={`${((EQUIPE_STATS.volumeVenteTotal / EQUIPE_STATS.objectifMensuel) * 100).toFixed(0)}%`}
            subtitle="Progression mensuelle"
            icon={Target}
            color="amber"
          />
        </div>

        {/* Commission et Objectif */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <CommissionCard />
          <ObjectifJauge />
        </div>

        {/* Graphique évolution */}
        <div className="mb-8">
          <VentesChart />
        </div>

        {/* Tableau équipe */}
        <EquipeTable />

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Espace Direction — Commission {COMMISSION_MANAGER.tauxCommission}%</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function DirectionPage() {
  return (
    <ProtectedRoute allowedRoles={['fondateur', 'manager']}>
      <DirectionPageContent />
    </ProtectedRoute>
  );
}
