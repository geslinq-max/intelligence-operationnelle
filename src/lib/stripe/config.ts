// Configuration Stripe pour Capital Énergie
// Forfaits avec Price IDs (à configurer dans le dashboard Stripe)

export const STRIPE_CONFIG = {
  // Mode: 'test' | 'live'
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
  
  // Méthodes de paiement hybrides (CB + SEPA)
  paymentMethodTypes: ['card', 'sepa_debit'] as const,
  
  // Forfaits et leurs Price IDs Stripe
  forfaits: {
    essentiel: {
      priceId: process.env.STRIPE_PRICE_ESSENTIEL || 'price_essentiel_test',
      amount: 14900, // 149 € en centimes
      name: 'Forfait Essentiel',
      description: '3 dossiers/mois - Scanner Flash',
      interval: 'month' as const,
    },
    serenite: {
      priceId: process.env.STRIPE_PRICE_SERENITE || 'price_serenite_test',
      amount: 34900, // 349 € en centimes
      name: 'Forfait Sérénité',
      description: '15 dossiers/mois - Scanner Flash Pro',
      interval: 'month' as const,
    },
    expert: {
      priceId: process.env.STRIPE_PRICE_EXPERT || 'price_expert_test',
      amount: 86000, // 860 € en centimes
      name: 'Forfait Expert',
      description: 'Dossiers illimités - Délégation totale',
      interval: 'month' as const,
    },
  },
  
  // URLs de redirection
  urls: {
    success: '/tarifs?success=true',
    cancel: '/tarifs?canceled=true',
  },
};

export type ForfaitId = keyof typeof STRIPE_CONFIG.forfaits;
