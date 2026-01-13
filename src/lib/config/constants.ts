/**
 * CAPITAL ÉNERGIE - Constantes Globales
 * 
 * Fichier centralisé pour les constantes de l'application.
 * Toute modification de version doit être faite ici uniquement.
 */

// ============================================================================
// VERSION DE L'APPLICATION
// ============================================================================

export const APP_VERSION = 'v2.0.0';
export const APP_NAME = 'CAPITAL ÉNERGIE';
export const APP_VERSION_FULL = `${APP_VERSION} - ${APP_NAME}`;

// ============================================================================
// MENTIONS LÉGALES
// ============================================================================

export const LEGAL_DISCLAIMER = "Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.";

// ============================================================================
// LABELS FOOTER PAR PAGE
// ============================================================================

export const FOOTER_LABELS = {
  dashboard: 'Tableau de bord opérationnel',
  entreprises: 'Gestion des Artisans Partenaires',
  verificateur: 'Système d\'Audit - Validation & Certification',
  prospection: 'Module de Prospection CEE',
  espaceClient: 'Espace Client Sécurisé',
  gestion: 'Gestion des Dossiers CEE',
} as const;
