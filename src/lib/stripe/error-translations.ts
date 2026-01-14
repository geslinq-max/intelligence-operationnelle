// Traductions des erreurs Stripe en français professionnel
// v3.0.0 - Clean-up friction

export const STRIPE_ERROR_TRANSLATIONS: Record<string, string> = {
  // Erreurs de carte
  'card_declined': 'Carte refusée. Veuillez vérifier vos informations ou utiliser une autre carte.',
  'insufficient_funds': 'Fonds insuffisants. Veuillez utiliser une autre carte.',
  'expired_card': 'Carte expirée. Veuillez utiliser une carte valide.',
  'incorrect_cvc': 'Code de sécurité incorrect. Veuillez vérifier le code CVC.',
  'incorrect_number': 'Numéro de carte incorrect. Veuillez vérifier vos informations.',
  'invalid_expiry_month': 'Mois d\'expiration invalide.',
  'invalid_expiry_year': 'Année d\'expiration invalide.',
  'processing_error': 'Erreur de traitement. Veuillez réessayer dans quelques instants.',
  
  // Erreurs SEPA
  'sepa_unsupported_account': 'Ce compte bancaire ne supporte pas les prélèvements SEPA.',
  'invalid_bank_account_iban': 'IBAN invalide. Veuillez vérifier votre numéro de compte.',
  'bank_account_declined': 'Compte bancaire refusé. Veuillez contacter votre banque.',
  
  // Erreurs génériques
  'authentication_required': 'Authentification requise. Veuillez valider via votre application bancaire.',
  'rate_limit': 'Trop de tentatives. Veuillez patienter quelques minutes.',
  'api_connection_error': 'Connexion impossible. Vérifiez votre connexion internet.',
  'api_error': 'Erreur technique. Notre équipe a été notifiée.',
  'invalid_request_error': 'Requête invalide. Veuillez réessayer.',
  
  // Erreurs par défaut
  'default': 'Une erreur est survenue. Veuillez réessayer ou contacter notre support.',
};

export function translateStripeError(errorCode: string | undefined, defaultMessage?: string): string {
  if (!errorCode) {
    return defaultMessage || STRIPE_ERROR_TRANSLATIONS.default;
  }
  
  return STRIPE_ERROR_TRANSLATIONS[errorCode] || defaultMessage || STRIPE_ERROR_TRANSLATIONS.default;
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const stripeError = error as { code?: string; message?: string; type?: string };
    
    // Essayer de traduire le code d'erreur
    if (stripeError.code) {
      return translateStripeError(stripeError.code, stripeError.message);
    }
    
    // Fallback sur le message original traduit
    if (stripeError.message) {
      // Traduire les messages courants en anglais
      const englishToFrench: Record<string, string> = {
        'Your card was declined': 'Votre carte a été refusée.',
        'Your card has insufficient funds': 'Fonds insuffisants sur votre carte.',
        'Your card has expired': 'Votre carte est expirée.',
        'Payment method not available': 'Mode de paiement non disponible.',
        'An error occurred': 'Une erreur est survenue.',
      };
      
      for (const [en, fr] of Object.entries(englishToFrench)) {
        if (stripeError.message.includes(en)) {
          return fr;
        }
      }
      
      return stripeError.message;
    }
  }
  
  return STRIPE_ERROR_TRANSLATIONS.default;
}
