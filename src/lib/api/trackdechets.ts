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

// URLs des environnements Trackdéchets
const TRACKDECHETS_PRODUCTION_URL = 'https://api.trackdechets.beta.gouv.fr';
const TRACKDECHETS_SANDBOX_URL = 'https://api.sandbox.trackdechets.beta.gouv.fr';

// Clés API depuis les variables d'environnement
const PRODUCTION_API_KEY = process.env.TRACKDECHETS_API_KEY || '';
const SANDBOX_API_KEY = process.env.TRACKDECHETS_SANDBOX_API_KEY || '';

// Forcer le mode production si la clé de production est présente et valide
const USE_PRODUCTION = PRODUCTION_API_KEY.length > 0 && !PRODUCTION_API_KEY.startsWith('your_');

const TRACKDECHETS_CONFIG: TrackdechetsConfig = {
  apiUrl: USE_PRODUCTION ? TRACKDECHETS_PRODUCTION_URL : TRACKDECHETS_SANDBOX_URL,
  apiKey: USE_PRODUCTION ? PRODUCTION_API_KEY : SANDBOX_API_KEY,
  isProduction: USE_PRODUCTION,
};

// Log de configuration au démarrage (sans exposer la clé)
console.log(`[Trackdéchets] Mode: ${USE_PRODUCTION ? 'PRODUCTION' : 'SANDBOX'}`);
console.log(`[Trackdéchets] URL: ${TRACKDECHETS_CONFIG.apiUrl}`);
console.log(`[Trackdéchets] API Key configurée: ${TRACKDECHETS_CONFIG.apiKey ? 'OUI' : 'NON'}`);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtient la configuration active (production ou sandbox)
 */
export function getTrackdechetsConfig(): TrackdechetsConfig {
  return TRACKDECHETS_CONFIG;
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

/**
 * Signe un BSDA côté transporteur
 */
export async function signBSDAAsTransporter(bsdaId: string, signatureData: string): Promise<boolean> {
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
            type: 'TRANSPORT',
            author: 'Transporteur',
          },
        },
      }),
    });

    const data = await response.json();
    
    // LOG DIAGNOSTIC
    console.log('[Trackdéchets] Signature transporteur:', JSON.stringify(data, null, 2));
    
    return !data.errors;
  } catch (error) {
    console.error('[Trackdéchets] Erreur signature transporteur:', error);
    return false;
  }
}

/**
 * Récupère les détails d'un BSDA incluant le numéro officiel
 */
export async function getBSDADetails(bsdaId: string): Promise<{
  id: string;
  readableId: string; // Numéro officiel attribué par l'État
  status: TrackdechetsBSDAStatus;
  emitter?: { company?: { name?: string } };
  destination?: { company?: { name?: string } };
} | null> {
  const config = getTrackdechetsConfig();
  
  if (!config.apiKey) {
    console.warn('[Trackdéchets] API Key non configurée');
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
          query GetBsda($id: ID!) {
            bsda(id: $id) {
              id
              readableId
              status
              emitter {
                company {
                  name
                }
              }
              destination {
                company {
                  name
                }
                reception {
                  date
                  weight
                }
                operation {
                  code
                  date
                }
              }
            }
          }
        `,
        variables: { id: bsdaId },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('[Trackdéchets] Erreur récupération BSDA:', data.errors);
      return null;
    }

    return data.data.bsda;
  } catch (error) {
    console.error('[Trackdéchets] Erreur getBSDADetails:', error);
    return null;
  }
}

/**
 * Vérifie le statut d'un BSDA pour les notifications
 * Retourne true si le bordereau a été traité par le centre de destination
 */
export async function checkBSDAProcessed(bsdaId: string): Promise<{
  isProcessed: boolean;
  status: TrackdechetsBSDAStatus | null;
  readableId: string | null;
  processingDate?: string;
}> {
  const details = await getBSDADetails(bsdaId);
  
  if (!details) {
    return { isProcessed: false, status: null, readableId: null };
  }

  return {
    isProcessed: details.status === 'PROCESSED',
    status: details.status,
    readableId: details.readableId,
    processingDate: (details as any).destination?.operation?.date,
  };
}

/**
 * Publie un BSDA (passage de brouillon à officiel)
 * Retourne le numéro de bordereau officiel
 */
export async function publishBSDA(bsdaId: string): Promise<{ readableId: string } | null> {
  const config = getTrackdechetsConfig();
  
  if (!config.apiKey) {
    console.warn('[Trackdéchets] API Key non configurée');
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
          mutation PublishBsda($id: ID!) {
            publishBsda(id: $id) {
              id
              readableId
              status
            }
          }
        `,
        variables: { id: bsdaId },
      }),
    });

    const data = await response.json();
    
    // LOG DIAGNOSTIC
    console.log('[Trackdéchets] Publication BSDA:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('[Trackdéchets] Erreur publication:', data.errors);
      return null;
    }

    return { readableId: data.data.publishBsda.readableId };
  } catch (error) {
    console.error('[Trackdéchets] Erreur publishBSDA:', error);
    return null;
  }
}

// ============================================================================
// EXPORT STATUS
// ============================================================================

export const TRACKDECHETS_STATUS = {
  isReady: isTrackdechetsAvailable(),
  mode: isTrackdechetsAvailable() ? 'production' : 'preparation',
  isProduction: USE_PRODUCTION,
  complianceDate: '2026-01-01',
  message: isTrackdechetsAvailable() 
    ? 'Intégration Trackdéchets active' 
    : 'Mode préparation - Les BSD sont générés localement en attendant l\'activation API',
};
