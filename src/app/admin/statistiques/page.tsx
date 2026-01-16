'use client';

import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Euro,
  FileCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const STATS_DATA = {
  dossiersTotal: 156,
  dossiersValides: 142,
  dossiersPending: 14,
  tauxValidation: 91,
  chiffreAffaires: 45600,
  primesMoyennes: 2850,
  artisansActifs: 12,
  evolutionMensuelle: 15,
};

const MONTHLY_DATA = [
  { mois: 'Sep', dossiers: 18, ca: 5200 },
  { mois: 'Oct', dossiers: 22, ca: 6400 },
  { mois: 'Nov', dossiers: 28, ca: 8100 },
  { mois: 'Dec', dossiers: 35, ca: 9800 },
  { mois: 'Jan', dossiers: 42, ca: 12000 },
];

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  color = 'cyan'
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'emerald' | 'amber' | 'cyan' | 'violet';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-2">{subtitle}</p>}
    </div>
  );
}

function StatistiquesPageContent() {
  const { user } = useAuth();
  const maxDossiers = Math.max(...MONTHLY_DATA.map(m => m.dossiers));

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Statistiques</h1>
              <p className="text-cyan-400 text-sm font-medium">
                Vue d'ensemble de l'activite
              </p>
            </div>
          </div>
        </header>

        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Dossiers Valides"
            value={STATS_DATA.dossiersValides.toString()}
            subtitle={`sur ${STATS_DATA.dossiersTotal} total`}
            icon={FileCheck}
            trend="up"
            trendValue="+12%"
            color="emerald"
          />
          <StatCard
            title="Taux Validation"
            value={`${STATS_DATA.tauxValidation}%`}
            subtitle="Performance globale"
            icon={TrendingUp}
            trend="up"
            trendValue="+3%"
            color="cyan"
          />
          <StatCard
            title="Chiffre d'Affaires"
            value={`${STATS_DATA.chiffreAffaires.toLocaleString()} €`}
            subtitle="Total cumule"
            icon={Euro}
            trend="up"
            trendValue="+15%"
            color="amber"
          />
          <StatCard
            title="Artisans Actifs"
            value={STATS_DATA.artisansActifs.toString()}
            subtitle="Ce mois-ci"
            icon={Users}
            color="violet"
          />
        </div>

        {/* Graphique evolution */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Evolution Mensuelle</h2>
              <p className="text-slate-400 text-sm">Dossiers valides par mois</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-slate-400">Dossiers</span>
              </div>
            </div>
          </div>
          
          {/* Simple bar chart */}
          <div className="flex items-end justify-between gap-4 h-48">
            {MONTHLY_DATA.map((month) => (
              <div key={month.mois} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all hover:from-cyan-400 hover:to-cyan-300"
                  style={{ height: `${(month.dossiers / maxDossiers) * 100}%` }}
                ></div>
                <span className="text-slate-400 text-sm">{month.mois}</span>
                <span className="text-white font-medium">{month.dossiers}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs secondaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Primes CEE</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Prime moyenne</span>
                <span className="text-white font-bold">{STATS_DATA.primesMoyennes.toLocaleString()} €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Prime min</span>
                <span className="text-white font-medium">850 €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Prime max</span>
                <span className="text-white font-medium">5 200 €</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activite Recente</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dossiers cette semaine</span>
                <span className="text-emerald-400 font-bold">+8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nouveaux artisans</span>
                <span className="text-cyan-400 font-medium">+2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dossiers en attente</span>
                <span className="text-amber-400 font-medium">{STATS_DATA.dossiersPending}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StatistiquesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <StatistiquesPageContent />
    </ProtectedRoute>
  );
}
