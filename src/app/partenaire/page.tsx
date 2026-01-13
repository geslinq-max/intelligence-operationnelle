'use client';

import { useState, useMemo } from 'react';
import { APP_VERSION_FULL } from '@/lib/config/constants';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute, ROLE_CONFIG } from '@/contexts/AuthContext';
import {
  Briefcase,
  Users,
  Euro,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Bell,
  Shield,
  Zap,
  Crown,
  Building2,
  XCircle
} from 'lucide-react';

// ============================================================================
// DONNÉES DE DÉMONSTRATION - COCKPIT PARTENAIRE (SOLDAT)
// Note: Uniquement les clients propres du partenaire, AUCUNE donnée globale
// ============================================================================

// Stats du partenaire (ses propres clients uniquement)
const PARTENAIRE_STATS = {
  clientsPropres: 28,
  volumePersonnel: 11760, // MRR de SES clients uniquement
  commissionTaux: 20, // 20% de commission
  commissionMensuelle: 2352, // 20% de 11760
  clientsRisque: 3,
  clientsFideles: 22,
};

// Clients du partenaire (données propres uniquement)
const MES_CLIENTS = [
  { 
    id: 'cli_001',
    nom: 'Chauffage Pro Lyon',
    forfait: 'serenite',
    mrr: 349,
    dateAdhesion: '2024-06-15',
    dernierContact: '2025-01-10',
    risqueDesabo: false,
    sante: 95
  },
  { 
    id: 'cli_002',
    nom: 'Isolation Expert 69',
    forfait: 'expert',
    mrr: 860,
    dateAdhesion: '2024-04-22',
    dernierContact: '2025-01-08',
    risqueDesabo: false,
    sante: 98
  },
  { 
    id: 'cli_003',
    nom: 'Énergie Verte Rhône',
    forfait: 'serenite',
    mrr: 349,
    dateAdhesion: '2024-08-03',
    dernierContact: '2024-12-15',
    risqueDesabo: true,
    sante: 45
  },
  { 
    id: 'cli_004',
    nom: 'Thermique Solutions',
    forfait: 'essentiel',
    mrr: 149,
    dateAdhesion: '2024-09-10',
    dernierContact: '2025-01-12',
    risqueDesabo: false,
    sante: 82
  },
  { 
    id: 'cli_005',
    nom: 'PAC Alpes Services',
    forfait: 'expert',
    mrr: 860,
    dateAdhesion: '2024-03-18',
    dernierContact: '2024-11-28',
    risqueDesabo: true,
    sante: 38
  },
  { 
    id: 'cli_006',
    nom: 'Rénovation Confort',
    forfait: 'serenite',
    mrr: 349,
    dateAdhesion: '2024-07-05',
    dernierContact: '2025-01-05',
    risqueDesabo: false,
    sante: 88
  },
  { 
    id: 'cli_007',
    nom: 'Artisan Climat 42',
    forfait: 'essentiel',
    mrr: 149,
    dateAdhesion: '2024-10-20',
    dernierContact: '2024-12-01',
    risqueDesabo: true,
    sante: 52
  },
  { 
    id: 'cli_008',
    nom: 'EcoTherm Bâtiment',
    forfait: 'serenite',
    mrr: 349,
    dateAdhesion: '2024-05-12',
    dernierContact: '2025-01-11',
    risqueDesabo: false,
    sante: 91
  },
];

// Forfaits config
const FORFAIT_CONFIG = {
  essentiel: { label: 'Essentiel', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: Shield },
  serenite: { label: 'Sérénité', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Zap },
  expert: { label: 'Expert', color: 'text-violet-400', bg: 'bg-violet-500/20', icon: Crown },
};

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
  color = 'cyan',
  alert = false
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'emerald' | 'amber' | 'violet' | 'cyan' | 'red';
  alert?: boolean;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`bg-slate-800/50 border rounded-xl p-5 hover:border-slate-600 transition-all ${
      alert ? 'border-red-500/50' : 'border-slate-700'
    }`}>
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
    <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-cyan-500/30 rounded-xl flex items-center justify-center">
          <Euro className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Votre Commission</h3>
          <p className="text-cyan-300 text-sm">{PARTENAIRE_STATS.commissionTaux}% sur vos clients</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Ce mois</p>
          <p className="text-2xl font-bold text-cyan-400">{PARTENAIRE_STATS.commissionMensuelle.toLocaleString()} €</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-xs mb-1">Projection annuelle</p>
          <p className="text-2xl font-bold text-white">{(PARTENAIRE_STATS.commissionMensuelle * 12).toLocaleString()} €</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">MRR de vos clients</span>
          <span className="text-white font-medium">{PARTENAIRE_STATS.volumePersonnel.toLocaleString()} €</span>
        </div>
      </div>
    </div>
  );
}

// Radar de Rétention - Alerte désabonnement
function RadarRetention() {
  const clientsARisque = MES_CLIENTS.filter(c => c.risqueDesabo);
  
  return (
    <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Radar de Rétention</h3>
          <p className="text-red-400 text-sm">{clientsARisque.length} client(s) à risque de désabonnement</p>
        </div>
      </div>

      {clientsARisque.length > 0 ? (
        <div className="space-y-3">
          {clientsARisque.map(client => {
            const ForfaitIcon = FORFAIT_CONFIG[client.forfait as keyof typeof FORFAIT_CONFIG].icon;
            const joursSansContact = Math.floor((new Date().getTime() - new Date(client.dernierContact).getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div 
                key={client.id}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{client.nom}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <ForfaitIcon className="w-3 h-3" />
                        {FORFAIT_CONFIG[client.forfait as keyof typeof FORFAIT_CONFIG].label} • {client.mrr} €/mois
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 text-sm font-medium">Santé: {client.sante}%</p>
                    <p className="text-slate-500 text-xs">{joursSansContact} jours sans contact</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                    <Phone className="w-4 h-4" />
                    Appeler
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-sm rounded-lg transition-colors">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-emerald-400 font-medium">Tous vos clients sont en bonne santé !</p>
          <p className="text-slate-500 text-sm">Aucun risque de désabonnement détecté</p>
        </div>
      )}
    </div>
  );
}

function MesClientsTable() {
  const [filter, setFilter] = useState<'tous' | 'risque' | 'sains'>('tous');
  
  const clientsFiltres = useMemo(() => {
    switch (filter) {
      case 'risque':
        return MES_CLIENTS.filter(c => c.risqueDesabo);
      case 'sains':
        return MES_CLIENTS.filter(c => !c.risqueDesabo);
      default:
        return MES_CLIENTS;
    }
  }, [filter]);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Mes Clients</h3>
            <p className="text-slate-400 text-sm">{MES_CLIENTS.length} clients dans votre portefeuille</p>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="flex gap-2">
          {[
            { key: 'tous', label: 'Tous', count: MES_CLIENTS.length },
            { key: 'sains', label: 'Sains', count: MES_CLIENTS.filter(c => !c.risqueDesabo).length },
            { key: 'risque', label: 'À risque', count: MES_CLIENTS.filter(c => c.risqueDesabo).length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key 
                  ? f.key === 'risque' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Header tableau */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-slate-900/50 text-xs font-medium text-slate-400">
        <div className="col-span-4">Client</div>
        <div className="col-span-2 text-center">Forfait</div>
        <div className="col-span-2 text-center">MRR</div>
        <div className="col-span-2 text-center">Santé</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>

      {/* Lignes */}
      <div className="divide-y divide-slate-800">
        {clientsFiltres.map(client => {
          const forfaitConfig = FORFAIT_CONFIG[client.forfait as keyof typeof FORFAIT_CONFIG];
          const ForfaitIcon = forfaitConfig.icon;
          
          return (
            <div 
              key={client.id}
              className={`p-4 hover:bg-slate-800/30 transition-colors ${
                client.risqueDesabo ? 'bg-red-500/5' : ''
              }`}
            >
              <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                {/* Client */}
                <div className="col-span-4 flex items-center gap-3 mb-3 lg:mb-0">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{client.nom}</p>
                    <p className="text-slate-500 text-xs">
                      Depuis {new Date(client.dateAdhesion).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Forfait */}
                <div className="col-span-2 text-center mb-2 lg:mb-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${forfaitConfig.bg} ${forfaitConfig.color}`}>
                    <ForfaitIcon className="w-3 h-3" />
                    {forfaitConfig.label}
                  </span>
                </div>

                {/* MRR */}
                <div className="col-span-2 text-center mb-2 lg:mb-0">
                  <span className="text-emerald-400 font-bold">{client.mrr} €</span>
                  <span className="text-slate-500 text-xs">/mois</span>
                </div>

                {/* Santé */}
                <div className="col-span-2 text-center mb-3 lg:mb-0">
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-medium ${
                      client.sante >= 80 ? 'text-emerald-400' :
                      client.sante >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {client.sante}%
                    </span>
                    <div className="w-full max-w-[60px] h-1.5 bg-slate-700 rounded-full mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          client.sante >= 80 ? 'bg-emerald-500' :
                          client.sante >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${client.sante}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-center gap-2">
                  <button className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE - PARTENAIRE (CLÉ SOLDAT)
// ============================================================================

function PartenairePageContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Cockpit de Rente</h1>
              <p className="text-cyan-400 text-sm font-medium">
                {ROLE_CONFIG.partenaire.cle} • Gestion de votre portefeuille
              </p>
            </div>
          </div>
          <p className="text-slate-400 mt-2">
            Bienvenue {user?.nom}. Gérez vos clients et maximisez votre commission.
          </p>
        </header>

        {/* Stats principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Mes Clients"
            value={PARTENAIRE_STATS.clientsPropres.toString()}
            subtitle="Dans votre portefeuille"
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Mon Volume"
            value={`${PARTENAIRE_STATS.volumePersonnel.toLocaleString()} €`}
            subtitle="MRR de vos clients"
            icon={Euro}
            trend="up"
            trendValue="+8.2%"
            color="emerald"
          />
          <StatCard
            title="Ma Commission"
            value={`${PARTENAIRE_STATS.commissionMensuelle.toLocaleString()} €`}
            subtitle={`${PARTENAIRE_STATS.commissionTaux}% mensuel`}
            icon={TrendingUp}
            color="violet"
          />
          <StatCard
            title="Clients à Risque"
            value={PARTENAIRE_STATS.clientsRisque.toString()}
            subtitle="Nécessitent attention"
            icon={AlertTriangle}
            color="red"
            alert={PARTENAIRE_STATS.clientsRisque > 0}
          />
        </div>

        {/* Commission et Radar Rétention */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <CommissionCard />
          <RadarRetention />
        </div>

        {/* Tableau clients */}
        <MesClientsTable />

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Espace Partenaire — Commission {PARTENAIRE_STATS.commissionTaux}%</span>
            <span>{APP_VERSION_FULL}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function PartenairePage() {
  return (
    <ProtectedRoute allowedRoles={['fondateur', 'manager', 'partenaire']}>
      <PartenairePageContent />
    </ProtectedRoute>
  );
}
