'use client';

import Link from 'next/link';
import { useIndustry, IndustryTransitionWrapper, IndustryMode } from '@/contexts/IndustryContext';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar,
  Leaf,
  Trash2,
  ClipboardList,
  Truck,
  Grape,
  Droplets,
  MapPin,
  AlertTriangle,
  Plus,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  cards: DashboardCard[];
  actions?: { label: string; href: string }[];
}

// ============================================================================
// DONNÉES SPÉCIFIQUES PAR MODE
// ============================================================================

const DASHBOARD_DATA: Record<IndustryMode, DashboardModule[]> = {
  ARTISAN_CEE: [
    {
      id: 'dossiers_cee',
      title: 'Dossiers CEE',
      description: 'Suivi des certificats d\'économie d\'énergie',
      cards: [
        {
          title: 'Dossiers en cours',
          value: 24,
          subtitle: '+3 cette semaine',
          icon: <FileText className="w-6 h-6" />,
          color: 'text-emerald-400',
          trend: { value: 12, label: 'vs mois dernier' },
        },
        {
          title: 'Primes validées',
          value: '47 850 €',
          subtitle: 'Ce mois',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-cyan-400',
          trend: { value: 8, label: 'vs mois dernier' },
        },
        {
          title: 'Artisans actifs',
          value: 18,
          subtitle: '3 en attente',
          icon: <Users className="w-6 h-6" />,
          color: 'text-amber-400',
        },
        {
          title: 'Délai moyen',
          value: '12j',
          subtitle: 'Traitement dossier',
          icon: <Calendar className="w-6 h-6" />,
          color: 'text-purple-400',
          trend: { value: -15, label: 'amélioration' },
        },
      ],
      actions: [
        { label: 'Nouveau dossier', href: '/admin/dossiers/nouveau' },
        { label: 'Voir tous les dossiers', href: '/admin/dossiers' },
      ],
    },
  ],
  
  VITICULTURE: [
    {
      id: 'registre_phyto',
      title: 'Registre Phytosanitaire',
      description: 'Traçabilité des traitements',
      cards: [
        {
          title: 'Traitements ce mois',
          value: 8,
          subtitle: 'Conformes',
          icon: <Droplets className="w-6 h-6" />,
          color: 'text-purple-400',
        },
        {
          title: 'Parcelles actives',
          value: 42,
          subtitle: '156 hectares',
          icon: <MapPin className="w-6 h-6" />,
          color: 'text-green-400',
        },
        {
          title: 'Alertes IFT',
          value: 2,
          subtitle: 'À vérifier',
          icon: <AlertTriangle className="w-6 h-6" />,
          color: 'text-amber-400',
        },
        {
          title: 'Produits utilisés',
          value: 12,
          subtitle: 'Ce trimestre',
          icon: <Grape className="w-6 h-6" />,
          color: 'text-purple-400',
        },
      ],
      actions: [
        { label: 'Nouveau traitement', href: '/viticulture/traitement' },
        { label: 'Registre complet', href: '/viticulture/registre' },
      ],
    },
    {
      id: 'contrats_saisonniers',
      title: 'Contrats Saisonniers',
      description: 'Gestion du personnel viticole',
      cards: [
        {
          title: 'Saisonniers actifs',
          value: 24,
          subtitle: 'Vendanges 2026',
          icon: <Users className="w-6 h-6" />,
          color: 'text-emerald-400',
        },
        {
          title: 'Contrats à renouveler',
          value: 6,
          subtitle: 'Dans 30 jours',
          icon: <Calendar className="w-6 h-6" />,
          color: 'text-cyan-400',
        },
      ],
      actions: [
        { label: 'Nouveau contrat', href: '/viticulture/contrats/nouveau' },
      ],
    },
  ],
  
  PAYSAGISTE_DEMOLITION: [
    {
      id: 'bsd_dechets',
      title: 'Suivi BSD / Trackdéchets',
      description: 'Bordereaux de suivi des déchets',
      cards: [
        {
          title: 'BSD en cours',
          value: 15,
          subtitle: 'En attente de validation',
          icon: <ClipboardList className="w-6 h-6" />,
          color: 'text-amber-400',
        },
        {
          title: 'Tonnage évacué',
          value: '487 T',
          subtitle: 'Ce trimestre',
          icon: <Truck className="w-6 h-6" />,
          color: 'text-emerald-400',
          trend: { value: 23, label: 'vs trimestre précédent' },
        },
        {
          title: 'Chantiers actifs',
          value: 8,
          subtitle: '3 en démolition',
          icon: <Trash2 className="w-6 h-6" />,
          color: 'text-red-400',
        },
        {
          title: 'Déchets verts',
          value: '124 m³',
          subtitle: 'Collectés ce mois',
          icon: <Leaf className="w-6 h-6" />,
          color: 'text-green-400',
        },
      ],
      actions: [
        { label: 'Nouveau BSD', href: '/paysagiste/bsd/nouveau' },
        { label: 'Trackdéchets', href: '/paysagiste/trackdechets' },
      ],
    },
  ],
};

// ============================================================================
// COMPOSANTS
// ============================================================================

function StatCard({ card }: { card: DashboardCard }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-slate-700/50 ${card.color}`}>
          {card.icon}
        </div>
        {card.trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            card.trend.value > 0 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {card.trend.value > 0 ? '+' : ''}{card.trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
      <p className="text-sm text-slate-400">{card.title}</p>
      <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
    </div>
  );
}

function ModuleSection({ module }: { module: DashboardModule }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{module.title}</h2>
          <p className="text-sm text-slate-400">{module.description}</p>
        </div>
        {module.actions && module.actions.length > 0 && (
          <div className="flex gap-2">
            {module.actions.map((action, i) => (
              <a
                key={i}
                href={action.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === 0 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {action.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {module.cards.map((card, i) => (
          <StatCard key={i} card={card} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL EXPORTÉ
// ============================================================================

export default function IndustryDashboard() {
  const { currentMode, config } = useIndustry();
  const modules = DASHBOARD_DATA[currentMode] || [];

  return (
    <IndustryTransitionWrapper>
      {/* Header avec indicateur du mode */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{config.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-white">{config.label}</h1>
          <p className="text-sm text-slate-400">{config.description}</p>
        </div>
      </div>

      {/* Accès rapide Registre Phyto Express - Mode VITICULTURE uniquement */}
      {currentMode === 'VITICULTURE' && (
        <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/30 rounded-xl">
                <Grape className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Registre Phyto Express</h2>
                <p className="text-sm text-slate-300">Enregistrez un traitement en 30 secondes • Alertes DAR automatiques</p>
              </div>
            </div>
            <Link
              href="/viticulture/registre-phyto"
              className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              Nouveau Traitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Accès rapide BSD Express - Mode PAYSAGISTE uniquement */}
      {currentMode === 'PAYSAGISTE_DEMOLITION' && (
        <div className="mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/30 rounded-xl">
                <Truck className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">BSD Express</h2>
                <p className="text-sm text-slate-300">Créez un bordereau de suivi des déchets en quelques clics</p>
              </div>
            </div>
            <Link
              href="/paysagiste/bsd"
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-5 h-5" />
              Nouveau BSD
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Modules dynamiques */}
      {modules.map((module) => (
        <ModuleSection key={module.id} module={module} />
      ))}

      {/* Message si aucun module */}
      {modules.length === 0 && (
        <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
          <span className="text-5xl mb-4 block">{config.icon}</span>
          <p className="text-slate-400">Modules {config.label} en cours de configuration</p>
        </div>
      )}
    </IndustryTransitionWrapper>
  );
}

// ============================================================================
// COMPOSANT INDICATEUR COMPACT (pour headers)
// ============================================================================

export function IndustryIndicator() {
  const { config } = useIndustry();
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
      <span className="text-lg">{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.shortLabel}</span>
    </div>
  );
}
