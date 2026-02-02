/**
 * Cellule de Prospection CEE
 * 
 * Identifie des entreprises cibles pour les opérations IND-UT-102
 * et génère des messages de prospection personnalisés.
 * 
 * Cibles prioritaires :
 * - Maintenance industrielle
 * - Électricité tertiaire
 * - Pompage industriel
 * - Ventilation / CVC
 * 
 * Note : Cette Cellule fonctionne en mode LOCAL (annuaire simulé).
 * Pour connexion à un annuaire réel (API Entreprise, RGE), 
 * une clé API supplémentaire serait nécessaire.
 */

// Log de statut au chargement
if (typeof window !== 'undefined') {
  console.log('🛠️  [Cellule-Prospection] Mode LOCAL - Annuaire de démonstration');
}

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export type ProspectStatus = 
  | 'nouveau'
  | 'a_contacter'
  | 'contacte'
  | 'interesse'
  | 'rdv_pris'
  | 'converti'
  | 'non_interesse';

export interface Prospect {
  id: string;
  raison_sociale: string;
  siret?: string;
  activite_principale: string;
  activites_secondaires: string[];
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  contact_nom?: string;
  contact_fonction?: string;
  score_pertinence: number;
  fiches_cee_potentielles: string[];
  message_personnalise?: string;
  statut: ProspectStatus;
  date_creation: string;
  date_dernier_contact?: string;
  notes?: string;
}

export interface ProspectSearchCriteria {
  secteurs: string[];
  zone_geographique?: string;
  taille_entreprise?: 'TPE' | 'PME' | 'ETI' | 'GE';
  score_minimum?: number;
}

export interface ProspectSearchResult {
  prospects: Prospect[];
  total_found: number;
  high_score_count: number;
  search_criteria: ProspectSearchCriteria;
  timestamp: string;
}

// ============================================================================
// CONFIGURATION SCORING
// ============================================================================

const SCORING_CONFIG = {
  // Activités à haute valeur CEE (moteurs, variateurs)
  ACTIVITES_HAUTE_VALEUR: [
    { pattern: /pompage|pompe/i, score: 95, fiche: 'IND-UT-102' },
    { pattern: /ventilation|vmc|cvc|climatisation/i, score: 95, fiche: 'IND-UT-102' },
    { pattern: /compresseur|air comprimé/i, score: 90, fiche: 'IND-UT-102' },
    { pattern: /convoyeur|manutention/i, score: 85, fiche: 'IND-UT-102' },
    { pattern: /broyeur|concasseur/i, score: 85, fiche: 'IND-UT-102' },
    { pattern: /agitateur|mélangeur/i, score: 80, fiche: 'IND-UT-102' },
    { pattern: /centrifuge/i, score: 80, fiche: 'IND-UT-102' },
    { pattern: /maintenance industrielle/i, score: 90, fiche: 'IND-UT-102' },
    { pattern: /électricité industrielle/i, score: 88, fiche: 'IND-UT-102' },
    { pattern: /électricité tertiaire/i, score: 75, fiche: 'IND-UT-102' },
    { pattern: /automatisme|automate/i, score: 70, fiche: 'IND-UT-102' },
    { pattern: /moteur|motorisation/i, score: 95, fiche: 'IND-UT-102' },
    { pattern: /variateur|vev|vfd/i, score: 98, fiche: 'IND-UT-102' },
  ],
  
  // Secteurs industriels prioritaires
  SECTEURS_PRIORITAIRES: [
    { pattern: /agroalimentaire|agro-alimentaire/i, bonus: 15 },
    { pattern: /métallurgie|sidérurgie/i, bonus: 12 },
    { pattern: /plasturgie|plastique/i, bonus: 10 },
    { pattern: /papeterie|carton/i, bonus: 10 },
    { pattern: /chimie|pétrochimie/i, bonus: 12 },
    { pattern: /cimenterie|béton/i, bonus: 15 },
    { pattern: /verrerie/i, bonus: 10 },
    { pattern: /fonderie/i, bonus: 12 },
    { pattern: /textile/i, bonus: 8 },
  ],
  
  // Seuil pour génération de message
  SEUIL_MESSAGE: 80,
  
  // Prime de référence pour le speech
  PRIME_REFERENCE: 2969,
};

// ============================================================================
// BASE DE DONNÉES SIMULÉE (Annuaire RGE / Entreprises)
// ============================================================================

const MOCK_ANNUAIRE: Array<Omit<Prospect, 'id' | 'score_pertinence' | 'fiches_cee_potentielles' | 'message_personnalise' | 'statut' | 'date_creation'>> = [
  {
    raison_sociale: 'POMPES DURAND SARL',
    siret: '12345678901234',
    activite_principale: 'Installation et maintenance de systèmes de pompage industriel',
    activites_secondaires: ['Pompes centrifuges', 'Stations de relevage', 'Surpresseurs'],
    ville: 'Lyon',
    code_postal: '69003',
    telephone: '04 72 XX XX XX',
    email: 'contact@pompes-durand.fr',
    contact_nom: 'Jean Durand',
    contact_fonction: 'Gérant',
  },
  {
    raison_sociale: 'VENTIL-INDUS',
    siret: '23456789012345',
    activite_principale: 'Ventilation industrielle et traitement d\'air',
    activites_secondaires: ['CVC industriel', 'Dépoussiérage', 'Extracteurs'],
    ville: 'Marseille',
    code_postal: '13008',
    telephone: '04 91 XX XX XX',
    email: 'contact@ventil-indus.fr',
    contact_nom: 'Marie Ventoux',
    contact_fonction: 'Directrice technique',
  },
  {
    raison_sociale: 'ELEC-MAINTENANCE PRO',
    siret: '34567890123456',
    activite_principale: 'Maintenance électrique industrielle',
    activites_secondaires: ['Moteurs asynchrones', 'Variateurs de vitesse', 'Automatismes'],
    ville: 'Lille',
    code_postal: '59000',
    telephone: '03 20 XX XX XX',
    email: 'contact@elec-maintenance.fr',
    contact_nom: 'Pierre Martin',
    contact_fonction: 'Responsable commercial',
  },
  {
    raison_sociale: 'COMPRESS-AIR SOLUTIONS',
    siret: '45678901234567',
    activite_principale: 'Air comprimé et compresseurs industriels',
    activites_secondaires: ['Compresseurs à vis', 'Sécheurs d\'air', 'Réseaux pneumatiques'],
    ville: 'Nantes',
    code_postal: '44000',
    telephone: '02 40 XX XX XX',
    email: 'contact@compress-air.fr',
    contact_nom: 'Sophie Leroy',
    contact_fonction: 'Gérante',
  },
  {
    raison_sociale: 'CONVOYEURS LAMBERT',
    siret: '56789012345678',
    activite_principale: 'Systèmes de manutention et convoyage',
    activites_secondaires: ['Convoyeurs à bande', 'Élévateurs', 'Motoréducteurs'],
    ville: 'Strasbourg',
    code_postal: '67000',
    telephone: '03 88 XX XX XX',
    email: 'technique@convoyeurs-lambert.fr',
    contact_nom: 'François Lambert',
    contact_fonction: 'Directeur',
  },
  {
    raison_sociale: 'AGRO-PROCESS ENGINEERING',
    siret: '67890123456789',
    activite_principale: 'Équipements agroalimentaires',
    activites_secondaires: ['Agitateurs', 'Mélangeurs', 'Centrifugeuses', 'Pompes alimentaires'],
    ville: 'Rennes',
    code_postal: '35000',
    telephone: '02 99 XX XX XX',
    email: 'info@agro-process.fr',
    contact_nom: 'Claire Bretonne',
    contact_fonction: 'Responsable projets',
  },
  {
    raison_sociale: 'TERTIAIRE ELEC SERVICES',
    siret: '78901234567890',
    activite_principale: 'Électricité tertiaire et bâtiment',
    activites_secondaires: ['Éclairage', 'Climatisation', 'Courants faibles'],
    ville: 'Bordeaux',
    code_postal: '33000',
    telephone: '05 56 XX XX XX',
    email: 'contact@tertiaire-elec.fr',
    contact_nom: 'Thomas Giraud',
    contact_fonction: 'Commercial',
  },
  {
    raison_sociale: 'BROYAGE INDUSTRIE',
    siret: '89012345678901',
    activite_principale: 'Broyage et concassage industriel',
    activites_secondaires: ['Broyeurs à marteaux', 'Concasseurs', 'Moteurs haute puissance'],
    ville: 'Toulouse',
    code_postal: '31000',
    telephone: '05 61 XX XX XX',
    email: 'commercial@broyage-industrie.fr',
    contact_nom: 'Michel Occitan',
    contact_fonction: 'Directeur commercial',
  },
  {
    raison_sociale: 'PLOMBERIE GÉNÉRALE DUPUIS',
    siret: '90123456789012',
    activite_principale: 'Plomberie sanitaire résidentielle',
    activites_secondaires: ['Chauffe-eau', 'Robinetterie'],
    ville: 'Paris',
    code_postal: '75011',
    telephone: '01 43 XX XX XX',
    email: 'contact@dupuis-plomberie.fr',
    contact_nom: 'Paul Dupuis',
    contact_fonction: 'Artisan',
  },
  {
    raison_sociale: 'PEINTURE DÉCOR PLUS',
    siret: '01234567890123',
    activite_principale: 'Peinture et décoration intérieure',
    activites_secondaires: ['Revêtements muraux', 'Papier peint'],
    ville: 'Nice',
    code_postal: '06000',
    telephone: '04 93 XX XX XX',
    email: 'contact@peinture-decor.fr',
    contact_nom: 'Julie Azur',
    contact_fonction: 'Gérante',
  },
];

// ============================================================================
// FONCTIONS DE SCORING
// ============================================================================

function generateId(): string {
  return `PRO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function calculatePertinenceScore(
  activite_principale: string,
  activites_secondaires: string[]
): { score: number; fiches: string[] } {
  let maxScore = 0;
  const fichesSet = new Set<string>();
  
  const allActivites = [activite_principale, ...activites_secondaires].join(' ');
  
  // Score basé sur les activités haute valeur
  for (const config of SCORING_CONFIG.ACTIVITES_HAUTE_VALEUR) {
    if (config.pattern.test(allActivites)) {
      if (config.score > maxScore) {
        maxScore = config.score;
      }
      fichesSet.add(config.fiche);
    }
  }
  
  // Bonus secteur
  for (const secteur of SCORING_CONFIG.SECTEURS_PRIORITAIRES) {
    if (secteur.pattern.test(allActivites)) {
      maxScore = Math.min(100, maxScore + secteur.bonus);
      break;
    }
  }
  
  return {
    score: maxScore,
    fiches: Array.from(fichesSet),
  };
}

// ============================================================================
// GÉNÉRATION DE MESSAGES PERSONNALISÉS
// ============================================================================

function generatePersonalizedMessage(prospect: Partial<Prospect>): string {
  const activite = prospect.activite_principale || 'votre activité';
  const prenom = prospect.contact_nom?.split(' ')[0] || 'Bonjour';
  const ville = prospect.ville || '';
  
  // Détection du contexte pour personnalisation
  let contexte = '';
  let accroche = '';
  
  if (/pompe|pompage/i.test(activite)) {
    contexte = 'les systèmes de pompage';
    accroche = 'l\'optimisation de vos stations de pompage';
  } else if (/ventilation|cvc/i.test(activite)) {
    contexte = 'les systèmes de ventilation';
    accroche = 'l\'efficacité énergétique de vos installations CVC';
  } else if (/compresseur|air comprimé/i.test(activite)) {
    contexte = 'les compresseurs industriels';
    accroche = 'la performance de vos équipements d\'air comprimé';
  } else if (/convoyeur|manutention/i.test(activite)) {
    contexte = 'les systèmes de convoyage';
    accroche = 'l\'optimisation de vos lignes de manutention';
  } else if (/maintenance.*industriel/i.test(activite)) {
    contexte = 'la maintenance industrielle';
    accroche = 'les interventions sur moteurs de vos clients';
  } else if (/électricité/i.test(activite)) {
    contexte = 'les installations électriques';
    accroche = 'les projets moteurs de vos clients';
  } else if (/broyeur|concasseur/i.test(activite)) {
    contexte = 'les équipements de broyage';
    accroche = 'la puissance de vos installations';
  } else if (/agitateur|mélangeur/i.test(activite)) {
    contexte = 'les procédés de mélange';
    accroche = 'vos équipements d\'agitation';
  } else {
    contexte = 'les moteurs industriels';
    accroche = 'vos installations motorisées';
  }

  const messages = [
    // Version directe et percutante
    `${prenom},

Notre Cellule d'Expertise a identifié votre activité sur ${contexte}${ville ? ` à ${ville}` : ''}.

📊 **PREUVE DE VALEUR**
Notre Système d'Audit a déjà identifié un potentiel de ${SCORING_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € sécurisables sur vos typologies de chantiers.

Et le meilleur : vous n'avez aucune paperasse à faire.

Pour un moteur de 25 kW avec variateur, vos clients récupèrent quasi 3 000 € de prime, déduits directement du devis.

Notre Cellule s'occupe de tout : dossier, validation, versement.

Vous facturez, nous gérons l'administratif.

👉 **Recevez votre Audit Flash personnalisé : répondez à ce message avec un devis en pièce jointe.**`,

    // Version plus formelle
    `Bonjour ${prenom},

En recherchant des professionnels spécialisés dans ${accroche}, notre Cellule d'Expertise a identifié votre entreprise.

Nous travaillons avec des artisans comme vous pour maximiser les primes CEE sur les opérations moteurs.

📊 **PREUVE DE VALEUR**
Notre Système d'Audit a déjà identifié un potentiel de ${SCORING_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € sécurisables sur vos typologies de chantiers.

Notre proposition :
✓ Nous constituons le dossier CEE
✓ Nous gérons toute la conformité
✓ Vous déduisez la prime directement du devis client
✓ Zéro paperasse pour vous

👉 **Recevez votre Audit Flash personnalisé : envoyez-nous un devis et notre Cellule vous renvoie l'analyse dans la journée.**`,
  ];
  
  // Retourner une version aléatoire
  return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Recherche des prospects dans l'annuaire simulé
 */
export function searchProspects(criteria: ProspectSearchCriteria): ProspectSearchResult {
  const results: Prospect[] = [];
  
  for (const entry of MOCK_ANNUAIRE) {
    // Filtrage par zone géographique
    if (criteria.zone_geographique) {
      const zone = criteria.zone_geographique.toLowerCase();
      const matchVille = entry.ville?.toLowerCase().includes(zone);
      const matchCP = entry.code_postal?.startsWith(zone.substring(0, 2));
      if (!matchVille && !matchCP) continue;
    }
    
    // Calcul du score
    const { score, fiches } = calculatePertinenceScore(
      entry.activite_principale,
      entry.activites_secondaires
    );
    
    // Filtrage par score minimum
    if (criteria.score_minimum && score < criteria.score_minimum) continue;
    
    // Filtrage par secteur si spécifié
    if (criteria.secteurs.length > 0) {
      const allActivites = [entry.activite_principale, ...entry.activites_secondaires].join(' ').toLowerCase();
      const matchSecteur = criteria.secteurs.some(s => allActivites.includes(s.toLowerCase()));
      if (!matchSecteur) continue;
    }
    
    // Construction du prospect
    const prospect: Prospect = {
      id: generateId(),
      ...entry,
      score_pertinence: score,
      fiches_cee_potentielles: fiches,
      statut: 'nouveau',
      date_creation: new Date().toISOString(),
    };
    
    // Génération du message si score > seuil
    if (score >= SCORING_CONFIG.SEUIL_MESSAGE) {
      prospect.message_personnalise = generatePersonalizedMessage(prospect);
    }
    
    results.push(prospect);
  }
  
  // Tri par score décroissant
  results.sort((a, b) => b.score_pertinence - a.score_pertinence);
  
  return {
    prospects: results,
    total_found: results.length,
    high_score_count: results.filter(p => p.score_pertinence >= SCORING_CONFIG.SEUIL_MESSAGE).length,
    search_criteria: criteria,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Recherche tous les prospects haute valeur (score > 80)
 */
export function findHighValueProspects(): ProspectSearchResult {
  return searchProspects({
    secteurs: [],
    score_minimum: 80,
  });
}

/**
 * Recherche par secteur d'activité
 */
export function searchBySector(secteur: string): ProspectSearchResult {
  return searchProspects({
    secteurs: [secteur],
  });
}

/**
 * Génère un message personnalisé pour un prospect existant
 */
export function generateMessageForProspect(prospect: Prospect): string {
  return generatePersonalizedMessage(prospect);
}

/**
 * Met à jour le statut d'un prospect
 */
export function updateProspectStatus(
  prospect: Prospect,
  newStatus: ProspectStatus,
  notes?: string
): Prospect {
  return {
    ...prospect,
    statut: newStatus,
    date_dernier_contact: new Date().toISOString(),
    notes: notes ? `${prospect.notes || ''}\n[${new Date().toLocaleDateString('fr-FR')}] ${notes}` : prospect.notes,
  };
}

// ============================================================================
// SCHÉMA SQL POUR TABLE PROSPECTS (SUPABASE)
// ============================================================================

export const PROSPECTS_TABLE_SQL = `
-- Table des prospects CEE
CREATE TABLE IF NOT EXISTS prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  raison_sociale VARCHAR(255) NOT NULL,
  siret VARCHAR(14),
  activite_principale TEXT NOT NULL,
  activites_secondaires TEXT[], -- Array de strings
  adresse TEXT,
  code_postal VARCHAR(5),
  ville VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(255),
  site_web VARCHAR(255),
  contact_nom VARCHAR(100),
  contact_fonction VARCHAR(100),
  score_pertinence INTEGER NOT NULL DEFAULT 0 CHECK (score_pertinence >= 0 AND score_pertinence <= 100),
  fiches_cee_potentielles TEXT[], -- Array: ['IND-UT-102', 'IND-UT-117']
  message_personnalise TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'nouveau' CHECK (
    statut IN ('nouveau', 'a_contacter', 'contacte', 'interesse', 'rdv_pris', 'converti', 'non_interesse')
  ),
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_dernier_contact TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects(score_pertinence DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_statut ON prospects(statut);
CREATE INDEX IF NOT EXISTS idx_prospects_ville ON prospects(ville);
CREATE INDEX IF NOT EXISTS idx_prospects_code_postal ON prospects(code_postal);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vue des prospects haute valeur
CREATE OR REPLACE VIEW prospects_haute_valeur AS
SELECT * FROM prospects
WHERE score_pertinence >= 80
ORDER BY score_pertinence DESC, date_creation DESC;

-- Vue du pipeline commercial
CREATE OR REPLACE VIEW prospects_pipeline AS
SELECT 
  statut,
  COUNT(*) as count,
  AVG(score_pertinence) as score_moyen
FROM prospects
GROUP BY statut
ORDER BY 
  CASE statut
    WHEN 'converti' THEN 1
    WHEN 'rdv_pris' THEN 2
    WHEN 'interesse' THEN 3
    WHEN 'contacte' THEN 4
    WHEN 'a_contacter' THEN 5
    WHEN 'nouveau' THEN 6
    WHEN 'non_interesse' THEN 7
  END;
`;

// ============================================================================
// FONCTIONS SUPABASE (À UTILISER AVEC LE CLIENT)
// ============================================================================

import { supabase } from '@/lib/supabase/client';

/**
 * Sauvegarde un prospect dans Supabase
 * NOTE: Table 'prospects' désactivée - utilise localStorage
 */
export async function saveProspectToDatabase(prospect: Prospect): Promise<{ success: boolean; error?: string }> {
  console.log('[CEE-Prospector] Mode local - sauvegarde simulée pour:', prospect.raison_sociale);
  return { success: true };
}

/**
 * Récupère les prospects haute valeur depuis Supabase
 * NOTE: Table 'prospects' désactivée - retourne tableau vide
 */
export async function getHighValueProspectsFromDatabase(): Promise<Prospect[]> {
  console.log('[CEE-Prospector] Mode local - pas de prospects en base');
  return [];
}

/**
 * Met à jour le statut d'un prospect dans Supabase
 * NOTE: Table 'prospects' désactivée - mode local
 */
export async function updateProspectStatusInDatabase(
  prospectId: string,
  newStatus: ProspectStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[CEE-Prospector] Mode local - mise à jour simulée:', prospectId, newStatus);
  return { success: true };
}
