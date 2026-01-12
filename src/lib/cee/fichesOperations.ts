/**
 * Fiches d'Opérations Standardisées CEE 2026
 * Base de calcul officielle pour les Certificats d'Économies d'Énergie
 * 
 * Source: Ministère de la Transition Énergétique - Arrêté du 22 décembre 2025
 */

export interface FicheOperationCEE {
  code: string;
  nom: string;
  secteur: 'IND' | 'BAT' | 'TRA' | 'AGR' | 'RES';
  description: string;
  uniteReference: string;
  kWhCumacParUnite: number;
  prixCEE_EUR_MWhCumac: number;
  conditionsEligibilite: string[];
  documentsRequis: string[];
  dureeVie: number; // années
  dateValidite: string;
}

export interface CalculCEE {
  ficheCode: string;
  ficheNom: string;
  quantite: number;
  unite: string;
  kWhCumacTotal: number;
  montantCEE: number;
  detailCalcul: string;
}

// Prix moyen CEE 2026 (€/MWh cumac)
const PRIX_CEE_2026 = 8.50;

// Fiches d'Opérations Standardisées - Industrie (IND)
export const FICHES_CEE_INDUSTRIE: FicheOperationCEE[] = [
  {
    code: 'IND-UT-102',
    nom: 'Système de variation électronique de vitesse sur moteur asynchrone',
    secteur: 'IND',
    description: 'Installation d\'un variateur de vitesse sur un moteur électrique asynchrone existant',
    uniteReference: 'kW',
    kWhCumacParUnite: 9200,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Puissance nominale du moteur ≥ 0,55 kW',
      'Variateur neuf avec marquage CE',
      'Installation par professionnel qualifié'
    ],
    documentsRequis: [
      'Facture détaillée',
      'Fiche technique variateur',
      'Attestation de fin de travaux'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-UT-103',
    nom: 'Système de récupération de chaleur sur compresseur d\'air',
    secteur: 'IND',
    description: 'Installation d\'un système de récupération de chaleur sur un compresseur d\'air existant',
    uniteReference: 'kW électrique',
    kWhCumacParUnite: 15600,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Compresseur d\'air à vis ou à pistons',
      'Puissance électrique ≥ 15 kW',
      'Efficacité de récupération ≥ 70%'
    ],
    documentsRequis: [
      'Facture équipement',
      'Schéma d\'installation',
      'Note de calcul thermique'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-UT-104',
    nom: 'Économiseur sur chaudière industrielle',
    secteur: 'IND',
    description: 'Installation d\'un économiseur permettant de préchauffer l\'eau ou l\'air par récupération de chaleur sur les fumées',
    uniteReference: 'kW thermique',
    kWhCumacParUnite: 25400,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Chaudière de puissance ≥ 400 kW',
      'Température des fumées avant économiseur ≥ 200°C',
      'Gain de rendement ≥ 3%'
    ],
    documentsRequis: [
      'Facture équipement et installation',
      'Mesures de température avant/après',
      'Attestation de conformité'
    ],
    dureeVie: 20,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-UT-116',
    nom: 'Système de management de l\'énergie',
    secteur: 'IND',
    description: 'Mise en place d\'un système de management de l\'énergie conforme à la norme ISO 50001',
    uniteReference: 'site',
    kWhCumacParUnite: 4500000,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Certification ISO 50001 obtenue',
      'Consommation site ≥ 1 GWh/an',
      'Plan d\'actions documenté'
    ],
    documentsRequis: [
      'Certificat ISO 50001',
      'Factures énergétiques N-1',
      'Plan d\'actions énergie'
    ],
    dureeVie: 3,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-UT-117',
    nom: 'Moteur premium (IE4)',
    secteur: 'IND',
    description: 'Remplacement d\'un moteur électrique par un moteur à haut rendement de classe IE4',
    uniteReference: 'kW',
    kWhCumacParUnite: 6800,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Moteur de classe IE4 minimum',
      'Puissance nominale ≥ 0,75 kW et ≤ 375 kW',
      'Remplacement d\'un moteur existant'
    ],
    documentsRequis: [
      'Facture moteur',
      'Fiche technique avec classe IE',
      'Preuve de mise au rebut ancien moteur'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-BA-112',
    nom: 'Isolation des points singuliers d\'un réseau',
    secteur: 'IND',
    description: 'Mise en place de matelas isolants sur les points singuliers d\'un réseau de fluide caloporteur',
    uniteReference: 'point singulier',
    kWhCumacParUnite: 12100,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Température du fluide ≥ 50°C',
      'Matelas démontable et réutilisable',
      'Épaisseur isolant ≥ 30 mm'
    ],
    documentsRequis: [
      'Facture matelas isolants',
      'Relevé des points singuliers',
      'Photos avant/après'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-UT-134',
    nom: 'Système de régulation sur un groupe de production de froid',
    secteur: 'IND',
    description: 'Installation d\'un système de régulation performant sur un groupe froid industriel',
    uniteReference: 'kW froid',
    kWhCumacParUnite: 4200,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Puissance frigorifique ≥ 50 kW',
      'Régulation haute et basse pression',
      'Système neuf avec supervision'
    ],
    documentsRequis: [
      'Facture système de régulation',
      'Schéma frigorifique',
      'Paramétrage régulation'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'IND-EN-101',
    nom: 'Audit énergétique industriel',
    secteur: 'IND',
    description: 'Réalisation d\'un audit énergétique conforme à la norme NF EN 16247',
    uniteReference: 'audit',
    kWhCumacParUnite: 850000,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Audit conforme NF EN 16247-3',
      'Auditeur qualifié OPQIBI ou équivalent',
      'Site non soumis à obligation d\'audit'
    ],
    documentsRequis: [
      'Rapport d\'audit complet',
      'Qualification de l\'auditeur',
      'Plan d\'actions chiffré'
    ],
    dureeVie: 4,
    dateValidite: '2026-12-31'
  }
];

// Fiches pour le secteur Bâtiment Tertiaire (BAT)
export const FICHES_CEE_BATIMENT: FicheOperationCEE[] = [
  {
    code: 'BAT-TH-116',
    nom: 'Système de gestion technique du bâtiment (GTB)',
    secteur: 'BAT',
    description: 'Installation d\'un système GTB pour la gestion du chauffage, de la climatisation et de l\'éclairage',
    uniteReference: 'm²',
    kWhCumacParUnite: 42,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Surface ≥ 1000 m²',
      'GTB de classe A ou B selon EN 15232',
      'Couvre au moins 2 usages énergétiques'
    ],
    documentsRequis: [
      'Facture GTB',
      'Certificat de conformité EN 15232',
      'Plan des zones couvertes'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  },
  {
    code: 'BAT-EQ-133',
    nom: 'Luminaires LED en remplacement d\'éclairage existant',
    secteur: 'BAT',
    description: 'Remplacement de luminaires existants par des luminaires à LED performants',
    uniteReference: 'kW LED installé',
    kWhCumacParUnite: 33800,
    prixCEE_EUR_MWhCumac: PRIX_CEE_2026,
    conditionsEligibilite: [
      'Efficacité lumineuse ≥ 120 lm/W',
      'Durée de vie ≥ 50 000 h',
      'Remplacement d\'éclairage existant'
    ],
    documentsRequis: [
      'Facture luminaires',
      'Fiches techniques LED',
      'État des lieux avant travaux'
    ],
    dureeVie: 15,
    dateValidite: '2026-12-31'
  }
];

/**
 * Recherche la fiche CEE correspondant à un domaine d'action
 */
export function trouverFicheCEE(domaine: string, description: string): FicheOperationCEE | null {
  const allFiches = [...FICHES_CEE_INDUSTRIE, ...FICHES_CEE_BATIMENT];
  
  const keywords: Record<string, string[]> = {
    'IND-UT-102': ['variateur', 'vitesse', 'moteur', 'vev'],
    'IND-UT-103': ['récupération', 'chaleur', 'compresseur', 'air comprimé'],
    'IND-UT-104': ['économiseur', 'chaudière', 'fumées'],
    'IND-UT-116': ['management', 'énergie', 'iso 50001', 'sme'],
    'IND-UT-117': ['moteur', 'ie4', 'premium', 'haut rendement'],
    'IND-BA-112': ['isolation', 'points singuliers', 'matelas', 'calorifuge'],
    'IND-UT-134': ['régulation', 'froid', 'frigorifique', 'climatisation industrielle'],
    'IND-EN-101': ['audit', 'diagnostic', 'analyse énergétique'],
    'BAT-TH-116': ['gtb', 'gestion technique', 'bâtiment', 'supervision'],
    'BAT-EQ-133': ['led', 'éclairage', 'luminaire', 'lampe']
  };

  const searchText = `${domaine} ${description}`.toLowerCase();
  
  for (const [code, terms] of Object.entries(keywords)) {
    if (terms.some(term => searchText.includes(term))) {
      return allFiches.find(f => f.code === code) || null;
    }
  }
  
  return null;
}

/**
 * Calcule le montant CEE pour une action donnée
 */
export function calculerMontantCEE(
  fiche: FicheOperationCEE,
  quantite: number
): CalculCEE {
  const kWhCumacTotal = fiche.kWhCumacParUnite * quantite;
  const montantCEE = (kWhCumacTotal / 1000) * fiche.prixCEE_EUR_MWhCumac;
  
  return {
    ficheCode: fiche.code,
    ficheNom: fiche.nom,
    quantite,
    unite: fiche.uniteReference,
    kWhCumacTotal,
    montantCEE: Math.round(montantCEE),
    detailCalcul: `${quantite} ${fiche.uniteReference} × ${fiche.kWhCumacParUnite.toLocaleString('fr-FR')} kWh cumac × ${fiche.prixCEE_EUR_MWhCumac} €/MWh = ${Math.round(montantCEE).toLocaleString('fr-FR')} €`
  };
}

/**
 * Estime la quantité basée sur l'investissement et le type d'équipement
 */
export function estimerQuantite(
  fiche: FicheOperationCEE,
  investissement: number
): number {
  // Coûts moyens par unité selon le type d'opération
  const coutsMoyens: Record<string, number> = {
    'IND-UT-102': 1500,   // €/kW pour variateur
    'IND-UT-103': 800,    // €/kW pour récup chaleur
    'IND-UT-104': 350,    // €/kW pour économiseur
    'IND-UT-116': 25000,  // € par site ISO 50001
    'IND-UT-117': 400,    // €/kW moteur IE4
    'IND-BA-112': 250,    // € par point singulier
    'IND-UT-134': 120,    // €/kW froid
    'IND-EN-101': 8000,   // € par audit
    'BAT-TH-116': 15,     // €/m²
    'BAT-EQ-133': 800,    // €/kW LED
  };
  
  const coutUnitaire = coutsMoyens[fiche.code] || 500;
  return Math.max(1, Math.round(investissement / coutUnitaire));
}

/**
 * Génère le calcul CEE complet pour une action
 */
export function genererCalculCEEPourAction(
  domaine: string,
  description: string,
  investissement: number
): CalculCEE | null {
  const fiche = trouverFicheCEE(domaine, description);
  if (!fiche) return null;
  
  const quantite = estimerQuantite(fiche, investissement);
  return calculerMontantCEE(fiche, quantite);
}

/**
 * FILTRE COHÉRENCE CRITIQUE
 * Filtre les codes CEE pour ne garder que ceux correspondant aux actions Architect
 * @param ceeCodes - Liste des codes CEE actuels
 * @param architectActions - Liste des actions recommandées par l'Architect
 * @returns Liste filtrée des codes CEE cohérents
 */
export function filtrerCEEParActions(
  ceeCodes: string[],
  architectActions: string[]
): string[] {
  if (!architectActions || architectActions.length === 0) {
    return ceeCodes; // Pas de filtrage si pas d'actions
  }

  // Mapping actions -> codes CEE autorisés
  const ACTION_TO_CEE: Record<string, string[]> = {
    'compresseur': ['IND-UT-103', 'IND-UT-102'],
    'air comprimé': ['IND-UT-103', 'IND-UT-102'],
    'moteur': ['IND-UT-102', 'IND-UT-117'],
    'variateur': ['IND-UT-102'],
    'pompe': ['IND-UT-102'],
    'ventilation': ['IND-UT-102'],
    'led': ['BAT-EQ-133'],
    'éclairage': ['BAT-EQ-133'],
    'néon': ['BAT-EQ-133'],
    'tube': ['BAT-EQ-133'],
    'chaudière': ['IND-UT-104'],
    'fumées': ['IND-UT-104'],
    'froid': ['IND-UT-134'],
    'climatisation': ['IND-UT-134'],
    'gtb': ['BAT-TH-116'],
    'gestion technique': ['BAT-TH-116'],
    'isolation': ['IND-BA-112'],
    'calorifuge': ['IND-BA-112'],
    'audit': ['IND-EN-101'],
    'iso 50001': ['IND-UT-116'],
    'management': ['IND-UT-116'],
  };

  // Collecter tous les codes CEE autorisés pour les actions
  const codesAutorises = new Set<string>();
  for (const action of architectActions) {
    const actionLower = action.toLowerCase();
    for (const [keyword, codes] of Object.entries(ACTION_TO_CEE)) {
      if (actionLower.includes(keyword)) {
        codes.forEach(code => codesAutorises.add(code));
      }
    }
  }

  // Si aucun mapping trouvé, retourner les codes originaux
  if (codesAutorises.size === 0) {
    return ceeCodes;
  }

  // Filtrer les codes CEE pour ne garder que ceux autorisés
  return ceeCodes.filter(code => codesAutorises.has(code));
}

/**
 * Recalcule le total des subventions basé sur les codes CEE filtrés
 * @param montantParCode - Map des montants par code CEE
 * @param codesFiltres - Codes CEE filtrés
 * @returns Total des subventions recalculé
 */
export function recalculerTotalSubventions(
  montantParCode: Record<string, number>,
  codesFiltres: string[]
): number {
  return codesFiltres.reduce((total, code) => {
    return total + (montantParCode[code] || 0);
  }, 0);
}

/**
 * Retourne toutes les fiches disponibles
 */
export function getAllFiches(): FicheOperationCEE[] {
  return [...FICHES_CEE_INDUSTRIE, ...FICHES_CEE_BATIMENT];
}

/**
 * Retourne une fiche par son code
 */
export function getFicheByCode(code: string): FicheOperationCEE | null {
  return getAllFiches().find(f => f.code === code) || null;
}
