/**
 * Configuration des Rôles - CAPITAL ÉNERGIE
 * 
 * MODÈLE SOLO-FONDATEUR SIMPLIFIÉ :
 * - ADMIN : Accès total (FOUNDER_EMAIL uniquement)
 * - ARTISAN : Espace client standard
 * 
 * Architecture modulaire pour extensions futures (ex: segment Viticulture)
 */

// ============================================================================
// EMAIL ADMIN UNIQUE
// ============================================================================

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

// ============================================================================
// TYPES DE RÔLES (SIMPLIFIÉ)
// ============================================================================

export type UserRole = 'admin' | 'artisan' | 'client';

// Type d'industrie pour les clients
export type ClientIndustry = 'CEE' | 'PAYSAGISTE' | 'VITICULTEUR';

export const DEFAULT_ROLE: UserRole = 'artisan';

// ============================================================================
// HIÉRARCHIE DES RÔLES
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,    // Accès total
  artisan: 50,   // Espace artisan (accès interne)
  client: 25,    // Espace client (accès restreint)
};

// ============================================================================
// CONFIGURATION DES SEGMENTS (MODULAIRE)
// ============================================================================

export type BusinessSegment = 'energie' | 'viticulture';

export const SEGMENTS: Record<BusinessSegment, {
  label: string;
  icon: string;
  color: string;
}> = {
  energie: {
    label: 'Énergie & CEE',
    icon: '⚡',
    color: 'emerald',
  },
  viticulture: {
    label: 'Viticulture',
    icon: '🍇',
    color: 'purple',
  },
};

// Segment actif (pour extension future)
export const ACTIVE_SEGMENT: BusinessSegment = 'energie';

// ============================================================================
// ROUTES
// ============================================================================

export const ADMIN_ROUTES = [
  '/admin',
  '/admin/clients',
  '/admin/statistiques',
  '/admin/parametres',
];

export const USER_ROUTES = [
  '/dashboard',
  '/verificateur',
  '/tarifs',
  '/profile',
  '/gestion',
];

export const CLIENT_ROUTES = [
  '/client',
  '/client/dashboard',
  '/client/dossiers',
  '/client/documents',
];

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/inscription',
  '/landing',
  '/mentions-legales',
  '/confidentialite',
  '/cgv',
  '/tarifs',
  '/403',
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!ADMIN_EMAIL || ADMIN_EMAIL.trim() === '') return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

export function getRoleForEmail(email: string): UserRole {
  return isAdminEmail(email) ? 'admin' : 'artisan';
}

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'client': return '/client/dashboard';
    default: return '/dashboard';
  }
}

export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    return true;
  }
  
  if (USER_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    return true;
  }
  
  if (ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    return role === 'admin';
  }
  
  return true;
}
