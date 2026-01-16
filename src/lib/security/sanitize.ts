/**
 * ============================================================================
 * CAPITAL ÉNERGIE - UTILITAIRES DE SÉCURITÉ
 * ============================================================================
 * Fonctions de sanitization et validation des données utilisateur
 * Protection contre XSS, injection et données malveillantes
 * ============================================================================
 */

/**
 * Sanitize une chaîne pour prévenir les attaques XSS
 * Encode les caractères HTML dangereux
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize une chaîne pour utilisation dans un attribut HTML
 */
export function sanitizeAttribute(input: string | null | undefined): string {
  if (!input) return '';
  
  return String(input)
    .replace(/[&<>"'\/\\]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Sanitize un nom de fichier
 * Supprime les caractères dangereux et les chemins relatifs
 */
export function sanitizeFilename(input: string | null | undefined): string {
  if (!input) return 'document';
  
  return String(input)
    .replace(/\.\./g, '') // Empêche path traversal
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Caractères interdits
    .replace(/^\.+/, '') // Pas de fichiers cachés
    .trim()
    .slice(0, 255) || 'document';
}

/**
 * Sanitize un email
 * Valide et nettoie une adresse email
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return '';
  
  const email = String(input).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return '';
  }
  
  // Longueur max email
  if (email.length > 254) {
    return '';
  }
  
  return email;
}

/**
 * Sanitize un numéro SIRET
 * Valide et nettoie un SIRET français
 */
export function sanitizeSiret(input: string | null | undefined): string {
  if (!input) return '';
  
  // Garder uniquement les chiffres
  const siret = String(input).replace(/\D/g, '');
  
  // SIRET = 14 chiffres
  if (siret.length !== 14) {
    return '';
  }
  
  return siret;
}

/**
 * Sanitize un numéro de téléphone français
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return '';
  
  // Garder uniquement les chiffres et le +
  let phone = String(input).replace(/[^\d+]/g, '');
  
  // Formats acceptés: 0X XX XX XX XX ou +33 X XX XX XX XX
  if (phone.startsWith('+33')) {
    phone = '0' + phone.slice(3);
  }
  
  if (phone.length !== 10 || !phone.startsWith('0')) {
    return '';
  }
  
  return phone;
}

/**
 * Sanitize un texte libre (description, commentaire)
 * Limite la longueur et supprime les caractères de contrôle
 */
export function sanitizeText(
  input: string | null | undefined, 
  maxLength: number = 5000
): string {
  if (!input) return '';
  
  return String(input)
    // Supprimer les caractères de contrôle (sauf newlines et tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normaliser les espaces
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize une valeur numérique
 * Retourne un nombre valide ou une valeur par défaut
 */
export function sanitizeNumber(
  input: unknown, 
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  if (min !== undefined && num < min) {
    return min;
  }
  
  if (max !== undefined && num > max) {
    return max;
  }
  
  return num;
}

/**
 * Sanitize une URL
 * Vérifie que l'URL est valide et sécurisée (https uniquement en production)
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (!input) return '';
  
  try {
    const url = new URL(String(input));
    
    // N'autoriser que http(s)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    
    // Bloquer javascript: et data:
    if (url.href.toLowerCase().includes('javascript:') || 
        url.href.toLowerCase().includes('data:')) {
      return '';
    }
    
    return url.href;
  } catch {
    return '';
  }
}

/**
 * Détecte et bloque les tentatives d'injection SQL basiques
 * Note: Utilisez toujours des requêtes paramétrées avec Supabase
 */
export function detectSqlInjection(input: string): boolean {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
    /(-{2}|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Valide et sanitize un objet complet de données de formulaire
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, 'text' | 'email' | 'phone' | 'siret' | 'number' | 'url'>
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const [key, type] of Object.entries(schema)) {
    const value = data[key as keyof T];
    
    switch (type) {
      case 'email':
        sanitized[key as keyof T] = sanitizeEmail(value as string) as T[keyof T];
        break;
      case 'phone':
        sanitized[key as keyof T] = sanitizePhone(value as string) as T[keyof T];
        break;
      case 'siret':
        sanitized[key as keyof T] = sanitizeSiret(value as string) as T[keyof T];
        break;
      case 'number':
        sanitized[key as keyof T] = sanitizeNumber(value) as T[keyof T];
        break;
      case 'url':
        sanitized[key as keyof T] = sanitizeUrl(value as string) as T[keyof T];
        break;
      default:
        sanitized[key as keyof T] = sanitizeText(value as string) as T[keyof T];
    }
  }
  
  return sanitized;
}

/**
 * Constantes de sécurité
 */
export const SECURITY_LIMITS = {
  MAX_TEXT_LENGTH: 5000,
  MAX_EMAIL_LENGTH: 254,
  MAX_FILENAME_LENGTH: 255,
  MAX_URL_LENGTH: 2048,
  SIRET_LENGTH: 14,
  PHONE_LENGTH: 10,
};
