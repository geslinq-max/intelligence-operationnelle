/**
 * Configuration des Rôles - Sécurité CAPITAL ÉNERGIE
 * 
 * RÈGLES DE SÉCURITÉ :
 * - Tout nouveau compte = rôle 'artisan' (USER limité à l'espace client)
 * - Seul FOUNDER_EMAIL a les droits 'fondateur'
 * - Les routes /admin et /vendeur sont protégées par middleware
 */

// ============================================================================
// EMAIL FONDATEUR UNIQUE
// ============================================================================

/**
 * IMPORTANT: Remplacez cette valeur par votre email réel
 * Seul cet email aura les droits FOUNDER (fondateur)
 */
export const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

// ============================================================================
// TYPES DE RÔLES
// ============================================================================

export type UserRole = 'fondateur' | 'manager' | 'partenaire' | 'artisan';

// Rôle par défaut pour tout nouveau compte
export const DEFAULT_ROLE: UserRole = 'artisan';

// ============================================================================
// HIÉRARCHIE DES RÔLES
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  fondateur: 100,  // Accès total
  manager: 75,     // Accès direction + partenaires
  partenaire: 50,  // Accès espace partenaire
  artisan: 25,     // Accès espace client uniquement
};

// ============================================================================
// ROUTES PROTÉGÉES PAR RÔLE
// ============================================================================

export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['fondateur'],
  '/admin/pilotage': ['fondateur', 'manager'],
  '/direction': ['fondateur', 'manager'],
  '/vendeur': ['fondateur', 'manager', 'partenaire'],
  '/partenaire': ['fondateur', 'manager', 'partenaire'],
  '/prospection': ['fondateur', 'manager'],
  '/entreprises': ['fondateur', 'manager'],
  '/gestion': ['fondateur', 'manager', 'partenaire', 'artisan'],
};

// Routes accessibles à tous les utilisateurs authentifiés
export const USER_ROUTES = [
  '/dashboard',
  '/verificateur',
  '/tarifs',
  '/profile',
  '/espace-client',
];

// Routes publiques (pas d'authentification requise)
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/landing',
  '/mentions-legales',
  '/confidentialite',
  '/cgv',
  '/tarifs',
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Détermine le rôle à assigner lors de la création d'un compte
 */
export function getRoleForEmail(email: string): UserRole {
  // Normalisation de l'email
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedFounder = FOUNDER_EMAIL.toLowerCase().trim();
  
  // Seul l'email fondateur obtient le rôle fondateur
  if (normalizedEmail === normalizedFounder) {
    return 'fondateur';
  }
  
  // Tous les autres obtiennent le rôle par défaut (artisan)
  return DEFAULT_ROLE;
}

/**
 * Vérifie si un rôle a accès à une route
 */
export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  // Vérifier les routes publiques
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }
  
  // Vérifier les routes utilisateur (tous les authentifiés)
  if (USER_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }
  
  // Vérifier les routes protégées
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return allowedRoles.includes(role);
    }
  }
  
  // Par défaut, autoriser (routes non listées)
  return true;
}

/**
 * Obtient la route de redirection pour un rôle donné
 */
export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case 'fondateur':
      return '/admin';
    case 'manager':
      return '/direction';
    case 'partenaire':
      return '/partenaire';
    case 'artisan':
    default:
      return '/dashboard';
  }
}

/**
 * Vérifie si un rôle a un niveau d'accès supérieur ou égal à un autre
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
