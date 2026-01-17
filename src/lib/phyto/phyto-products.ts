// ============================================================================
// PRODUITS PHYTOSANITAIRES - Base de données et types
// Module Registre Phyto Express pour VITICULTURE
// ============================================================================

export interface PhytoProduct {
  id: string;
  nom: string;
  substanceActive: string;
  type: 'fongicide' | 'insecticide' | 'herbicide' | 'acaricide' | 'autre';
  dar: number; // Délai Avant Récolte en jours
  doseMax: string; // Dose maximale autorisée
  unite: 'L/ha' | 'kg/ha' | 'g/ha';
  znt: number; // Zone Non Traitée en mètres
  mentions: string[]; // Mentions de danger
}

export interface TraitementPhyto {
  id: string;
  date: string;
  parcelle: string;
  superficie: number; // en hectares
  produit: PhytoProduct;
  doseAppliquee: number;
  operateur: string;
  conditions?: string;
  dateRecolteAutorisee: string;
  alerteDAR: boolean;
}

export interface Parcelle {
  id: string;
  nom: string;
  superficie: number;
  cepage: string;
  commune: string;
}

// Base de données des produits phytosanitaires courants en viticulture
export const PHYTO_PRODUCTS: PhytoProduct[] = [
  // FONGICIDES
  {
    id: 'bouillie-bordelaise',
    nom: 'Bouillie Bordelaise RSR Disperss',
    substanceActive: 'Cuivre (hydroxyde)',
    type: 'fongicide',
    dar: 21,
    doseMax: '6',
    unite: 'kg/ha',
    znt: 5,
    mentions: ['H332', 'H410']
  },
  {
    id: 'forum-star',
    nom: 'Forum Star',
    substanceActive: 'Diméthomorphe + Folpel',
    type: 'fongicide',
    dar: 28,
    doseMax: '2.5',
    unite: 'kg/ha',
    znt: 20,
    mentions: ['H351', 'H317', 'H400', 'H410']
  },
  {
    id: 'mikal-flash',
    nom: 'Mikal Flash',
    substanceActive: 'Folpel + Fosétyl-aluminium',
    type: 'fongicide',
    dar: 28,
    doseMax: '4',
    unite: 'kg/ha',
    znt: 50,
    mentions: ['H351', 'H317', 'H332']
  },
  {
    id: 'profiler',
    nom: 'Profiler',
    substanceActive: 'Fluopicolide + Fosétyl-aluminium',
    type: 'fongicide',
    dar: 28,
    doseMax: '2.5',
    unite: 'kg/ha',
    znt: 20,
    mentions: ['H317', 'H410']
  },
  {
    id: 'soufre-mouillable',
    nom: 'Soufre Mouillable Micro 80',
    substanceActive: 'Soufre',
    type: 'fongicide',
    dar: 5,
    doseMax: '12.5',
    unite: 'kg/ha',
    znt: 5,
    mentions: ['H315']
  },
  {
    id: 'luna-privilege',
    nom: 'Luna Privilege',
    substanceActive: 'Fluopyram',
    type: 'fongicide',
    dar: 21,
    doseMax: '0.5',
    unite: 'L/ha',
    znt: 20,
    mentions: ['H361d', 'H400', 'H410']
  },
  // INSECTICIDES
  {
    id: 'decis-protech',
    nom: 'Decis Protech',
    substanceActive: 'Deltaméthrine',
    type: 'insecticide',
    dar: 7,
    doseMax: '0.42',
    unite: 'L/ha',
    znt: 50,
    mentions: ['H302', 'H400', 'H410']
  },
  {
    id: 'karate-zeon',
    nom: 'Karate Zeon',
    substanceActive: 'Lambda-cyhalothrine',
    type: 'insecticide',
    dar: 14,
    doseMax: '0.15',
    unite: 'L/ha',
    znt: 50,
    mentions: ['H302', 'H332', 'H400', 'H410']
  },
  {
    id: 'success-4',
    nom: 'Success 4',
    substanceActive: 'Spinosad',
    type: 'insecticide',
    dar: 7,
    doseMax: '0.2',
    unite: 'L/ha',
    znt: 5,
    mentions: ['H400', 'H410']
  },
  // HERBICIDES
  {
    id: 'glyphosate-360',
    nom: 'Roundup 360 Plus',
    substanceActive: 'Glyphosate',
    type: 'herbicide',
    dar: 28,
    doseMax: '4',
    unite: 'L/ha',
    znt: 5,
    mentions: ['H319', 'H411']
  },
  {
    id: 'basta-f1',
    nom: 'Basta F1',
    substanceActive: 'Glufosinate-ammonium',
    type: 'herbicide',
    dar: 56,
    doseMax: '5',
    unite: 'L/ha',
    znt: 5,
    mentions: ['H302', 'H317', 'H360d', 'H400', 'H410']
  },
  // ACARICIDES
  {
    id: 'envidor',
    nom: 'Envidor',
    substanceActive: 'Spirodiclofène',
    type: 'acaricide',
    dar: 28,
    doseMax: '0.4',
    unite: 'L/ha',
    znt: 20,
    mentions: ['H361fd', 'H400', 'H410']
  }
];

// Parcelles de démonstration
export const DEMO_PARCELLES: Parcelle[] = [
  { id: 'p1', nom: 'Les Grands Crus', superficie: 2.5, cepage: 'Merlot', commune: 'Saint-Émilion' },
  { id: 'p2', nom: 'Côte Sud', superficie: 1.8, cepage: 'Cabernet Sauvignon', commune: 'Pauillac' },
  { id: 'p3', nom: 'Le Plateau', superficie: 3.2, cepage: 'Chardonnay', commune: 'Meursault' },
  { id: 'p4', nom: 'Clos des Vignes', superficie: 0.9, cepage: 'Pinot Noir', commune: 'Gevrey-Chambertin' },
  { id: 'p5', nom: 'La Garenne', superficie: 4.1, cepage: 'Sauvignon Blanc', commune: 'Sancerre' },
];

// Fonctions utilitaires
export function calculateDateRecolteAutorisee(dateTraitement: string, dar: number): string {
  const date = new Date(dateTraitement);
  date.setDate(date.getDate() + dar);
  return date.toISOString().split('T')[0];
}

export function checkDARAlert(dateTraitement: string, dar: number, dateRecolte?: string): boolean {
  const dateAutorisee = new Date(calculateDateRecolteAutorisee(dateTraitement, dar));
  const today = new Date();
  
  if (dateRecolte) {
    const recolte = new Date(dateRecolte);
    return recolte < dateAutorisee;
  }
  
  // Alerte si on est à moins de 7 jours de la fin du DAR
  const joursRestants = Math.ceil((dateAutorisee.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return joursRestants <= 7 && joursRestants >= 0;
}

export function getJoursRestantsDAR(dateTraitement: string, dar: number): number {
  const dateAutorisee = new Date(calculateDateRecolteAutorisee(dateTraitement, dar));
  const today = new Date();
  return Math.ceil((dateAutorisee.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getProductById(id: string): PhytoProduct | undefined {
  return PHYTO_PRODUCTS.find(p => p.id === id);
}

export function getProductsByType(type: PhytoProduct['type']): PhytoProduct[] {
  return PHYTO_PRODUCTS.filter(p => p.type === type);
}

export function getTypeLabel(type: PhytoProduct['type']): string {
  const labels: Record<PhytoProduct['type'], string> = {
    fongicide: 'Fongicide',
    insecticide: 'Insecticide',
    herbicide: 'Herbicide',
    acaricide: 'Acaricide',
    autre: 'Autre'
  };
  return labels[type];
}

export function getTypeColor(type: PhytoProduct['type']): string {
  const colors: Record<PhytoProduct['type'], string> = {
    fongicide: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    insecticide: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    herbicide: 'bg-green-500/20 text-green-400 border-green-500/40',
    acaricide: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    autre: 'bg-slate-500/20 text-slate-400 border-slate-500/40'
  };
  return colors[type];
}
