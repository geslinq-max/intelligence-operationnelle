// ============================================================================
// DONNÉES SPÉCIMEN - ARTISAN DE RÉFÉRENCE
// ============================================================================
// Ce fichier contient l'unique Artisan Spécimen avec son historique complet
// pour servir de modèle de référence. Tous les autres comptes fictifs ont été
// supprimés lors de la sanitization des données.
// ============================================================================

// ============================================================================
// ARTISAN SPÉCIMEN - PROFIL COMPLET
// ============================================================================

export const ARTISAN_SPECIMEN = {
  id: 'ART-SPECIMEN-001',
  nom: 'EcoTherm Solutions',
  siret: '12345678901234',
  gerant: 'Jean-Pierre Durand',
  email: 'contact@ecotherm-solutions.fr',
  telephone: '04 78 00 00 00',
  adresse: '15 Rue de l\'Innovation',
  ville: 'Lyon',
  codePostal: '69003',
  secteur: 'Pompes à chaleur & Chauffage',
  certifications: ['RGE QualiPAC', 'RGE Qualibat', 'Qualit\'EnR'],
  dateAdhesion: '2024-06-15',
  forfait: 'serenite' as const,
  forfaitMrr: 349,
  statut: 'actif' as const,
};

// ============================================================================
// HISTORIQUE DOSSIERS DU SPÉCIMEN
// ============================================================================

export const DOSSIERS_SPECIMEN = [
  {
    id: 'DOS-SPEC-001',
    client: 'Résidence Les Acacias',
    type: 'BAR-TH-164',
    description: 'Installation PAC air/eau',
    statut: 'valide' as const,
    montant: 4850,
    prime_cee: 3200,
    date_soumission: '2024-07-10',
    date_validation: '2024-07-12',
    scanner_score: 98,
    cellule_validation: true,
  },
  {
    id: 'DOS-SPEC-002',
    client: 'Maison Bertrand',
    type: 'BAR-TH-143',
    description: 'Système solaire combiné',
    statut: 'valide' as const,
    montant: 6200,
    prime_cee: 4100,
    date_soumission: '2024-08-22',
    date_validation: '2024-08-24',
    scanner_score: 95,
    cellule_validation: true,
  },
  {
    id: 'DOS-SPEC-003',
    client: 'Copropriété Bellevue',
    type: 'BAR-EN-101',
    description: 'Isolation des combles',
    statut: 'valide' as const,
    montant: 3100,
    prime_cee: 2200,
    date_soumission: '2024-09-15',
    date_validation: '2024-09-17',
    scanner_score: 92,
    cellule_validation: true,
  },
  {
    id: 'DOS-SPEC-004',
    client: 'Villa Martin',
    type: 'BAR-TH-164',
    description: 'Remplacement chaudière par PAC',
    statut: 'en_analyse' as const,
    montant: 5400,
    prime_cee: 3800,
    date_soumission: '2025-01-10',
    date_validation: null,
    scanner_score: 89,
    cellule_validation: false,
  },
  {
    id: 'DOS-SPEC-005',
    client: 'Immeuble Panorama',
    type: 'BAR-TH-148',
    description: 'Chauffe-eau thermodynamique collectif',
    statut: 'en_attente' as const,
    montant: 2800,
    prime_cee: 1900,
    date_soumission: '2025-01-12',
    date_validation: null,
    scanner_score: null,
    cellule_validation: false,
  },
];

// ============================================================================
// RÉSULTATS SCANNER POUR LE SPÉCIMEN
// ============================================================================

export const SCANNER_RESULTS_SPECIMEN = {
  total_analyses: 5,
  taux_conformite: 94,
  derniere_analyse: '2025-01-12',
  details: [
    { critere: 'Conformité technique', score: 96, statut: 'optimal' },
    { critere: 'Éligibilité CEE', score: 98, statut: 'optimal' },
    { critere: 'Documentation complète', score: 92, statut: 'optimal' },
    { critere: 'Calcul primes', score: 95, statut: 'optimal' },
  ],
};

// ============================================================================
// INTERVENTIONS CELLULE D'EXPERTISE POUR LE SPÉCIMEN
// ============================================================================

export const CELLULE_INTERVENTIONS_SPECIMEN = [
  {
    id: 'CEL-001',
    dossier_id: 'DOS-SPEC-001',
    type: 'validation_finale',
    date: '2024-07-12',
    resultat: 'approuve',
    commentaire: 'Dossier conforme - Prime CEE validée',
  },
  {
    id: 'CEL-002',
    dossier_id: 'DOS-SPEC-002',
    type: 'validation_finale',
    date: '2024-08-24',
    resultat: 'approuve',
    commentaire: 'Documentation complète - Validation accordée',
  },
  {
    id: 'CEL-003',
    dossier_id: 'DOS-SPEC-003',
    type: 'validation_finale',
    date: '2024-09-17',
    resultat: 'approuve',
    commentaire: 'Conformité vérifiée - Dossier validé',
  },
  {
    id: 'CEL-004',
    dossier_id: 'DOS-SPEC-004',
    type: 'analyse_en_cours',
    date: '2025-01-11',
    resultat: 'en_attente',
    commentaire: 'Analyse technique en cours par la Cellule',
  },
];

// ============================================================================
// COMPTEURS RÉINITIALISÉS (BASÉS SUR LE SPÉCIMEN UNIQUEMENT)
// ============================================================================

// Calculs basés uniquement sur l'activité du Spécimen
const dossiersValides = DOSSIERS_SPECIMEN.filter(d => d.statut === 'valide');
const totalPrimesCee = dossiersValides.reduce((sum, d) => sum + d.prime_cee, 0);

export const COMPTEURS_GLOBAUX = {
  // MRR = 1 seul artisan abonné Sérénité
  mrr: ARTISAN_SPECIMEN.forfaitMrr, // 349 €
  mrrGrowth: 0, // Pas de croissance (données réinitialisées)
  arr: ARTISAN_SPECIMEN.forfaitMrr * 12, // 4188 €
  
  // Marge Fondateur (70%)
  marge: 70,
  margeAbsolue: Math.round(ARTISAN_SPECIMEN.forfaitMrr * 0.70), // 244 €
  
  // Clients
  totalClients: 1,
  clientsActifs: 1,
  churnRate: 0,
  
  // Métriques avancées (à construire avec vrais clients)
  ltv: 0,
  cac: 0,
  
  // Dossiers
  dossiersTotal: DOSSIERS_SPECIMEN.length,
  dossiersValides: dossiersValides.length,
  dossiersPending: DOSSIERS_SPECIMEN.filter(d => d.statut !== 'valide').length,
  primesCeeTotal: totalPrimesCee,
};

// ============================================================================
// DONNÉES POUR L'ESPACE DIRECTION (MANAGER)
// Note: Pas de données vendeurs - structure vide pour futurs partenaires
// ============================================================================

export const DIRECTION_DATA = {
  volumeVenteTotal: ARTISAN_SPECIMEN.forfaitMrr, // Volume = MRR du spécimen
  nombreVendeurs: 0, // Aucun vendeur fictif
  clientsTotaux: 1,
  nouveauxClientsMois: 0,
  objectifMensuel: 55000, // Objectif maintenu
  commissionManager: 10, // Taux maintenu
  commissionMensuelle: Math.round(ARTISAN_SPECIMEN.forfaitMrr * 0.10), // 35 €
  equipe: [], // Liste vide - à remplir avec vrais partenaires
};

// ============================================================================
// DONNÉES POUR L'ESPACE PARTENAIRE (SOLDAT)
// Note: Données du spécimen comme unique client de démonstration
// ============================================================================

export const PARTENAIRE_DATA = {
  clientsPropres: 1,
  volumePersonnel: ARTISAN_SPECIMEN.forfaitMrr,
  commissionTaux: 20,
  commissionMensuelle: Math.round(ARTISAN_SPECIMEN.forfaitMrr * 0.20), // 70 €
  clientsRisque: 0,
  clientsFideles: 1,
  clients: [
    {
      id: ARTISAN_SPECIMEN.id,
      nom: ARTISAN_SPECIMEN.nom,
      forfait: ARTISAN_SPECIMEN.forfait,
      mrr: ARTISAN_SPECIMEN.forfaitMrr,
      dateAdhesion: ARTISAN_SPECIMEN.dateAdhesion,
      dernierContact: '2025-01-13',
      risqueDesabo: false,
      sante: 95,
    },
  ],
};

// ============================================================================
// HISTORIQUE MRR (RÉINITIALISÉ - DÉPART JANVIER 2025)
// ============================================================================

export const MRR_HISTORY = [
  { mois: 'Jan 2025', mrr: ARTISAN_SPECIMEN.forfaitMrr, marge: Math.round(ARTISAN_SPECIMEN.forfaitMrr * 0.70) },
];

// ============================================================================
// FORFAITS RÉPARTITION (1 SEUL CLIENT SÉRÉNITÉ)
// ============================================================================

export const FORFAITS_REPARTITION = [
  { nom: 'Essentiel', clients: 0, mrr: 0, pourcentage: 0 },
  { nom: 'Sérénité', clients: 1, mrr: ARTISAN_SPECIMEN.forfaitMrr, pourcentage: 100 },
  { nom: 'Expert', clients: 0, mrr: 0, pourcentage: 0 },
];

// ============================================================================
// PROSPECTION - UN SEUL ARTISAN CONVERTI (LE SPÉCIMEN)
// ============================================================================

export const PROSPECTION_DATA = {
  objectif: 50,
  convertis: 1,
  artisans: [
    {
      id: ARTISAN_SPECIMEN.id,
      nom: ARTISAN_SPECIMEN.nom,
      ville: ARTISAN_SPECIMEN.ville,
      secteur: ARTISAN_SPECIMEN.secteur,
      potentiel_estime: totalPrimesCee,
      statut: 'converti' as const,
      date_invitation: '2024-06-01',
      score_chaleur: 98,
    },
  ],
};
