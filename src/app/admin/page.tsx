'use client';

import { useState, useMemo } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute, ROLE_CONFIG } from '@/contexts/AuthContext';
import {
  Crown,
  TrendingUp,
  Users,
  Euro,
  Target,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building2,
  Calendar,
  PieChart
} from 'lucide-react';

// ============================================================================
// DONNÉES DE DÉMONSTRATION - CERVEAU FONDATEUR
// ============================================================================

// Données financières globales (EXCLUSIF FONDATEUR)
const FINANCE_DATA = {
  mrr: 47850,
  mrrGrowth: 12.5,
  arr: 574200,
  marge: 70, // 70% de marge - CONFIDENTIEL
  margeAbsolue: 33495,
  totalClients: 127,
  clientsActifs: 118,
  churnRate: 2.1,
  ltv: 4520,
  cac: 380,
};

// Historique MRR (6 derniers mois)
const MRR_HISTORY = [
  { mois: 'Août', mrr: 32000, marge: 22400 },
  { mois: 'Sept', mrr: 36500, marge: 25550 },
  { mois: 'Oct', mrr: 41200, marge: 28840 },
  { mois: 'Nov', mrr: 44100, marge: 30870 },
  { mois: 'Déc', mrr: 45800, marge: 32060 },
  { mois: 'Jan', mrr: 47850, marge: 33495 },
];

// Leaderboard vendeurs
const VENDEURS_DATA = [
  { id: '1', nom: 'Marie Laurent', role: 'Manager', clients: 34, mrr: 14280, commission: 1428, trend: 'up' },
  { id: '2', nom: 'Thomas Bernard', role: 'Partenaire', clients: 28, mrr: 11760, commission: 2352, trend: 'up' },
  { id: '3', nom: 'Sophie Durand', role: 'Partenaire', clients: 22, mrr: 9240, commission: 1848, trend: 'stable' },
  { id: '4', nom: 'Lucas Martin', role: 'Partenaire', clients: 19, mrr: 7980, commission: 1596, trend: 'up' },
  { id: '5', nom: 'Emma Petit', role: 'Partenaire', clients: 15, mrr: 6300, commission: 1260, trend: 'down' },
];

// Répartition des forfaits
const FORFAITS_REPARTITION = [
  { nom: 'Essentiel', clients: 42, mrr: 6258, pourcentage: 33 },
  { nom: 'Sérénité', clients: 58, mrr: 20242, pourcentage: 46 },
  { nom: 'Expert', clients: 27, mrr: 23220, pourcentage: 21 },
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
  color = 'emerald'
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

function MargeChart() {
  const maxMRR = Math.max(...MRR_HISTORY.map(m => m.mrr));
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Évolution MRR & Marge 70%</h3>
          <p className="text-slate-400 text-sm">6 derniers mois - Données confidentielles</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-slate-400 text-sm">MRR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span className="text-slate-400 text-sm">Marge (70%)</span>
          </div>
        </div>
      </div>
      
      {/* Graphique simplifié */}
      <div className="flex items-end gap-4 h-48">
        {MRR_HISTORY.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-1 items-end h-40">
              {/* Barre MRR */}
              <div 
                className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all hover:opacity-80"
                style={{ height: `${(data.mrr / maxMRR) * 100}%` }}
                title={`MRR: ${data.mrr.toLocaleString()} €`}
              />
              {/* Barre Marge */}
              <div 
                className="flex-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all hover:opacity-80"
                style={{ height: `${(data.marge / maxMRR) * 100}%` }}
                title={`Marge: ${data.marge.toLocaleString()} €`}
              />
            </div>
            <span className="text-slate-500 text-xs">{data.mois}</span>
          </div>
        ))}
      </div>
      
      {/* Résumé */}
      <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-slate-400 text-xs">MRR Actuel</p>
          <p className="text-emerald-400 font-bold">{FINANCE_DATA.mrr.toLocaleString()} €</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Marge Nette</p>
          <p className="text-amber-400 font-bold">{FINANCE_DATA.margeAbsolue.toLocaleString()} €</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Taux de Marge</p>
          <p className="text-white font-bold">{FINANCE_DATA.marge}%</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardVendeurs() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Leaderboard Vendeurs</h3>
            <p className="text-slate-400 text-sm">Performance commerciale</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {VENDEURS_DATA.map((vendeur, index) => (
          <div 
            key={vendeur.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
              index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900/50 hover:bg-slate-900'
            }`}
          >
            {/* Rang */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              index === 0 ? 'bg-amber-500 text-black' :
              index === 1 ? 'bg-slate-400 text-black' :
              index === 2 ? 'bg-amber-700 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>
              {index + 1}
            </div>

            {/* Info vendeur */}
            <div className="flex-1">
              <p className="text-white font-medium">{vendeur.nom}</p>
              <p className="text-slate-500 text-xs">{vendeur.role} • {vendeur.clients} clients</p>
            </div>

            {/* MRR généré */}
            <div className="text-right">
              <p className="text-emerald-400 font-bold">{vendeur.mrr.toLocaleString()} €</p>
              <p className="text-slate-500 text-xs">MRR généré</p>
            </div>

            {/* Trend */}
            <div className={`w-6 h-6 flex items-center justify-center rounded ${
              vendeur.trend === 'up' ? 'text-emerald-400' :
              vendeur.trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {vendeur.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
               vendeur.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
               <span className="text-xs">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForfaitsRepartition() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center border border-violet-500/30">
          <PieChart className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Répartition Forfaits</h3>
          <p className="text-slate-400 text-sm">Distribution du portefeuille</p>
        </div>
      </div>

      <div className="space-y-4">
        {FORFAITS_REPARTITION.map((forfait) => (
          <div key={forfait.nom}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{forfait.nom}</span>
              <span className="text-slate-400 text-sm">{forfait.clients} clients • {forfait.mrr.toLocaleString()} €</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  forfait.nom === 'Essentiel' ? 'bg-slate-500' :
                  forfait.nom === 'Sérénité' ? 'bg-emerald-500' : 'bg-violet-500'
                }`}
                style={{ width: `${forfait.pourcentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE - ADMIN (CLÉ FONDATEUR)
// ============================================================================

function AdminPageContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Le Cerveau</h1>
              <p className="text-amber-400 text-sm font-medium">
                {ROLE_CONFIG.fondateur.cle} • Vision Stratégique Complète
              </p>
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            Bienvenue {user?.nom}. Accès exclusif aux données financières et à la marge globale.
          </p>
        </header>

        {/* Alerte confidentialité */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-200 text-sm">
            <strong>Zone Confidentielle</strong> — Les données de marge (70%) affichées ici sont exclusives au Fondateur. 
            Elles ne transitent jamais vers les espaces Manager ou Partenaire.
          </p>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="MRR Global"
            value={`${FINANCE_DATA.mrr.toLocaleString()} €`}
            subtitle="Monthly Recurring Revenue"
            icon={Euro}
            trend="up"
            trendValue={`+${FINANCE_DATA.mrrGrowth}%`}
            color="emerald"
          />
          <StatCard
            title="Marge Nette (70%)"
            value={`${FINANCE_DATA.margeAbsolue.toLocaleString()} €`}
            subtitle="Profit mensuel après commissions"
            icon={TrendingUp}
            trend="up"
            trendValue="+15.2%"
            color="amber"
          />
          <StatCard
            title="ARR Projeté"
            value={`${(FINANCE_DATA.arr / 1000).toFixed(0)}K €`}
            subtitle="Annual Recurring Revenue"
            icon={Target}
            color="violet"
          />
          <StatCard
            title="Clients Actifs"
            value={FINANCE_DATA.clientsActifs.toString()}
            subtitle={`Churn: ${FINANCE_DATA.churnRate}%`}
            icon={Users}
            color="cyan"
          />
        </div>

        {/* Graphique Marge */}
        <div className="mb-8">
          <MargeChart />
        </div>

        {/* Grille inférieure */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LeaderboardVendeurs />
          <ForfaitsRepartition />
        </div>

        {/* Métriques avancées */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">LTV Client</p>
            <p className="text-xl font-bold text-white">{FINANCE_DATA.ltv.toLocaleString()} €</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">CAC</p>
            <p className="text-xl font-bold text-white">{FINANCE_DATA.cac} €</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Ratio LTV/CAC</p>
            <p className="text-xl font-bold text-emerald-400">{(FINANCE_DATA.ltv / FINANCE_DATA.cac).toFixed(1)}x</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Payback Period</p>
            <p className="text-xl font-bold text-white">{Math.ceil(FINANCE_DATA.cac / (FINANCE_DATA.mrr / FINANCE_DATA.clientsActifs))} mois</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Espace Fondateur — Données confidentielles</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['fondateur']}>
      <AdminPageContent />
    </ProtectedRoute>
  );
}
