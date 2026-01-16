'use client';

import { useState, useMemo } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import {
  Gauge,
  TrendingUp,
  Users,
  Euro,
  Shield,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Target,
  PieChart,
  Lock
} from 'lucide-react';

// ============================================================================
// DONNÉES DE DÉMONSTRATION - COMMAND CENTER
// ============================================================================

import { 
  COMPTEURS_GLOBAUX, 
  ARTISAN_SPECIMEN,
  DOSSIERS_SPECIMEN 
} from '@/lib/data/specimen-data';

// Données de trésorerie calculées
const TRESORERIE_DATA = {
  caTotal: 12450, // CA brut total encaissé
  capitalEnergie: Math.round(12450 * 0.70), // 70% = 8715 €
  management: Math.round(12450 * 0.10), // 10% = 1245 €
  vendeurs: Math.round(12450 * 0.20), // 20% = 2490 €
};

// Primes CEE sécurisées (dossiers validés par Scanner Flash)
const dossiersValides = DOSSIERS_SPECIMEN.filter(d => d.statut === 'valide');
const PRIMES_SECURISEES = dossiersValides.reduce((sum, d) => sum + d.prime_cee, 0);

// Leaderboard Vendeurs (données de démonstration)
const VENDEURS_LEADERBOARD = [
  { 
    id: 'VND-001', 
    nom: 'Thomas Bernard', 
    role: 'Partenaire Senior',
    abonnements: { jour: 1, semaine: 3, mois: 12 },
    ca: { jour: 349, semaine: 1047, mois: 4188 },
    commissions: { jour: 70, semaine: 209, mois: 838 },
    trend: 'up' as const,
  },
  { 
    id: 'VND-002', 
    nom: 'Sophie Martin', 
    role: 'Partenaire',
    abonnements: { jour: 0, semaine: 2, mois: 8 },
    ca: { jour: 0, semaine: 698, mois: 2792 },
    commissions: { jour: 0, semaine: 140, mois: 558 },
    trend: 'stable' as const,
  },
  { 
    id: 'VND-003', 
    nom: 'Lucas Dupont', 
    role: 'Partenaire Junior',
    abonnements: { jour: 0, semaine: 1, mois: 5 },
    ca: { jour: 0, semaine: 349, mois: 1745 },
    commissions: { jour: 0, semaine: 70, mois: 349 },
    trend: 'up' as const,
  },
  { 
    id: 'VND-004', 
    nom: 'Emma Leroy', 
    role: 'Partenaire',
    abonnements: { jour: 0, semaine: 0, mois: 3 },
    ca: { jour: 0, semaine: 0, mois: 1047 },
    commissions: { jour: 0, semaine: 0, mois: 209 },
    trend: 'down' as const,
  },
];

type PeriodFilter = 'jour' | 'semaine' | 'mois';

// ============================================================================
// COMPOSANTS
// ============================================================================

function KpiCard({ 
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

function DonutChart() {
  // Répartition 70/10/20
  const data = [
    { label: 'Capital Énergie', value: 70, color: '#10B981', amount: TRESORERIE_DATA.capitalEnergie },
    { label: 'Management', value: 10, color: '#8B5CF6', amount: TRESORERIE_DATA.management },
    { label: 'Vendeurs', value: 20, color: '#06B6D4', amount: TRESORERIE_DATA.vendeurs },
  ];

  // Calcul des segments du donut (SVG)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center border border-violet-500/30">
          <PieChart className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Répartition 70/10/20</h3>
          <p className="text-slate-400 text-sm">Distribution du CA encaissé</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8">
        {/* Donut SVG */}
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {data.map((segment, index) => {
              const strokeDasharray = `${(segment.value / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercent * circumference / 100;
              cumulativePercent += segment.value;

              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 80 80)"
                  className="transition-all duration-500"
                />
              );
            })}
            {/* Centre */}
            <circle cx="80" cy="80" r="45" fill="#0f172a" />
            <text x="80" y="75" textAnchor="middle" className="fill-white text-lg font-bold">
              {TRESORERIE_DATA.caTotal.toLocaleString()} €
            </text>
            <text x="80" y="95" textAnchor="middle" className="fill-slate-400 text-xs">
              CA Total
            </text>
          </svg>
        </div>

        {/* Légende */}
        <div className="space-y-4">
          {data.map((segment, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: segment.color }}
              />
              <div>
                <p className="text-white font-medium text-sm">{segment.label}</p>
                <p className="text-slate-400 text-xs">
                  {segment.value}% • {segment.amount.toLocaleString()} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardVendeurs({ filter }: { filter: PeriodFilter }) {
  const filterLabels: Record<PeriodFilter, string> = {
    jour: "Aujourd'hui",
    semaine: 'Cette semaine',
    mois: 'Ce mois',
  };

  // Trier par CA selon le filtre
  const sortedVendeurs = useMemo(() => {
    return [...VENDEURS_LEADERBOARD].sort((a, b) => b.ca[filter] - a.ca[filter]);
  }, [filter]);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Leaderboard Vendeurs</h3>
            <p className="text-slate-400 text-sm">Performance • {filterLabels[filter]}</p>
          </div>
        </div>
      </div>

      {/* En-têtes tableau */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700 mb-2">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Vendeur</div>
        <div className="col-span-2 text-center">Abos</div>
        <div className="col-span-3 text-right">CA généré</div>
        <div className="col-span-2 text-right">Commissions</div>
      </div>

      {/* Corps du tableau */}
      <div className="space-y-2">
        {sortedVendeurs.map((vendeur, index) => (
          <div 
            key={vendeur.id}
            className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-all ${
              index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900/50 hover:bg-slate-900'
            }`}
          >
            {/* Rang */}
            <div className="col-span-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                index === 0 ? 'bg-amber-500 text-black' :
                index === 1 ? 'bg-slate-400 text-black' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-700 text-slate-400'
              }`}>
                {index + 1}
              </div>
            </div>

            {/* Info vendeur */}
            <div className="col-span-4">
              <p className="text-white font-medium text-sm">{vendeur.nom}</p>
              <p className="text-slate-500 text-xs">{vendeur.role}</p>
            </div>

            {/* Abonnements */}
            <div className="col-span-2 text-center">
              <span className="text-white font-semibold">{vendeur.abonnements[filter]}</span>
            </div>

            {/* CA généré */}
            <div className="col-span-3 text-right">
              <p className="text-emerald-400 font-bold">{vendeur.ca[filter].toLocaleString()} €</p>
            </div>

            {/* Commissions */}
            <div className="col-span-2 text-right flex items-center justify-end gap-2">
              <p className="text-cyan-400 font-medium">{vendeur.commissions[filter].toLocaleString()} €</p>
              <div className={`w-5 h-5 flex items-center justify-center ${
                vendeur.trend === 'up' ? 'text-emerald-400' :
                vendeur.trend === 'down' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {vendeur.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                 vendeur.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
                 <span className="text-xs">—</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-12 gap-2 px-3">
        <div className="col-span-5 text-slate-400 font-medium">Total</div>
        <div className="col-span-2 text-center text-white font-bold">
          {sortedVendeurs.reduce((sum, v) => sum + v.abonnements[filter], 0)}
        </div>
        <div className="col-span-3 text-right text-emerald-400 font-bold">
          {sortedVendeurs.reduce((sum, v) => sum + v.ca[filter], 0).toLocaleString()} €
        </div>
        <div className="col-span-2 text-right text-cyan-400 font-bold">
          {sortedVendeurs.reduce((sum, v) => sum + v.commissions[filter], 0).toLocaleString()} €
        </div>
      </div>
    </div>
  );
}

function PeriodFilterButtons({ 
  selected, 
  onChange 
}: { 
  selected: PeriodFilter; 
  onChange: (filter: PeriodFilter) => void;
}) {
  const options: { value: PeriodFilter; label: string }[] = [
    { value: 'jour', label: 'Jour' },
    { value: 'semaine', label: 'Semaine' },
    { value: 'mois', label: 'Mois' },
  ];

  return (
    <div className="inline-flex bg-slate-800/50 border border-slate-700 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            selected === option.value
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE - COMMAND CENTER
// ============================================================================

function PilotagePageContent() {
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('mois');

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Command Center</h1>
              <p className="text-emerald-400 text-sm font-medium">
                Poste de Pilotage • Objectif 5 000 € net
              </p>
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            Bienvenue {user?.nom}. Suivi en temps réel de la trésorerie et des performances commerciales.
          </p>
        </header>

        {/* Alerte confidentialité */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-200 text-sm">
            <strong>Accès Restreint</strong> — Cette page est accessible uniquement au Fondateur et au Manager. 
            Les vendeurs n'ont aucune visibilité sur les marges globales.
          </p>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <KpiCard
            title="CA Total Encaissé"
            value={`${TRESORERIE_DATA.caTotal.toLocaleString()} €`}
            subtitle="Somme brute tous abonnements"
            icon={Euro}
            trend="up"
            trendValue="+12.5%"
            color="emerald"
          />
          <KpiCard
            title="Marge Capital Énergie"
            value={`${TRESORERIE_DATA.capitalEnergie.toLocaleString()} €`}
            subtitle="70% du CA • Profit net"
            icon={TrendingUp}
            trend="up"
            trendValue="+8.3%"
            color="amber"
          />
          <KpiCard
            title="Primes CEE Sécurisées"
            value={`${PRIMES_SECURISEES.toLocaleString()} €`}
            subtitle={`${dossiersValides.length} dossiers validés par Scanner Flash`}
            icon={Shield}
            color="cyan"
          />
        </div>

        {/* Donut Chart - Répartition 70/10/20 */}
        <div className="mb-8">
          <DonutChart />
        </div>

        {/* Filtre temporel + Leaderboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">Performance Commerciale</span>
            </div>
            <PeriodFilterButtons selected={periodFilter} onChange={setPeriodFilter} />
          </div>
          <LeaderboardVendeurs filter={periodFilter} />
        </div>

        {/* Objectif mensuel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center border border-violet-500/30">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Progression Objectif Mensuel</h3>
              <p className="text-slate-400 text-sm">Objectif : 5 000 € net / mois</p>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Marge nette actuelle</span>
              <span className="text-emerald-400 font-bold">{TRESORERIE_DATA.capitalEnergie.toLocaleString()} € / 5 000 €</span>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((TRESORERIE_DATA.capitalEnergie / 5000) * 100, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-slate-500 text-xs text-right">
            {((TRESORERIE_DATA.capitalEnergie / 5000) * 100).toFixed(1)}% de l'objectif atteint
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Command Center — Données confidentielles</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function PilotagePage() {
  return (
    <ProtectedRoute allowedRoles={['fondateur', 'manager']}>
      <PilotagePageContent />
    </ProtectedRoute>
  );
}
