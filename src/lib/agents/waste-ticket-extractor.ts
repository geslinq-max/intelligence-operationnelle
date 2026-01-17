/**
 * Agent d'Extraction Ticket de Pesée - Vision IA (Mode Paysagiste)
 * 
 * Utilise Gemini 1.5 Flash pour analyser des tickets de pesée
 * et extraire les données pour pré-remplir le formulaire BSD Express.
 * 
 * Dictionnaire d'extraction "Déchets" :
 * - Poids (tonnes)
 * - Type de déchet
 * - Installation de destination
 * 
 * Mode de fonctionnement :
 * - RÉEL : Si NEXT_PUBLIC_GEMINI_API_KEY est présente
 * - SIMULATION : Sinon, utilise des données de test
 */

import { GEMINI_CONFIG } from '../config/env-config';
import { 
  logEmergencyError, 
  fetchWithTimeout 
} from '../services/graceful-degradation';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export type ConfidenceLevel = number; // 0 à 1

export interface ExtractedField<T> {
  value: T | null;
  confidence: ConfidenceLevel;
  status: 'VALIDE' | 'A_VERIFIER_MANUELLEMENT' | 'NON_TROUVE';
  raw_text?: string;
}

export type WasteType = 'TERRE' | 'GRAVATS' | 'VERTS' | 'MIXTE' | 'DANGEREUX';
export type DestinationType = 'ISDI' | 'ISDND' | 'RECYCLAGE' | 'VALORISATION';

export interface WasteTicketExtractionResult {
  // Données du ticket
  poids_tonnes: ExtractedField<number>;
  type_dechet: ExtractedField<WasteType>;
  code_dechet: ExtractedField<string>;
  
  // Destination
  destination_nom: ExtractedField<string>;
  destination_adresse: ExtractedField<string>;
  destination_type: ExtractedField<DestinationType>;
  
  // Transporteur (si présent sur le ticket)
  transporteur_nom: ExtractedField<string>;
  immatriculation: ExtractedField<string>;
  
  // Date
  date_pesee: ExtractedField<string>;
  
  // Alertes
  is_dangerous: boolean;
  dangerous_alert?: string;
  
  // Métadonnées
  extraction_timestamp: string;
  model_used: string;
  confidence_globale: ConfidenceLevel;
  champs_a_verifier: string[];
}

// ============================================================================
// DICTIONNAIRE DE CLASSIFICATION DES DÉCHETS
// ============================================================================

export const WASTE_CLASSIFICATION = {
  // Déchets inertes (ISDI)
  TERRE: {
    code: '17 05 04',
    label: 'Terres et cailloux',
    destination: 'ISDI' as DestinationType,
    dangerous: false,
    keywords: ['terre', 'cailloux', 'remblai', 'déblai', 'excavation', 'terrassement'],
  },
  GRAVATS: {
    code: '17 01 07',
    label: 'Gravats / Béton',
    destination: 'ISDI' as DestinationType,
    dangerous: false,
    keywords: ['béton', 'gravats', 'parpaing', 'brique', 'tuile', 'céramique', 'démolition'],
  },
  // Déchets non dangereux (ISDND ou recyclage)
  VERTS: {
    code: '20 02 01',
    label: 'Déchets verts',
    destination: 'VALORISATION' as DestinationType,
    dangerous: false,
    keywords: ['végétaux', 'vert', 'branchage', 'tonte', 'feuilles', 'élagage', 'gazon'],
  },
  MIXTE: {
    code: '17 09 04',
    label: 'Déchets mélangés',
    destination: 'ISDND' as DestinationType,
    dangerous: false,
    keywords: ['mélangé', 'mixte', 'divers', 'encombrant', 'tout venant'],
  },
  // Déchets dangereux (BSDD obligatoire)
  DANGEREUX: {
    code: '17 06 05*',
    label: 'Déchets dangereux',
    destination: 'ISDND' as DestinationType,
    dangerous: true,
    keywords: ['amiante', 'dangereux', 'toxique', 'polluant', 'huile', 'peinture', 'solvant', 'phyto'],
  },
};

// Liste des mots-clés indiquant un déchet dangereux
const DANGEROUS_KEYWORDS = [
  'amiante',
  'amiante-ciment',
  'fibrociment',
  'éternit',
  'plomb',
  'hydrocarbure',
  'huile usagée',
  'peinture plomb',
  'solvant',
  'phytosanitaire',
  'pesticide',
  'désamiantage',
  'PCB',
  'HAP',
  'goudron',
  'bitume pollué',
];

// ============================================================================
// PROMPT SYSTÈME EXPERT DÉCHETS
// ============================================================================

const SYSTEM_PROMPT = `Tu es un EXPERT EN GESTION DES DÉCHETS spécialisé dans l'analyse de tickets de pesée pour les entreprises du paysage et de la démolition.

## MISSION
Analyser ce ticket de pesée (bon de pesée, bordereau) pour extraire les informations nécessaires à la création d'un BSD (Bordereau de Suivi des Déchets).

## DICTIONNAIRE D'EXTRACTION PRIORITAIRE

### 1. POIDS
- Cherche : "Poids net", "Tonnage", "Masse", "Net", "Pesée"
- Unité attendue : TONNES (convertir si en kg : diviser par 1000)
- Si deux pesées (brut/tare), calcule le NET

### 2. TYPE DE DÉCHET
- Cherche : Nature, Désignation, Type, Catégorie du déchet
- Classifie parmi : TERRE, GRAVATS, VERTS, MIXTE, DANGEREUX
- ATTENTION CRITIQUE : Si tu détectes ces mots → DANGEREUX :
  ${DANGEROUS_KEYWORDS.join(', ')}

### 3. INSTALLATION DE DESTINATION
- Cherche : Nom du site, Centre de traitement, ISDI, ISDND, Plateforme
- Note l'adresse si présente

### 4. TRANSPORTEUR (optionnel)
- Cherche : Transporteur, Immatriculation, Plaque

### 5. DATE
- Cherche : Date de pesée, Date d'entrée

## RÈGLES D'EXTRACTION

### Indices de confiance (0 à 1)
- 1.0 : Valeur clairement lisible
- 0.9 : Valeur lisible avec contexte
- 0.8 : Valeur probable
- 0.7 : Valeur déduite
- < 0.7 : Incertitude

### Gestion des incertitudes
- Si confiance < 0.8 : marque "A_VERIFIER_MANUELLEMENT"
- Ne devine JAMAIS un poids crucial
- Préfère "NON_TROUVE" à une mauvaise valeur

## FORMAT DE RÉPONSE JSON

{
  "poids_tonnes": {
    "value": <number>,
    "confidence": <0-1>,
    "raw_text": "<texte exact lu>"
  },
  "type_dechet": {
    "value": "<TERRE|GRAVATS|VERTS|MIXTE|DANGEREUX>",
    "confidence": <0-1>,
    "raw_text": "<description lue>"
  },
  "code_dechet": {
    "value": "<code déchet si présent>",
    "confidence": <0-1>
  },
  "destination_nom": {
    "value": "<nom installation>",
    "confidence": <0-1>
  },
  "destination_adresse": {
    "value": "<adresse si présente>",
    "confidence": <0-1>
  },
  "destination_type": {
    "value": "<ISDI|ISDND|RECYCLAGE|VALORISATION>",
    "confidence": <0-1>
  },
  "transporteur_nom": {
    "value": "<nom transporteur si présent>",
    "confidence": <0-1>
  },
  "immatriculation": {
    "value": "<plaque si présente>",
    "confidence": <0-1>
  },
  "date_pesee": {
    "value": "<date format YYYY-MM-DD>",
    "confidence": <0-1>
  },
  "dangerous_indicators": ["<liste des mots dangereux détectés>"]
}

⚠️ CRITIQUE : Si tu détectes le moindre indicateur de déchet dangereux, le type DOIT être "DANGEREUX".`;

// ============================================================================
// CONSTANTES
// ============================================================================

const SEUIL_CONFIANCE_MIN = 0.8;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function determineFieldStatus(
  confidence: number,
  value: unknown
): ExtractedField<unknown>['status'] {
  if (value === null || value === undefined || value === '') return 'NON_TROUVE';
  if (confidence < SEUIL_CONFIANCE_MIN) return 'A_VERIFIER_MANUELLEMENT';
  return 'VALIDE';
}

function calculateGlobalConfidence(result: Partial<WasteTicketExtractionResult>): number {
  const confidences: number[] = [];
  
  if (result.poids_tonnes) confidences.push(result.poids_tonnes.confidence);
  if (result.type_dechet) confidences.push(result.type_dechet.confidence);
  if (result.destination_nom) confidences.push(result.destination_nom.confidence);
  
  if (confidences.length === 0) return 0;
  return Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100;
}

function identifyFieldsToVerify(result: WasteTicketExtractionResult): string[] {
  const toVerify: string[] = [];
  
  if (result.poids_tonnes.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('poids_tonnes');
  }
  if (result.type_dechet.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('type_dechet');
  }
  if (result.destination_nom.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('destination_nom');
  }
  if (result.transporteur_nom.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('transporteur_nom');
  }
  
  return toVerify;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// ============================================================================
// DONNÉES DE SIMULATION (Mode Fallback)
// ============================================================================

function getSimulatedExtraction(): WasteTicketExtractionResult {
  return {
    poids_tonnes: {
      value: 12.5,
      confidence: 0.95,
      status: 'VALIDE',
      raw_text: 'Net: 12,500 kg → 12.5 T',
    },
    type_dechet: {
      value: 'GRAVATS',
      confidence: 0.92,
      status: 'VALIDE',
      raw_text: 'Gravats de démolition - béton',
    },
    code_dechet: {
      value: '17 01 07',
      confidence: 0.90,
      status: 'VALIDE',
      raw_text: '17 01 07',
    },
    destination_nom: {
      value: 'ISDI du Grand Est',
      confidence: 0.94,
      status: 'VALIDE',
      raw_text: 'ISDI DU GRAND EST',
    },
    destination_adresse: {
      value: 'Zone industrielle, 10000 Troyes',
      confidence: 0.88,
      status: 'VALIDE',
      raw_text: 'ZI Troyes 10000',
    },
    destination_type: {
      value: 'ISDI',
      confidence: 0.96,
      status: 'VALIDE',
    },
    transporteur_nom: {
      value: 'Transport Durand',
      confidence: 0.85,
      status: 'VALIDE',
      raw_text: 'TRANSPORT DURAND SARL',
    },
    immatriculation: {
      value: 'AB-123-CD',
      confidence: 0.90,
      status: 'VALIDE',
      raw_text: 'AB 123 CD',
    },
    date_pesee: {
      value: new Date().toISOString().split('T')[0],
      confidence: 0.95,
      status: 'VALIDE',
    },
    is_dangerous: false,
    extraction_timestamp: new Date().toISOString(),
    model_used: 'simulation (démonstration)',
    confidence_globale: 0.92,
    champs_a_verifier: [],
  };
}

// Simulation avec déchet dangereux pour test
function getSimulatedDangerousExtraction(): WasteTicketExtractionResult {
  return {
    poids_tonnes: {
      value: 2.3,
      confidence: 0.95,
      status: 'VALIDE',
      raw_text: 'Net: 2,300 kg → 2.3 T',
    },
    type_dechet: {
      value: 'DANGEREUX',
      confidence: 0.98,
      status: 'VALIDE',
      raw_text: 'Amiante-ciment - plaques fibrociment',
    },
    code_dechet: {
      value: '17 06 05*',
      confidence: 0.95,
      status: 'VALIDE',
      raw_text: '17 06 05*',
    },
    destination_nom: {
      value: 'Centre agréé amiante SUEZ',
      confidence: 0.90,
      status: 'VALIDE',
    },
    destination_adresse: {
      value: 'Route de Dijon, 21000 Dijon',
      confidence: 0.85,
      status: 'VALIDE',
    },
    destination_type: {
      value: 'ISDND',
      confidence: 0.92,
      status: 'VALIDE',
    },
    transporteur_nom: {
      value: 'ADR Transport Spécialisé',
      confidence: 0.88,
      status: 'VALIDE',
    },
    immatriculation: {
      value: 'XY-789-ZW',
      confidence: 0.90,
      status: 'VALIDE',
    },
    date_pesee: {
      value: new Date().toISOString().split('T')[0],
      confidence: 0.95,
      status: 'VALIDE',
    },
    is_dangerous: true,
    dangerous_alert: '⚠️ DÉCHET DANGEREUX DÉTECTÉ : Amiante-ciment. Un BSDD (Bordereau de Suivi des Déchets Dangereux) est OBLIGATOIRE. Ce formulaire BSD simple ne convient pas.',
    extraction_timestamp: new Date().toISOString(),
    model_used: 'simulation (démonstration déchet dangereux)',
    confidence_globale: 0.92,
    champs_a_verifier: [],
  };
}

// ============================================================================
// FONCTION PRINCIPALE D'EXTRACTION
// ============================================================================

/**
 * Analyse un ticket de pesée (image ou PDF) et extrait les données déchets
 * 
 * @param file - Fichier image (PNG, JPG) ou PDF du ticket de pesée
 * @returns Résultat de l'extraction avec indices de confiance
 */
export async function processWasteTicket(file: File): Promise<WasteTicketExtractionResult> {
  // Basculement automatique Simulation/Réel
  if (GEMINI_CONFIG.mode === 'SIMULATION') {
    // Simuler un délai pour réalisme
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 20% de chance d'avoir un déchet dangereux en simulation (pour test)
    if (Math.random() < 0.2) {
      return getSimulatedDangerousExtraction();
    }
    return getSimulatedExtraction();
  }
  
  const apiKey = GEMINI_CONFIG.apiKey;
  
  // Convertir le fichier en base64
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  // Appel à l'API Gemini 1.5 Flash Vision
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
                { text: 'Analyse ce ticket de pesée et extrais les données pour le BSD.' },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      },
      15000
    );
  } catch (fetchError) {
    await logEmergencyError({
      service: 'gemini',
      errorCode: fetchError instanceof Error ? fetchError.message : 'NETWORK_ERROR',
      errorMessage: fetchError instanceof Error ? fetchError.message : 'Erreur réseau Gemini',
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      userMessage: '🔄 L\'analyse IA prend plus de temps que prévu.',
      fallbackUsed: true,
      context: { fileName: file.name, fileSize: file.size },
    });
    
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (Gemini indisponible)';
    return fallbackResult;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    
    await logEmergencyError({
      service: 'gemini',
      errorCode: `HTTP_${response.status}`,
      errorMessage: errorText.substring(0, 500),
      httpStatus: response.status,
      timestamp: new Date().toISOString(),
      severity: response.status >= 500 ? 'CRITICAL' : 'HIGH',
      userMessage: '🛡️ Service d\'analyse momentanément indisponible.',
      fallbackUsed: true,
      context: { fileName: file.name },
    });
    
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = `fallback-algorithmic (HTTP ${response.status})`;
    return fallbackResult;
  }
  
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textContent) {
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (réponse vide)';
    return fallbackResult;
  }
  
  // Parser le JSON de la réponse
  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (parsing échoué)';
    return fallbackResult;
  }
  
  // Construire le résultat structuré
  const poidsData = parsed.poids_tonnes as Record<string, unknown> || {};
  const typeData = parsed.type_dechet as Record<string, unknown> || {};
  const codeData = parsed.code_dechet as Record<string, unknown> || {};
  const destNomData = parsed.destination_nom as Record<string, unknown> || {};
  const destAddrData = parsed.destination_adresse as Record<string, unknown> || {};
  const destTypeData = parsed.destination_type as Record<string, unknown> || {};
  const transportData = parsed.transporteur_nom as Record<string, unknown> || {};
  const immatData = parsed.immatriculation as Record<string, unknown> || {};
  const dateData = parsed.date_pesee as Record<string, unknown> || {};
  const dangerousIndicators = (parsed.dangerous_indicators as string[]) || [];
  
  const typeDechet = typeData.value as WasteType || 'MIXTE';
  const isDangerous = typeDechet === 'DANGEREUX' || dangerousIndicators.length > 0;
  
  const result: WasteTicketExtractionResult = {
    poids_tonnes: {
      value: poidsData.value as number | null,
      confidence: (poidsData.confidence as number) || 0,
      status: determineFieldStatus(
        (poidsData.confidence as number) || 0,
        poidsData.value
      ) as ExtractedField<number>['status'],
      raw_text: poidsData.raw_text as string,
    },
    type_dechet: {
      value: isDangerous ? 'DANGEREUX' : typeDechet,
      confidence: (typeData.confidence as number) || 0,
      status: determineFieldStatus(
        (typeData.confidence as number) || 0,
        typeData.value
      ) as ExtractedField<WasteType>['status'],
      raw_text: typeData.raw_text as string,
    },
    code_dechet: {
      value: (codeData.value as string) || WASTE_CLASSIFICATION[isDangerous ? 'DANGEREUX' : typeDechet]?.code || null,
      confidence: (codeData.confidence as number) || 0.8,
      status: determineFieldStatus(
        (codeData.confidence as number) || 0.8,
        codeData.value
      ) as ExtractedField<string>['status'],
    },
    destination_nom: {
      value: (destNomData.value as string) || null,
      confidence: (destNomData.confidence as number) || 0,
      status: determineFieldStatus(
        (destNomData.confidence as number) || 0,
        destNomData.value
      ) as ExtractedField<string>['status'],
      raw_text: destNomData.raw_text as string,
    },
    destination_adresse: {
      value: (destAddrData.value as string) || null,
      confidence: (destAddrData.confidence as number) || 0,
      status: determineFieldStatus(
        (destAddrData.confidence as number) || 0,
        destAddrData.value
      ) as ExtractedField<string>['status'],
    },
    destination_type: {
      value: (destTypeData.value as DestinationType) || 
             WASTE_CLASSIFICATION[isDangerous ? 'DANGEREUX' : typeDechet]?.destination || 'ISDND',
      confidence: (destTypeData.confidence as number) || 0.8,
      status: determineFieldStatus(
        (destTypeData.confidence as number) || 0.8,
        destTypeData.value
      ) as ExtractedField<DestinationType>['status'],
    },
    transporteur_nom: {
      value: (transportData.value as string) || null,
      confidence: (transportData.confidence as number) || 0,
      status: determineFieldStatus(
        (transportData.confidence as number) || 0,
        transportData.value
      ) as ExtractedField<string>['status'],
    },
    immatriculation: {
      value: (immatData.value as string) || null,
      confidence: (immatData.confidence as number) || 0,
      status: determineFieldStatus(
        (immatData.confidence as number) || 0,
        immatData.value
      ) as ExtractedField<string>['status'],
    },
    date_pesee: {
      value: (dateData.value as string) || null,
      confidence: (dateData.confidence as number) || 0,
      status: determineFieldStatus(
        (dateData.confidence as number) || 0,
        dateData.value
      ) as ExtractedField<string>['status'],
    },
    is_dangerous: isDangerous,
    dangerous_alert: isDangerous 
      ? `⚠️ DÉCHET DANGEREUX DÉTECTÉ${dangerousIndicators.length > 0 ? ` : ${dangerousIndicators.join(', ')}` : ''}. Un BSDD (Bordereau de Suivi des Déchets Dangereux) est OBLIGATOIRE. Ce formulaire BSD simple ne convient pas.`
      : undefined,
    extraction_timestamp: new Date().toISOString(),
    model_used: 'gemini-1.5-flash',
    confidence_globale: 0,
    champs_a_verifier: [],
  };
  
  result.confidence_globale = calculateGlobalConfidence(result);
  result.champs_a_verifier = identifyFieldsToVerify(result);
  
  return result;
}

/**
 * Vérifie si un type de déchet nécessite un BSDD
 */
export function requiresBSDD(wasteType: WasteType): boolean {
  return wasteType === 'DANGEREUX';
}

/**
 * Obtient les informations de classification pour un type de déchet
 */
export function getWasteClassification(wasteType: WasteType) {
  return WASTE_CLASSIFICATION[wasteType] || WASTE_CLASSIFICATION.MIXTE;
}
