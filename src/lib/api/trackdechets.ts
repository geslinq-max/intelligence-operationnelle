/**
 * Intégration API Trackdéchets
 * Préparation pour la conformité réglementaire 2026
 * 
 * @module lib/api/trackdechets
 * @see https://developers.trackdechets.beta.gouv.fr/
 */

// ============================================================================
// TYPES TRACKDÉCHETS
// ============================================================================

export interface TrackdechetsConfig {
  apiUrl: string;
  apiKey: string;
  isProduction: boolean;
}

export interface TrackdechetsBSDA {
  id?: string;
  customId?: string;
  status?: TrackdechetsBSDAStatus;
  
  // Émetteur (Producteur)
  emitter: {
    company: {
      siret: string;
      name: string;
      address: string;
      contact: string;
      phone: string;
      mail?: string;
    };
    workSite?: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
    };
  };
  
  // Déchet
  waste: {
    code: string; // Code déchet européen (ex: "17 05 04")
    name: string;
    adr?: string; // Code ADR si dangereux
  };
  
  // Conditionnement
  packagings: Array<{
    type: 'BIG_BAG' | 'BENNE' | 'CAISSON' | 'VRAC';
    quantity: number;
  }>;
  
  // Quantité
  weight: {
    value: number; // En tonnes
    isEstimate: boolean;
  };
  
  // Transporteur
  transporter: {
    company: {
      siret: string;
      name: string;
      address?: string;
      contact?: string;
      phone?: string;
    };
    transport: {
      plates: string[]; // Immatriculations
      mode: 'ROAD' | 'RAIL' | 'RIVER' | 'SEA' | 'AIR';
    };
    recepisse?: {
      number: string;
      department: string;
      validityLimit: string; // ISO date
    };
  };
  
  // Destination
  destination: {
    company: {
      siret: string;
      name: string;
      address: string;
    };
    cap?: string; // Numéro CAP si requis
    plannedOperationCode: string; // D5, D9, R5, etc.
  };
}

export type TrackdechetsBSDAStatus = 
  | 'INITIAL'
  | 'SIGNED_BY_PRODUCER'
  | 'SIGNED_BY_WORKER'
  | 'SENT'
  | 'RECEIVED'
  | 'PROCESSED'
  | 'REFUSED'
  | 'AWAITING_CHILD'
  | 'CANCELED';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TRACKDECHETS_CONFIG: TrackdechetsConfig = {
  apiUrl: process.env.TRACKDECHETS_API_URL || 'https://api.trackdechets.beta.gouv.fr',
  apiKey: process.env.TRACKDECHETS_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
};

// Sandbox pour les tests
const SANDBOX_CONFIG: TrackdechetsConfig = {
  apiUrl: 'https://api.sandbox.trackdechets.beta.gouv.fr',
  apiKey: process.env.TRACKDECHETS_SANDBOX_API_KEY || '',
  isProduction: false,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtient la configuration active (production ou sandbox)
 */
export function getTrackdechetsConfig(): TrackdechetsConfig {
  if (TRACKDECHETS_CONFIG.apiKey && TRACKDECHETS_CONFIG.isProduction) {
    return TRACKDECHETS_CONFIG;
  }
  return SANDBOX_CONFIG;
}

/**
 * Vérifie si l'intégration Trackdéchets est disponible
 */
export function isTrackdechetsAvailable(): boolean {
  const config = getTrackdechetsConfig();
  return !!config.apiKey;
}

/**
 * Convertit les données du formulaire BSD en format Trackdéchets
 */
export function convertBSDToTrackdechets(bsdData: {
  chantierNom: string;
  chantierAdresse: string;
  producteurNom: string;
  producteurSiret: string;
  producteurTel: string;
  typeDechet: string;
  codeDechet: string;
  tonnageEstime: number;
  conditionnement: string;
  destinationNom: string;
  destinationAdresse: string;
  destinationType: string;
  transporteurNom: string;
  transporteurSiret: string;
  immatriculationVehicule: string;
}): Partial<TrackdechetsBSDA> {
  // Mapping type destination vers code opération
  const operationCodes: Record<string, string> = {
    'ISDI': 'D5', // Mise en décharge spécialement aménagée
    'ISDND': 'D5',
    'RECYCLAGE': 'R5', // Recyclage/récupération
    'VALORISATION': 'R5',
  };

  return {
    emitter: {
      company: {
        siret: bsdData.producteurSiret.replace(/\s/g, ''),
        name: bsdData.producteurNom,
        address: bsdData.chantierAdresse,
        contact: bsdData.producteurNom,
        phone: bsdData.producteurTel,
      },
      workSite: {
        name: bsdData.chantierNom,
        address: bsdData.chantierAdresse,
        city: '', // À extraire de l'adresse
        postalCode: '', // À extraire de l'adresse
      },
    },
    waste: {
      code: bsdData.codeDechet.replace(/\s/g, ' '),
      name: getWasteName(bsdData.typeDechet),
    },
    packagings: [{
      type: bsdData.conditionnement as 'BIG_BAG' | 'BENNE' | 'CAISSON' | 'VRAC',
      quantity: 1,
    }],
    weight: {
      value: bsdData.tonnageEstime,
      isEstimate: true,
    },
    transporter: {
      company: {
        siret: bsdData.transporteurSiret.replace(/\s/g, ''),
        name: bsdData.transporteurNom,
      },
      transport: {
        plates: bsdData.immatriculationVehicule ? [bsdData.immatriculationVehicule] : [],
        mode: 'ROAD',
      },
    },
    destination: {
      company: {
        siret: '', // À compléter avec base ICPE
        name: bsdData.destinationNom,
        address: bsdData.destinationAdresse,
      },
      plannedOperationCode: operationCodes[bsdData.destinationType] || 'D5',
    },
  };
}

/**
 * Retourne le nom du déchet selon son type
 */
function getWasteName(typeDechet: string): string {
  const names: Record<string, string> = {
    'TERRE': 'Terres et cailloux ne contenant pas de substances dangereuses',
    'GRAVATS': 'Mélanges de béton, briques, tuiles et céramiques',
    'VERTS': 'Déchets biodégradables',
    'MIXTE': 'Déchets de construction et de démolition en mélange',
    'DANGEREUX': 'Matériaux de construction contenant de l\'amiante',
  };
  return names[typeDechet] || 'Déchets de construction';
}

// ============================================================================
// API CALLS (Préparation 2026)
// ============================================================================

/**
 * Crée un brouillon de BSDA sur Trackdéchets
 * @note Cette fonction sera activée lors de l'intégration complète
 */
export async function createBSDADraft(bsda: Partial<TrackdechetsBSDA>): Promise<{ id: string } | null> {
  const config = getTrackdechetsConfig();
  
  if (!config.apiKey) {
    console.warn('[Trackdéchets] API Key non configurée - Mode préparation');
    return null;
  }

  try {
    const response = await fetch(`${config.apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateBsdaDraft($input: BsdaInput!) {
            createDraftBsda(input: $input) {
              id
              status
            }
          }
        `,
        variables: {
          input: bsda,
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('[Trackdéchets] Erreur API:', data.errors);
      return null;
    }

    return { id: data.data.createDraftBsda.id };
  } catch (error) {
    console.error('[Trackdéchets] Erreur création BSDA:', error);
    return null;
  }
}

/**
 * Signe un BSDA côté producteur
 */
export async function signBSDAAsProducer(bsdaId: string, signatureData: string): Promise<boolean> {
  const config = getTrackdechetsConfig();
  
  if (!config.apiKey) {
    console.warn('[Trackdéchets] API Key non configurée');
    return false;
  }

  try {
    const response = await fetch(`${config.apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        query: `
          mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
            signBsda(id: $id, input: $input) {
              id
              status
            }
          }
        `,
        variables: {
          id: bsdaId,
          input: {
            type: 'EMISSION',
            author: 'Producteur',
          },
        },
      }),
    });

    const data = await response.json();
    return !data.errors;
  } catch (error) {
    console.error('[Trackdéchets] Erreur signature:', error);
    return false;
  }
}

// ============================================================================
// EXPORT STATUS
// ============================================================================

export const TRACKDECHETS_STATUS = {
  isReady: isTrackdechetsAvailable(),
  mode: isTrackdechetsAvailable() ? 'production' : 'preparation',
  complianceDate: '2026-01-01',
  message: isTrackdechetsAvailable() 
    ? 'Intégration Trackdéchets active' 
    : 'Mode préparation - Les BSD sont générés localement en attendant l\'activation API',
};
