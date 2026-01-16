/**
 * ============================================================================
 * SERVICE DE DÉGRADATION GRACIEUSE
 * ============================================================================
 * Gestion centralisée des erreurs API externes avec :
 * - Fallbacks automatiques
 * - Messages utilisateur rassurants
 * - Logging silencieux pour alertes admin
 * 
 * Services couverts : Gemini, Stripe, Pappers, Resend
 * ============================================================================
 */

import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ExternalService = 'gemini' | 'stripe' | 'pappers' | 'resend' | 'supabase';

export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ServiceError {
  service: ExternalService;
  errorCode: string;
  errorMessage: string;
  httpStatus?: number;
  timestamp: string;
  context?: Record<string, unknown>;
  severity: ErrorSeverity;
  userMessage: string;
  fallbackUsed: boolean;
}

export interface FallbackResult<T> {
  success: boolean;
  data: T | null;
  usedFallback: boolean;
  fallbackReason?: string;
  userMessage: string;
}

// ============================================================================
// MESSAGES UTILISATEUR RASSURANTS (par service)
// ============================================================================

const USER_MESSAGES: Record<ExternalService, Record<string, string>> = {
  gemini: {
    timeout: '🔄 L\'analyse IA prend plus de temps que prévu. Nous utilisons un calcul algorithmique pour vous répondre immédiatement.',
    error_500: '🛡️ Service d\'analyse momentanément indisponible. Vos données sont analysées par notre algorithme de secours.',
    api_key_invalid: '⚙️ Configuration en cours. L\'analyse utilise notre méthode algorithmique standard.',
    rate_limit: '📊 Forte affluence détectée. Votre analyse est traitée par notre système de secours.',
    default: '🔄 Analyse en cours via notre système algorithmique. Résultats fiables garantis.',
  },
  stripe: {
    timeout: '⏳ Le paiement prend plus de temps. Veuillez patienter, votre transaction est sécurisée.',
    error_500: '💳 Service de paiement temporairement indisponible. Vos données sont sauvegardées, réessayez dans quelques instants.',
    card_declined: '❌ Carte refusée. Veuillez vérifier vos informations ou utiliser une autre carte.',
    rate_limit: '⏳ Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
    default: '💳 Erreur de paiement. Vos données sont sécurisées. Veuillez réessayer.',
  },
  pappers: {
    timeout: '🏢 Vérification d\'entreprise en cours. Les données seront complétées automatiquement.',
    error_500: '🏢 Service de vérification SIRET momentanément indisponible. Vérification manuelle possible.',
    not_found: '🔍 Entreprise non trouvée dans l\'annuaire. Vérifiez le numéro SIRET.',
    rate_limit: '📊 Limite de requêtes atteinte. La vérification sera effectuée ultérieurement.',
    default: '🏢 Vérification d\'entreprise indisponible. Vous pouvez continuer, nous vérifierons plus tard.',
  },
  resend: {
    timeout: '📧 Envoi d\'email en cours. Vous recevrez une confirmation dès que possible.',
    error_500: '📧 Service d\'email temporairement indisponible. Votre message sera envoyé dès le rétablissement.',
    rate_limit: '📧 Limite d\'envoi quotidienne atteinte. L\'email sera programmé pour demain.',
    invalid_email: '📧 Adresse email invalide. Veuillez vérifier l\'adresse saisie.',
    default: '📧 Envoi d\'email différé. Vous serez notifié dès l\'envoi effectué.',
  },
  supabase: {
    timeout: '💾 Connexion à la base de données lente. Vos données sont sauvegardées localement.',
    error_500: '💾 Base de données temporairement indisponible. Vos données sont en sécurité.',
    auth_error: '🔐 Session expirée. Veuillez vous reconnecter.',
    default: '💾 Service momentanément indisponible. Vos données sont sauvegardées.',
  },
};

// ============================================================================
// LOGGING SILENCIEUX (pour alertes admin)
// ============================================================================

interface EmergencyLog {
  id?: string;
  service: ExternalService;
  error_code: string;
  error_message: string;
  http_status?: number;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  user_agent?: string;
  created_at: string;
  resolved: boolean;
}

/**
 * Log silencieux des erreurs API pour monitoring admin
 * Ne bloque jamais l'expérience utilisateur
 */
export async function logEmergencyError(error: ServiceError): Promise<void> {
  const log: EmergencyLog = {
    service: error.service,
    error_code: error.errorCode,
    error_message: error.errorMessage,
    http_status: error.httpStatus,
    severity: error.severity,
    context: error.context,
    user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    created_at: new Date().toISOString(),
    resolved: false,
  };

  try {
    // Tentative d'insertion dans Supabase (silencieuse)
    await supabase.from('emergency_logs').insert([log]);
  } catch {
    // Fallback: log console en production (visible dans Vercel logs)
    console.error('[EMERGENCY_LOG]', JSON.stringify(log));
  }

  // Log console pour debug local
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${error.severity}] ${error.service.toUpperCase()} Error:`, error.errorMessage);
  }
}

/**
 * Détermine la sévérité d'une erreur
 */
function determineSeverity(service: ExternalService, httpStatus?: number, errorCode?: string): ErrorSeverity {
  // Erreurs critiques
  if (httpStatus === 500 || httpStatus === 503) return 'CRITICAL';
  if (errorCode?.includes('auth') || errorCode?.includes('key')) return 'HIGH';
  
  // Par service
  if (service === 'stripe' && httpStatus && httpStatus >= 400) return 'HIGH';
  if (service === 'gemini' && httpStatus === 429) return 'MEDIUM';
  if (service === 'pappers' && httpStatus === 404) return 'LOW';
  if (service === 'resend' && errorCode === 'rate_limit') return 'MEDIUM';
  
  return 'MEDIUM';
}

/**
 * Récupère le message utilisateur approprié
 */
function getUserMessage(service: ExternalService, errorCode?: string): string {
  const serviceMessages = USER_MESSAGES[service];
  
  if (errorCode && serviceMessages[errorCode]) {
    return serviceMessages[errorCode];
  }
  
  // Détection automatique du type d'erreur
  if (errorCode?.includes('timeout') || errorCode?.includes('ETIMEDOUT')) {
    return serviceMessages.timeout || serviceMessages.default;
  }
  if (errorCode?.includes('500') || errorCode?.includes('503')) {
    return serviceMessages.error_500 || serviceMessages.default;
  }
  if (errorCode?.includes('rate') || errorCode?.includes('limit')) {
    return serviceMessages.rate_limit || serviceMessages.default;
  }
  
  return serviceMessages.default;
}

// ============================================================================
// WRAPPER DE REQUÊTE AVEC DÉGRADATION GRACIEUSE
// ============================================================================

interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: RequestOptions = {
  timeout: 10000, // 10 secondes
  retries: 2,
  retryDelay: 1000,
};

/**
 * Exécute une requête fetch avec timeout et retry automatique
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
}

/**
 * Wrapper générique pour appels API externes avec fallback
 */
export async function callExternalAPI<T>(
  service: ExternalService,
  apiCall: () => Promise<T>,
  fallbackFn?: () => T | Promise<T>,
  options: RequestOptions = DEFAULT_OPTIONS
): Promise<FallbackResult<T>> {
  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts < (options.retries || 1)) {
    attempts++;
    
    try {
      const result = await Promise.race([
        apiCall(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), options.timeout)
        ),
      ]);

      return {
        success: true,
        data: result,
        usedFallback: false,
        userMessage: '',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Attendre avant retry (sauf si c'est le dernier essai)
      if (attempts < (options.retries || 1)) {
        await new Promise(r => setTimeout(r, options.retryDelay || 1000));
      }
    }
  }

  // Toutes les tentatives ont échoué - utiliser le fallback
  const errorCode = lastError?.message || 'unknown';
  const severity = determineSeverity(service, undefined, errorCode);
  const userMessage = getUserMessage(service, errorCode);

  // Log silencieux
  await logEmergencyError({
    service,
    errorCode,
    errorMessage: lastError?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    severity,
    userMessage,
    fallbackUsed: !!fallbackFn,
    context: { attempts },
  });

  // Utiliser le fallback si disponible
  if (fallbackFn) {
    try {
      const fallbackResult = await fallbackFn();
      return {
        success: true,
        data: fallbackResult,
        usedFallback: true,
        fallbackReason: errorCode,
        userMessage,
      };
    } catch (fallbackError) {
      // Même le fallback a échoué
      await logEmergencyError({
        service,
        errorCode: 'FALLBACK_FAILED',
        errorMessage: fallbackError instanceof Error ? fallbackError.message : 'Fallback failed',
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
        userMessage: USER_MESSAGES[service].default,
        fallbackUsed: true,
      });
    }
  }

  return {
    success: false,
    data: null,
    usedFallback: false,
    userMessage,
  };
}

// ============================================================================
// FALLBACKS SPÉCIFIQUES PAR SERVICE
// ============================================================================

/**
 * Fallback Gemini : Utilise le calcul algorithmique classique
 */
export function geminiAlgorithmicFallback(puissanceKw: number): {
  kwh_cumac: number;
  prime_estimee_euros: number;
  detail_calcul: string;
  mode: 'algorithmic';
} {
  const KWH_CUMAC_PAR_KW = 12500;
  const PRIX_CEE_EUR_MWH = 9.50;
  
  const kwhCumac = Math.round(puissanceKw * KWH_CUMAC_PAR_KW);
  const prime = Math.round((kwhCumac / 1000) * PRIX_CEE_EUR_MWH * 100) / 100;
  
  return {
    kwh_cumac: kwhCumac,
    prime_estimee_euros: prime,
    detail_calcul: `${puissanceKw} kW × ${KWH_CUMAC_PAR_KW.toLocaleString('fr-FR')} kWh/kW = ${kwhCumac.toLocaleString('fr-FR')} kWh cumac → ${prime.toLocaleString('fr-FR')} €`,
    mode: 'algorithmic',
  };
}

/**
 * Fallback Pappers : Retourne un statut "à vérifier manuellement"
 */
export function pappersManualFallback(siret: string): {
  siret: string;
  valide_format: boolean;
  entreprise_trouvee: boolean;
  mode: 'manual_verification';
  message: string;
} {
  // Validation format SIRET (14 chiffres)
  const cleanSiret = siret.replace(/\s/g, '');
  const valideFormat = /^\d{14}$/.test(cleanSiret);
  
  return {
    siret: cleanSiret,
    valide_format: valideFormat,
    entreprise_trouvee: false,
    mode: 'manual_verification',
    message: 'Vérification automatique indisponible. Validation manuelle requise.',
  };
}

/**
 * Fallback Resend : Queue l'email pour envoi ultérieur
 */
export async function resendQueueFallback(
  to: string,
  subject: string,
  body: string
): Promise<{
  queued: boolean;
  queueId: string;
  scheduledFor: string;
  message: string;
}> {
  const queueId = `queue_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const scheduledFor = new Date(Date.now() + 3600000).toISOString(); // +1h
  
  try {
    // Sauvegarder dans Supabase pour traitement ultérieur
    await supabase.from('email_queue').insert([{
      id: queueId,
      to_email: to,
      subject,
      body,
      scheduled_for: scheduledFor,
      status: 'pending',
      created_at: new Date().toISOString(),
    }]);
    
    return {
      queued: true,
      queueId,
      scheduledFor,
      message: 'Email programmé pour envoi automatique dans 1 heure.',
    };
  } catch {
    return {
      queued: false,
      queueId: '',
      scheduledFor: '',
      message: 'Email non envoyé. Veuillez réessayer plus tard.',
    };
  }
}

// ============================================================================
// COMPOSANT UI : TOAST D'ERREUR GRACIEUSE
// ============================================================================

export interface GracefulErrorToast {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function createGracefulToast(
  service: ExternalService,
  usedFallback: boolean
): GracefulErrorToast {
  if (usedFallback) {
    return {
      title: 'Traitement alternatif',
      message: getUserMessage(service, 'default'),
      type: 'info',
    };
  }
  
  return {
    title: 'Service temporairement indisponible',
    message: getUserMessage(service, 'default'),
    type: 'warning',
    action: {
      label: 'Réessayer',
      onClick: () => window.location.reload(),
    },
  };
}

// ============================================================================
// HEALTH CHECK SERVICES
// ============================================================================

export interface ServiceHealth {
  service: ExternalService;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  lastCheck: string;
}

export async function checkServiceHealth(service: ExternalService): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    switch (service) {
      case 'gemini':
        // Simple ping to Gemini API
        await fetchWithTimeout(
          'https://generativelanguage.googleapis.com/v1beta/models',
          { method: 'GET' },
          5000
        );
        break;
      case 'stripe':
        // Stripe status page
        await fetchWithTimeout('https://status.stripe.com', { method: 'HEAD' }, 5000);
        break;
      case 'pappers':
        await fetchWithTimeout('https://api.pappers.fr/v2/health', { method: 'GET' }, 5000);
        break;
      case 'resend':
        await fetchWithTimeout('https://api.resend.com/health', { method: 'GET' }, 5000);
        break;
      case 'supabase':
        await supabase.from('health_check').select('id').limit(1);
        break;
    }
    
    return {
      service,
      status: 'healthy',
      latencyMs: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      service,
      status: 'down',
      latencyMs: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  }
}
