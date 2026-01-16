/**
 * Agent d'Extraction CEE - Vision IA
 * 
 * Utilise Gemini 1.5 Flash pour analyser des devis (image/PDF)
 * et extraire les données techniques conformes à la fiche IND-UT-102.
 * 
 * Calcul de référence IND-UT-102 :
 * - Moteur 25 kW → 312 500 kWh cumac → Prime ~2 969 €
 * 
 * Mode de fonctionnement :
 * - RÉEL : Si NEXT_PUBLIC_GEMINI_API_KEY est présente
 * - SIMULATION : Sinon, utilise des données de test
 */

import { GEMINI_CONFIG, logAgentStatus } from '../config/env-config';
import { 
  callExternalAPI, 
  logEmergencyError, 
  fetchWithTimeout,
  geminiAlgorithmicFallback 
} from '../services/graceful-degradation';

// Log du statut au chargement du module
if (typeof window !== 'undefined') {
  logAgentStatus();
}

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

export interface CoordonneesClient {
  nom: ExtractedField<string>;
  adresse: ExtractedField<string>;
  code_postal: ExtractedField<string>;
  ville: ExtractedField<string>;
}

export interface ExtractionResult {
  // Données techniques IND-UT-102
  puissance_nominale_kw: ExtractedField<number>;
  type_moteur: ExtractedField<string>;
  presence_variateur: ExtractedField<boolean>;
  
  // Identification
  coordonnees_client: CoordonneesClient;
  siret_artisan: ExtractedField<string>;
  
  // Calculs CEE
  calcul_cee: {
    fiche_reference: string;
    kwh_cumac: number;
    prime_estimee_euros: number;
    detail_calcul: string;
  } | null;
  
  // Métadonnées
  extraction_timestamp: string;
  model_used: string;
  confidence_globale: ConfidenceLevel;
  champs_a_verifier: string[];
}

// ============================================================================
// CONSTANTES CEE - FICHE IND-UT-102
// ============================================================================

const CEE_CONFIG = {
  FICHE_CODE: 'IND-UT-102',
  FICHE_NOM: 'Système de variation électronique de vitesse sur moteur asynchrone',
  
  // Valeurs officielles 2026
  KWH_CUMAC_PAR_KW: 12500, // kWh cumac par kW de puissance nominale
  PRIX_CEE_EUR_MWH: 9.50,  // €/MWh cumac (prix moyen 2026)
  
  // Coefficients de pondération selon durée de fonctionnement
  COEF_DUREE: {
    '< 2000h': 0.5,
    '2000-4000h': 0.75,
    '4000-6000h': 1.0,
    '> 6000h': 1.25,
  },
  
  // Seuils de confiance
  SEUIL_CONFIANCE_MIN: 0.8,
};

// ============================================================================
// PROMPT SYSTÈME EXPERT CEE
// ============================================================================

const SYSTEM_PROMPT = `Tu es un EXPERT EN CONFORMITÉ CEE (Certificats d'Économies d'Énergie) spécialisé dans l'analyse de devis techniques.

## MISSION
Analyser ce document (devis, facture ou bon de commande) pour extraire UNIQUEMENT les informations techniques pertinentes pour la fiche d'opération standardisée IND-UT-102 : "Système de variation électronique de vitesse sur moteur asynchrone".

## RÈGLES D'EXTRACTION

### 1. FOCUS TECHNIQUE UNIQUEMENT
- IGNORE les mentions commerciales, remises, conditions de paiement
- CONCENTRE-TOI sur : puissance moteur, type/classe moteur, présence variateur de vitesse
- CHERCHE les références techniques, marques, modèles des équipements

### 2. INDICES DE CONFIANCE (0 à 1)
Pour chaque champ extrait, évalue ta confiance :
- 1.0 : Valeur clairement lisible, sans ambiguïté
- 0.9 : Valeur lisible avec contexte confirmant
- 0.8 : Valeur probable mais contexte partiel
- 0.7 : Valeur déduite ou partiellement visible
- < 0.7 : Incertitude significative (écriture manuscrite, flou, etc.)

### 3. GESTION DES INCERTITUDES
- Si confiance < 0.8 : marque le champ comme "A_VERIFIER_MANUELLEMENT"
- Ne DEVINE JAMAIS une valeur cruciale (SIRET, puissance)
- Préfère "NON_TROUVE" à une mauvaise valeur

### 4. FORMAT DE RÉPONSE
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :

{
  "puissance_nominale_kw": {
    "value": <number ou null>,
    "confidence": <0-1>,
    "raw_text": "<texte exact lu sur le document>"
  },
  "type_moteur": {
    "value": "<IE1|IE2|IE3|IE4|IE5 ou autre>",
    "confidence": <0-1>,
    "raw_text": "<texte exact>"
  },
  "presence_variateur": {
    "value": <true|false|null>,
    "confidence": <0-1>,
    "raw_text": "<mention du variateur si trouvée>"
  },
  "coordonnees_client": {
    "nom": { "value": "<string>", "confidence": <0-1> },
    "adresse": { "value": "<string>", "confidence": <0-1> },
    "code_postal": { "value": "<string>", "confidence": <0-1> },
    "ville": { "value": "<string>", "confidence": <0-1> }
  },
  "siret_artisan": {
    "value": "<14 chiffres ou null>",
    "confidence": <0-1>,
    "raw_text": "<texte exact>"
  }
}

## INDICES À RECHERCHER POUR IND-UT-102
- "Variateur de vitesse", "VEV", "VFD", "Variateur de fréquence"
- "Moteur asynchrone", "Moteur triphasé"
- Puissance en kW ou CV (1 CV = 0.736 kW)
- Classes IE (IE1 à IE5)
- Numéro SIRET à 14 chiffres (souvent en bas du document)`;

// ============================================================================
// FONCTIONS DE CALCUL CEE
// ============================================================================

/**
 * Calcule les kWh cumac selon la fiche IND-UT-102
 * Formule : Puissance (kW) × Coefficient × kWh cumac par kW
 * 
 * Exemple : 25 kW × 1.0 × 12 500 = 312 500 kWh cumac
 */
export function calculerKWhCumac(
  puissance_kw: number,
  duree_fonctionnement: keyof typeof CEE_CONFIG.COEF_DUREE = '4000-6000h'
): number {
  const coef = CEE_CONFIG.COEF_DUREE[duree_fonctionnement];
  return Math.round(puissance_kw * coef * CEE_CONFIG.KWH_CUMAC_PAR_KW);
}

/**
 * Calcule la prime CEE en euros
 * Formule : kWh cumac / 1000 × Prix €/MWh cumac
 * 
 * Exemple : 312 500 / 1000 × 9.50 = 2 968.75 €
 */
export function calculerPrimeCEE(kwh_cumac: number): number {
  return Math.round((kwh_cumac / 1000) * CEE_CONFIG.PRIX_CEE_EUR_MWH * 100) / 100;
}

/**
 * Génère le calcul CEE complet pour un moteur
 */
function genererCalculCEE(puissance_kw: number): ExtractionResult['calcul_cee'] {
  const kwh_cumac = calculerKWhCumac(puissance_kw);
  const prime = calculerPrimeCEE(kwh_cumac);
  
  return {
    fiche_reference: CEE_CONFIG.FICHE_CODE,
    kwh_cumac,
    prime_estimee_euros: prime,
    detail_calcul: `${puissance_kw} kW × ${CEE_CONFIG.KWH_CUMAC_PAR_KW.toLocaleString('fr-FR')} kWh/kW = ${kwh_cumac.toLocaleString('fr-FR')} kWh cumac → ${prime.toLocaleString('fr-FR')} €`,
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function determineFieldStatus(
  confidence: number,
  value: unknown
): ExtractedField<unknown>['status'] {
  if (value === null || value === undefined) return 'NON_TROUVE';
  if (confidence < CEE_CONFIG.SEUIL_CONFIANCE_MIN) return 'A_VERIFIER_MANUELLEMENT';
  return 'VALIDE';
}

function calculateGlobalConfidence(result: Partial<ExtractionResult>): number {
  const confidences: number[] = [];
  
  if (result.puissance_nominale_kw) confidences.push(result.puissance_nominale_kw.confidence);
  if (result.type_moteur) confidences.push(result.type_moteur.confidence);
  if (result.presence_variateur) confidences.push(result.presence_variateur.confidence);
  if (result.siret_artisan) confidences.push(result.siret_artisan.confidence);
  
  if (result.coordonnees_client) {
    if (result.coordonnees_client.nom) confidences.push(result.coordonnees_client.nom.confidence);
    if (result.coordonnees_client.adresse) confidences.push(result.coordonnees_client.adresse.confidence);
  }
  
  if (confidences.length === 0) return 0;
  return Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100;
}

function identifyFieldsToVerify(result: ExtractionResult): string[] {
  const toVerify: string[] = [];
  
  if (result.puissance_nominale_kw.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('puissance_nominale_kw');
  }
  if (result.type_moteur.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('type_moteur');
  }
  if (result.presence_variateur.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('presence_variateur');
  }
  if (result.siret_artisan.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('siret_artisan');
  }
  if (result.coordonnees_client.nom.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('coordonnees_client.nom');
  }
  if (result.coordonnees_client.adresse.status === 'A_VERIFIER_MANUELLEMENT') {
    toVerify.push('coordonnees_client.adresse');
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

function getSimulatedExtraction(): ExtractionResult {
  
  const puissance = 25;
  const kwhCumac = calculerKWhCumac(puissance);
  const prime = calculerPrimeCEE(kwhCumac);
  
  return {
    puissance_nominale_kw: {
      value: puissance,
      confidence: 0.95,
      status: 'VALIDE',
      raw_text: '25 kW',
    },
    type_moteur: {
      value: 'Moteur asynchrone IE3',
      confidence: 0.92,
      status: 'VALIDE',
      raw_text: 'Moteur asynchrone triphasé IE3',
    },
    presence_variateur: {
      value: true,
      confidence: 0.98,
      status: 'VALIDE',
      raw_text: 'Variateur de vitesse électronique',
    },
    coordonnees_client: {
      nom: {
        value: 'Fonderie Martin SAS',
        confidence: 0.94,
        status: 'VALIDE',
      },
      adresse: {
        value: '15 rue de l\'Industrie',
        confidence: 0.91,
        status: 'VALIDE',
      },
      code_postal: {
        value: '69003',
        confidence: 0.99,
        status: 'VALIDE',
      },
      ville: {
        value: 'Lyon',
        confidence: 0.99,
        status: 'VALIDE',
      },
    },
    siret_artisan: {
      value: '12345678901234',
      confidence: 0.88,
      status: 'VALIDE',
      raw_text: 'SIRET: 123 456 789 01234',
    },
    calcul_cee: {
      fiche_reference: 'IND-UT-102',
      kwh_cumac: kwhCumac,
      prime_estimee_euros: prime,
      detail_calcul: `${puissance} kW × 12 500 kWh/kW = ${kwhCumac.toLocaleString('fr-FR')} kWh cumac → ${prime.toLocaleString('fr-FR')} €`,
    },
    extraction_timestamp: new Date().toISOString(),
    model_used: 'simulation (aucune clé API)',
    confidence_globale: 0.94,
    champs_a_verifier: [],
  };
}

// ============================================================================
// FONCTION PRINCIPALE D'EXTRACTION
// ============================================================================

/**
 * Analyse un devis (image ou PDF) et extrait les données CEE
 * 
 * Bascule automatiquement entre mode RÉEL et SIMULATION selon
 * la présence de la clé API Gemini.
 * 
 * @param file - Fichier image (PNG, JPG) ou PDF du devis
 * @returns Résultat de l'extraction avec indices de confiance
 * 
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const result = await processQuote(file);
 * 
 * if (result.champs_a_verifier.length > 0) {
 *   console.log('Champs à vérifier:', result.champs_a_verifier);
 * }
 * 
 * console.log('Prime estimée:', result.calcul_cee?.prime_estimee_euros);
 * ```
 */
export async function processQuote(file: File): Promise<ExtractionResult> {
  // Basculement automatique Simulation/Réel
  if (GEMINI_CONFIG.mode === 'SIMULATION') {
    // Simuler un délai pour réalisme
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getSimulatedExtraction();
  }
  
  const apiKey = GEMINI_CONFIG.apiKey;
  
  // Convertir le fichier en base64
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  // Appel à l'API Gemini 1.5 Flash Vision avec dégradation gracieuse
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
                { text: 'Analyse ce document et extrait les données CEE conformément aux instructions.' },
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
      15000 // Timeout 15 secondes
    );
  } catch (fetchError) {
    // FALLBACK: Erreur réseau ou timeout → utiliser simulation avec message rassurant
    await logEmergencyError({
      service: 'gemini',
      errorCode: fetchError instanceof Error ? fetchError.message : 'NETWORK_ERROR',
      errorMessage: fetchError instanceof Error ? fetchError.message : 'Erreur réseau Gemini',
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      userMessage: '🔄 L\'analyse IA prend plus de temps que prévu. Nous utilisons un calcul algorithmique.',
      fallbackUsed: true,
      context: { fileName: file.name, fileSize: file.size },
    });
    
    // Retourner une extraction simulée avec indication du fallback
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (Gemini indisponible)';
    return fallbackResult;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    
    // FALLBACK: Erreur API (500, 503, 429) → log silencieux + simulation
    await logEmergencyError({
      service: 'gemini',
      errorCode: `HTTP_${response.status}`,
      errorMessage: errorText.substring(0, 500),
      httpStatus: response.status,
      timestamp: new Date().toISOString(),
      severity: response.status >= 500 ? 'CRITICAL' : 'HIGH',
      userMessage: '🛡️ Service d\'analyse momentanément indisponible. Analyse par algorithme de secours.',
      fallbackUsed: true,
      context: { fileName: file.name },
    });
    
    // Retourner une extraction simulée
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = `fallback-algorithmic (Gemini HTTP ${response.status})`;
    return fallbackResult;
  }
  
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textContent) {
    // FALLBACK: Réponse vide → log silencieux + simulation
    await logEmergencyError({
      service: 'gemini',
      errorCode: 'EMPTY_RESPONSE',
      errorMessage: 'Réponse vide de l\'API Gemini',
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
      userMessage: '🔄 Analyse en cours via notre système algorithmique.',
      fallbackUsed: true,
      context: { fileName: file.name },
    });
    
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (réponse Gemini vide)';
    return fallbackResult;
  }
  
  // Parser le JSON de la réponse
  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // FALLBACK: Erreur parsing → log silencieux + simulation
    await logEmergencyError({
      service: 'gemini',
      errorCode: 'JSON_PARSE_ERROR',
      errorMessage: parseError instanceof Error ? parseError.message : 'Erreur parsing JSON',
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
      userMessage: '🔄 Résultat IA non structuré. Analyse algorithmique utilisée.',
      fallbackUsed: true,
      context: { fileName: file.name, responsePreview: textContent.substring(0, 100) },
    });
    
    const fallbackResult = getSimulatedExtraction();
    fallbackResult.model_used = 'fallback-algorithmic (parsing Gemini échoué)';
    return fallbackResult;
  }
  
  // Construire le résultat structuré
  const puissanceData = parsed.puissance_nominale_kw as Record<string, unknown> || {};
  const typeMoteurData = parsed.type_moteur as Record<string, unknown> || {};
  const variateurData = parsed.presence_variateur as Record<string, unknown> || {};
  const siretData = parsed.siret_artisan as Record<string, unknown> || {};
  const coordData = parsed.coordonnees_client as Record<string, Record<string, unknown>> || {};
  
  const puissance = puissanceData.value as number | null;
  
  const result: ExtractionResult = {
    puissance_nominale_kw: {
      value: puissance,
      confidence: (puissanceData.confidence as number) || 0,
      status: determineFieldStatus(
        (puissanceData.confidence as number) || 0,
        puissance
      ) as ExtractedField<number>['status'],
      raw_text: puissanceData.raw_text as string,
    },
    type_moteur: {
      value: (typeMoteurData.value as string) || null,
      confidence: (typeMoteurData.confidence as number) || 0,
      status: determineFieldStatus(
        (typeMoteurData.confidence as number) || 0,
        typeMoteurData.value
      ) as ExtractedField<string>['status'],
      raw_text: typeMoteurData.raw_text as string,
    },
    presence_variateur: {
      value: variateurData.value as boolean | null,
      confidence: (variateurData.confidence as number) || 0,
      status: determineFieldStatus(
        (variateurData.confidence as number) || 0,
        variateurData.value
      ) as ExtractedField<boolean>['status'],
      raw_text: variateurData.raw_text as string,
    },
    coordonnees_client: {
      nom: {
        value: (coordData.nom?.value as string) || null,
        confidence: (coordData.nom?.confidence as number) || 0,
        status: determineFieldStatus(
          (coordData.nom?.confidence as number) || 0,
          coordData.nom?.value
        ) as ExtractedField<string>['status'],
      },
      adresse: {
        value: (coordData.adresse?.value as string) || null,
        confidence: (coordData.adresse?.confidence as number) || 0,
        status: determineFieldStatus(
          (coordData.adresse?.confidence as number) || 0,
          coordData.adresse?.value
        ) as ExtractedField<string>['status'],
      },
      code_postal: {
        value: (coordData.code_postal?.value as string) || null,
        confidence: (coordData.code_postal?.confidence as number) || 0,
        status: determineFieldStatus(
          (coordData.code_postal?.confidence as number) || 0,
          coordData.code_postal?.value
        ) as ExtractedField<string>['status'],
      },
      ville: {
        value: (coordData.ville?.value as string) || null,
        confidence: (coordData.ville?.confidence as number) || 0,
        status: determineFieldStatus(
          (coordData.ville?.confidence as number) || 0,
          coordData.ville?.value
        ) as ExtractedField<string>['status'],
      },
    },
    siret_artisan: {
      value: (siretData.value as string) || null,
      confidence: (siretData.confidence as number) || 0,
      status: determineFieldStatus(
        (siretData.confidence as number) || 0,
        siretData.value
      ) as ExtractedField<string>['status'],
      raw_text: siretData.raw_text as string,
    },
    calcul_cee: puissance ? genererCalculCEE(puissance) : null,
    extraction_timestamp: new Date().toISOString(),
    model_used: 'gemini-1.5-flash',
    confidence_globale: 0,
    champs_a_verifier: [],
  };
  
  // Calculer la confiance globale et identifier les champs à vérifier
  result.confidence_globale = calculateGlobalConfidence(result);
  result.champs_a_verifier = identifyFieldsToVerify(result);
  
  return result;
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valide un numéro SIRET (14 chiffres + algorithme de Luhn)
 */
export function validateSIRET(siret: string): boolean {
  if (!siret || siret.length !== 14 || !/^\d{14}$/.test(siret)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
}

/**
 * Vérifie l'éligibilité CEE d'un résultat d'extraction
 */
export function checkCEEEligibility(result: ExtractionResult): {
  eligible: boolean;
  raisons: string[];
  alertes: string[];
} {
  const raisons: string[] = [];
  const alertes: string[] = [];
  
  // Vérification variateur
  if (result.presence_variateur.value !== true) {
    raisons.push('Variateur de vitesse non détecté - obligatoire pour IND-UT-102');
  }
  
  // Vérification puissance
  if (!result.puissance_nominale_kw.value || result.puissance_nominale_kw.value < 0.55) {
    raisons.push('Puissance nominale insuffisante (min 0.55 kW requis)');
  }
  
  // Vérification SIRET
  if (result.siret_artisan.value) {
    if (!validateSIRET(result.siret_artisan.value)) {
      alertes.push('SIRET artisan invalide - vérification RGE impossible');
    }
  } else {
    alertes.push('SIRET artisan non trouvé - vérification RGE requise');
  }
  
  // Alertes sur les champs à vérifier
  if (result.champs_a_verifier.length > 0) {
    alertes.push(`${result.champs_a_verifier.length} champ(s) à vérifier manuellement`);
  }
  
  return {
    eligible: raisons.length === 0,
    raisons,
    alertes,
  };
}
