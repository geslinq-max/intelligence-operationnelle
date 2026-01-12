/**
 * Agent de Contrôle CEE - Validation & Audit
 * 
 * Rôle : Vérifier et auditer les résultats de l'Agent A (cee-extractor)
 * - Vérification croisée par relecture du document original
 * - Recalcul indépendant des kWh cumac et primes
 * - Validation SIRET via simulation annuaire
 * - Zoom IA sur les champs marqués A_VERIFIER_MANUELLEMENT
 */

import {
  type ExtractionResult,
  type ExtractedField,
  calculerKWhCumac,
  calculerPrimeCEE,
  validateSIRET,
} from './cee-extractor';

// Re-export ExtractionResult pour usage externe
export type { ExtractionResult } from './cee-extractor';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export type ValidationStatus = 'VALIDE' | 'ALERTE_DISCORDANCE' | 'VERIFICATION_MANUELLE_REQUISE';

export interface DiscordanceDetail {
  champ: string;
  valeur_agent_a: string | number | boolean | null;
  valeur_agent_b: string | number | boolean | null;
  ecart?: number | string;
  gravite: 'CRITIQUE' | 'MAJEURE' | 'MINEURE';
  description: string;
}

export interface SIRETVerification {
  siret: string;
  valide_format: boolean;
  entreprise_trouvee: boolean;
  raison_sociale?: string;
  qualification_rge?: boolean;
  date_verification: string;
}

export interface ZoomResult {
  champ: string;
  ancienne_valeur: unknown;
  nouvelle_valeur: unknown;
  nouvelle_confiance: number;
  resolution: 'RESOLU' | 'INCERTAIN' | 'ECHEC';
  details: string;
}

export interface ValidationReport {
  // Verdict final
  statut: ValidationStatus;
  
  // Vérifications effectuées
  verification_puissance: {
    valeur_agent_a: number | null;
    valeur_relue: number | null;
    concordance: boolean;
    confiance_relecture: number;
  };
  
  verification_calcul: {
    kwh_cumac_agent_a: number | null;
    kwh_cumac_recalcule: number;
    prime_agent_a: number | null;
    prime_recalculee: number;
    concordance_kwh: boolean;
    concordance_prime: boolean;
    ecart_prime_euros: number;
  };
  
  verification_siret: SIRETVerification | null;
  
  // Résultats du zoom IA
  zoom_ia_resultats: ZoomResult[];
  
  // Discordances détectées
  discordances: DiscordanceDetail[];
  
  // Rapport textuel
  rapport_audit: string;
  
  // Métadonnées
  timestamp: string;
  duree_validation_ms: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TOLERANCE_PRIME_EUROS = 0; // Tolérance 0 € = stricte
const CEE_KWH_PAR_KW = 12500;
const CEE_PRIX_MWH = 9.50;

// ============================================================================
// PROMPT SYSTÈME POUR RELECTURE CIBLÉE
// ============================================================================

const RELECTURE_PUISSANCE_PROMPT = `Tu es un VÉRIFICATEUR EXPERT en lecture de documents techniques.

## MISSION UNIQUE
Relire ce document pour extraire UNIQUEMENT la PUISSANCE NOMINALE DU MOTEUR en kilowatts (kW).

## ATTENTION PARTICULIÈRE
- VÉRIFIE les unités : kW vs CV (1 CV = 0.736 kW)
- ATTENTION aux décimales : "25 kW" ≠ "2.5 kW" ≠ "2,5 kW"
- CHERCHE dans les spécifications techniques, pas dans les descriptions commerciales
- Si plusieurs puissances sont mentionnées, prends la PUISSANCE NOMINALE (pas la puissance absorbée)

## FORMAT DE RÉPONSE (JSON strict)
{
  "puissance_kw": <number ou null>,
  "confidence": <0-1>,
  "raw_text": "<texte exact lu>",
  "unite_origine": "<kW ou CV>",
  "conversion_effectuee": <boolean>
}`;

const ZOOM_FIELD_PROMPT = `Tu es un EXPERT EN ANALYSE DOCUMENTAIRE avec capacité de lecture approfondie.

## MISSION
Un premier agent a marqué un champ comme "A_VERIFIER_MANUELLEMENT" car sa confiance était insuffisante.
Tu dois effectuer une LECTURE APPROFONDIE (zoom IA) pour tenter de lever le doute.

## CHAMP À ANALYSER : {FIELD_NAME}
## VALEUR ACTUELLE : {CURRENT_VALUE}
## CONFIANCE ACTUELLE : {CURRENT_CONFIDENCE}

## INSTRUCTIONS
1. Concentre-toi UNIQUEMENT sur ce champ spécifique
2. Cherche des indices contextuels (en-tête, pied de page, tampons)
3. Si écriture manuscrite : tente une OCR approfondie
4. Compare avec d'autres occurrences du même champ dans le document

## FORMAT DE RÉPONSE (JSON strict)
{
  "nouvelle_valeur": <valeur extraite ou null>,
  "confidence": <0-1>,
  "raw_text": "<texte exact lu>",
  "indices_utilises": ["<indice 1>", "<indice 2>"],
  "resolution": "<RESOLU|INCERTAIN|ECHEC>",
  "explication": "<détails de l'analyse>"
}`;

// ============================================================================
// FONCTIONS DE VÉRIFICATION
// ============================================================================

/**
 * Relecture ciblée de la puissance moteur sur le document original
 */
async function relirePuissance(
  file: File,
  apiKey: string
): Promise<{ puissance: number | null; confidence: number; raw_text?: string }> {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: RELECTURE_PUISSANCE_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.05, topP: 0.9, maxOutputTokens: 512 },
      }),
    }
  );
  
  if (!response.ok) {
    console.error('Erreur relecture puissance:', await response.text());
    return { puissance: null, confidence: 0 };
  }
  
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const jsonMatch = textContent?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { puissance: null, confidence: 0 };
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      puissance: parsed.puissance_kw,
      confidence: parsed.confidence || 0,
      raw_text: parsed.raw_text,
    };
  } catch {
    return { puissance: null, confidence: 0 };
  }
}

/**
 * Zoom IA sur un champ spécifique marqué A_VERIFIER_MANUELLEMENT
 */
async function zoomChamp(
  file: File,
  fieldName: string,
  currentValue: unknown,
  currentConfidence: number,
  apiKey: string
): Promise<ZoomResult> {
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  const prompt = ZOOM_FIELD_PROMPT
    .replace('{FIELD_NAME}', fieldName)
    .replace('{CURRENT_VALUE}', String(currentValue ?? 'null'))
    .replace('{CURRENT_CONFIDENCE}', String(currentConfidence));
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, topP: 0.9, maxOutputTokens: 512 },
      }),
    }
  );
  
  if (!response.ok) {
    return {
      champ: fieldName,
      ancienne_valeur: currentValue,
      nouvelle_valeur: currentValue,
      nouvelle_confiance: currentConfidence,
      resolution: 'ECHEC',
      details: `Erreur API: ${response.status}`,
    };
  }
  
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const jsonMatch = textContent?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Pas de JSON');
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      champ: fieldName,
      ancienne_valeur: currentValue,
      nouvelle_valeur: parsed.nouvelle_valeur,
      nouvelle_confiance: parsed.confidence || 0,
      resolution: parsed.resolution || 'INCERTAIN',
      details: parsed.explication || '',
    };
  } catch {
    return {
      champ: fieldName,
      ancienne_valeur: currentValue,
      nouvelle_valeur: currentValue,
      nouvelle_confiance: currentConfidence,
      resolution: 'ECHEC',
      details: 'Erreur parsing réponse zoom',
    };
  }
}

/**
 * Simulation de vérification SIRET via annuaire
 * En production, remplacer par appel API INSEE ou annuaire-entreprises.data.gouv.fr
 */
async function verifierSIRETAnnuaire(siret: string): Promise<SIRETVerification> {
  const valide_format = validateSIRET(siret);
  
  // Simulation d'une base de données d'entreprises RGE
  const MOCK_ENTREPRISES_RGE: Record<string, { raison_sociale: string; rge: boolean }> = {
    '12345678901234': { raison_sociale: 'DUPONT INSTALLATIONS SARL', rge: true },
    '98765432109876': { raison_sociale: 'MARTIN ENERGIE SAS', rge: true },
    '11111111111111': { raison_sociale: 'ELECTRICITE GENERALE', rge: false },
  };
  
  const entreprise = MOCK_ENTREPRISES_RGE[siret];
  
  return {
    siret,
    valide_format,
    entreprise_trouvee: !!entreprise,
    raison_sociale: entreprise?.raison_sociale,
    qualification_rge: entreprise?.rge,
    date_verification: new Date().toISOString(),
  };
}

/**
 * Recalcul indépendant des kWh cumac et de la prime
 */
function recalculerCEE(puissance_kw: number): { kwh_cumac: number; prime_euros: number } {
  const kwh_cumac = Math.round(puissance_kw * CEE_KWH_PAR_KW);
  const prime_euros = Math.round((kwh_cumac / 1000) * CEE_PRIX_MWH * 100) / 100;
  return { kwh_cumac, prime_euros };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
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
    default: return 'application/octet-stream';
  }
}

function genererRapportAudit(
  statut: ValidationStatus,
  discordances: DiscordanceDetail[],
  verif_puissance: ValidationReport['verification_puissance'],
  verif_calcul: ValidationReport['verification_calcul'],
  verif_siret: SIRETVerification | null,
  zoom_resultats: ZoomResult[]
): string {
  const lignes: string[] = [];
  
  lignes.push('═══════════════════════════════════════════════════════════════');
  lignes.push(`  RAPPORT D'AUDIT CEE - AGENT B (VALIDATEUR)`);
  lignes.push('═══════════════════════════════════════════════════════════════');
  lignes.push('');
  lignes.push(`📋 STATUT FINAL : ${statut}`);
  lignes.push('');
  
  // Section Puissance
  lignes.push('─── VÉRIFICATION PUISSANCE MOTEUR ───');
  lignes.push(`  • Agent A : ${verif_puissance.valeur_agent_a ?? 'N/A'} kW`);
  lignes.push(`  • Relecture : ${verif_puissance.valeur_relue ?? 'N/A'} kW (confiance: ${(verif_puissance.confiance_relecture * 100).toFixed(0)}%)`);
  lignes.push(`  • Concordance : ${verif_puissance.concordance ? '✅ OUI' : '❌ NON'}`);
  lignes.push('');
  
  // Section Calcul
  lignes.push('─── VÉRIFICATION CALCUL CEE (IND-UT-102) ───');
  lignes.push(`  • kWh cumac Agent A : ${verif_calcul.kwh_cumac_agent_a?.toLocaleString('fr-FR') ?? 'N/A'}`);
  lignes.push(`  • kWh cumac recalculé : ${verif_calcul.kwh_cumac_recalcule.toLocaleString('fr-FR')}`);
  lignes.push(`  • Concordance kWh : ${verif_calcul.concordance_kwh ? '✅ OUI' : '❌ NON'}`);
  lignes.push(`  • Prime Agent A : ${verif_calcul.prime_agent_a?.toLocaleString('fr-FR')} €`);
  lignes.push(`  • Prime recalculée : ${verif_calcul.prime_recalculee.toLocaleString('fr-FR')} €`);
  lignes.push(`  • Concordance prime : ${verif_calcul.concordance_prime ? '✅ OUI' : `❌ NON (écart: ${verif_calcul.ecart_prime_euros} €)`}`);
  lignes.push('');
  
  // Section SIRET
  if (verif_siret) {
    lignes.push('─── VÉRIFICATION SIRET ARTISAN ───');
    lignes.push(`  • SIRET : ${verif_siret.siret}`);
    lignes.push(`  • Format valide : ${verif_siret.valide_format ? '✅ OUI' : '❌ NON'}`);
    lignes.push(`  • Entreprise trouvée : ${verif_siret.entreprise_trouvee ? '✅ OUI' : '❌ NON'}`);
    if (verif_siret.raison_sociale) {
      lignes.push(`  • Raison sociale : ${verif_siret.raison_sociale}`);
    }
    lignes.push(`  • Qualification RGE : ${verif_siret.qualification_rge === true ? '✅ OUI' : verif_siret.qualification_rge === false ? '⚠️ NON' : '❓ INCONNUE'}`);
    lignes.push('');
  }
  
  // Section Zoom IA
  if (zoom_resultats.length > 0) {
    lignes.push('─── ZOOM IA (CHAMPS INCERTAINS) ───');
    for (const zoom of zoom_resultats) {
      const icon = zoom.resolution === 'RESOLU' ? '✅' : zoom.resolution === 'INCERTAIN' ? '⚠️' : '❌';
      lignes.push(`  ${icon} ${zoom.champ}`);
      lignes.push(`    • Ancienne valeur : ${zoom.ancienne_valeur}`);
      lignes.push(`    • Nouvelle valeur : ${zoom.nouvelle_valeur} (confiance: ${(zoom.nouvelle_confiance * 100).toFixed(0)}%)`);
      lignes.push(`    • Résolution : ${zoom.resolution}`);
    }
    lignes.push('');
  }
  
  // Section Discordances
  if (discordances.length > 0) {
    lignes.push('─── DISCORDANCES DÉTECTÉES ───');
    for (const d of discordances) {
      const icon = d.gravite === 'CRITIQUE' ? '🔴' : d.gravite === 'MAJEURE' ? '🟠' : '🟡';
      lignes.push(`  ${icon} [${d.gravite}] ${d.champ}`);
      lignes.push(`    • Agent A : ${d.valeur_agent_a}`);
      lignes.push(`    • Agent B : ${d.valeur_agent_b}`);
      if (d.ecart) lignes.push(`    • Écart : ${d.ecart}`);
      lignes.push(`    • Description : ${d.description}`);
    }
    lignes.push('');
  }
  
  lignes.push('═══════════════════════════════════════════════════════════════');
  lignes.push(`  Généré le ${new Date().toLocaleString('fr-FR')}`);
  lignes.push('═══════════════════════════════════════════════════════════════');
  
  return lignes.join('\n');
}

// ============================================================================
// FONCTION PRINCIPALE DE VALIDATION
// ============================================================================

/**
 * Valide et audite le résultat d'extraction de l'Agent A
 * 
 * @param file - Fichier original (image ou PDF)
 * @param extractionResult - Résultat JSON de l'Agent A (cee-extractor)
 * @returns Rapport de validation complet
 * 
 * @example
 * ```typescript
 * import { processQuote } from './cee-extractor';
 * import { validateExtraction } from './cee-validator';
 * 
 * const extractionResult = await processQuote(file);
 * const validationReport = await validateExtraction(file, extractionResult);
 * 
 * if (validationReport.statut === 'ALERTE_DISCORDANCE') {
 *   console.error('Discordances détectées:', validationReport.discordances);
 * }
 * ```
 */
export async function validateExtraction(
  file: File,
  extractionResult: ExtractionResult
): Promise<ValidationReport> {
  const startTime = Date.now();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Clé API Gemini non configurée');
  }
  
  const discordances: DiscordanceDetail[] = [];
  const zoomResultats: ZoomResult[] = [];
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1 : Zoom IA sur les champs A_VERIFIER_MANUELLEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  const champsAVerifier = extractionResult.champs_a_verifier || [];
  
  for (const champ of champsAVerifier) {
    let currentValue: unknown;
    let currentConfidence: number;
    
    switch (champ) {
      case 'puissance_nominale_kw':
        currentValue = extractionResult.puissance_nominale_kw.value;
        currentConfidence = extractionResult.puissance_nominale_kw.confidence;
        break;
      case 'siret_artisan':
        currentValue = extractionResult.siret_artisan.value;
        currentConfidence = extractionResult.siret_artisan.confidence;
        break;
      case 'coordonnees_client.nom':
        currentValue = extractionResult.coordonnees_client.nom.value;
        currentConfidence = extractionResult.coordonnees_client.nom.confidence;
        break;
      case 'coordonnees_client.adresse':
        currentValue = extractionResult.coordonnees_client.adresse.value;
        currentConfidence = extractionResult.coordonnees_client.adresse.confidence;
        break;
      default:
        continue;
    }
    
    const zoomResult = await zoomChamp(file, champ, currentValue, currentConfidence, apiKey);
    zoomResultats.push(zoomResult);
    
    // Mise à jour des valeurs si le zoom a réussi
    if (zoomResult.resolution === 'RESOLU' && zoomResult.nouvelle_confiance >= 0.8) {
      if (champ === 'puissance_nominale_kw') {
        extractionResult.puissance_nominale_kw.value = zoomResult.nouvelle_valeur as number;
        extractionResult.puissance_nominale_kw.confidence = zoomResult.nouvelle_confiance;
        extractionResult.puissance_nominale_kw.status = 'VALIDE';
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2 : Relecture ciblée de la puissance moteur
  // ─────────────────────────────────────────────────────────────────────────
  
  const relecture = await relirePuissance(file, apiKey);
  const puissanceAgentA = extractionResult.puissance_nominale_kw.value;
  const puissanceRelue = relecture.puissance;
  
  const concordancePuissance = puissanceAgentA === puissanceRelue || 
    (puissanceAgentA !== null && puissanceRelue !== null && 
     Math.abs(puissanceAgentA - puissanceRelue) < 0.1);
  
  if (!concordancePuissance && puissanceAgentA !== null && puissanceRelue !== null) {
    // Vérification confusion décimale (ex: 25 vs 2.5)
    const ratio = puissanceAgentA / puissanceRelue;
    const estConfusionDecimale = Math.abs(ratio - 10) < 0.1 || Math.abs(ratio - 0.1) < 0.01;
    
    discordances.push({
      champ: 'puissance_nominale_kw',
      valeur_agent_a: puissanceAgentA,
      valeur_agent_b: puissanceRelue,
      ecart: `${Math.abs(puissanceAgentA - puissanceRelue).toFixed(2)} kW`,
      gravite: 'CRITIQUE',
      description: estConfusionDecimale
        ? `ATTENTION : Probable confusion décimale détectée (${puissanceAgentA} kW vs ${puissanceRelue} kW)`
        : `Écart de puissance détecté entre les deux lectures`,
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 3 : Recalcul indépendant des kWh cumac et prime
  // ─────────────────────────────────────────────────────────────────────────
  
  const puissanceReference = puissanceRelue ?? puissanceAgentA ?? 0;
  const recalcul = recalculerCEE(puissanceReference);
  
  const kwhAgentA = extractionResult.calcul_cee?.kwh_cumac ?? null;
  const primeAgentA = extractionResult.calcul_cee?.prime_estimee_euros ?? null;
  
  const concordanceKwh = kwhAgentA === recalcul.kwh_cumac;
  const concordancePrime = primeAgentA !== null && 
    Math.abs(primeAgentA - recalcul.prime_euros) <= TOLERANCE_PRIME_EUROS;
  
  const ecartPrime = primeAgentA !== null ? 
    Math.round((primeAgentA - recalcul.prime_euros) * 100) / 100 : 0;
  
  if (!concordanceKwh && kwhAgentA !== null) {
    discordances.push({
      champ: 'kwh_cumac',
      valeur_agent_a: kwhAgentA,
      valeur_agent_b: recalcul.kwh_cumac,
      ecart: `${Math.abs(kwhAgentA - recalcul.kwh_cumac).toLocaleString('fr-FR')} kWh`,
      gravite: 'MAJEURE',
      description: 'Écart dans le calcul des kWh cumac',
    });
  }
  
  if (!concordancePrime && primeAgentA !== null) {
    discordances.push({
      champ: 'prime_cee',
      valeur_agent_a: primeAgentA,
      valeur_agent_b: recalcul.prime_euros,
      ecart: `${ecartPrime} €`,
      gravite: Math.abs(ecartPrime) > 100 ? 'CRITIQUE' : 'MAJEURE',
      description: `Écart de ${Math.abs(ecartPrime)} € sur la prime CEE`,
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 4 : Vérification SIRET via annuaire
  // ─────────────────────────────────────────────────────────────────────────
  
  let verificationSiret: SIRETVerification | null = null;
  
  if (extractionResult.siret_artisan.value) {
    verificationSiret = await verifierSIRETAnnuaire(extractionResult.siret_artisan.value);
    
    if (!verificationSiret.valide_format) {
      discordances.push({
        champ: 'siret_artisan',
        valeur_agent_a: extractionResult.siret_artisan.value,
        valeur_agent_b: 'FORMAT_INVALIDE',
        gravite: 'CRITIQUE',
        description: 'Le SIRET ne respecte pas le format à 14 chiffres ou échoue à la validation Luhn',
      });
    } else if (!verificationSiret.entreprise_trouvee) {
      discordances.push({
        champ: 'siret_artisan',
        valeur_agent_a: extractionResult.siret_artisan.value,
        valeur_agent_b: 'ENTREPRISE_INCONNUE',
        gravite: 'MAJEURE',
        description: 'SIRET non trouvé dans l\'annuaire - vérification manuelle requise',
      });
    } else if (verificationSiret.qualification_rge === false) {
      discordances.push({
        champ: 'qualification_rge',
        valeur_agent_a: 'ATTENDU',
        valeur_agent_b: 'NON_QUALIFIE',
        gravite: 'CRITIQUE',
        description: 'L\'entreprise n\'a pas la qualification RGE requise pour les CEE',
      });
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 5 : Détermination du statut final
  // ─────────────────────────────────────────────────────────────────────────
  
  let statut: ValidationStatus;
  
  const hasCritique = discordances.some(d => d.gravite === 'CRITIQUE');
  const hasMajeure = discordances.some(d => d.gravite === 'MAJEURE');
  const hasUnresolvedZoom = zoomResultats.some(z => z.resolution !== 'RESOLU');
  
  if (discordances.length === 0 && !hasUnresolvedZoom) {
    statut = 'VALIDE';
  } else if (hasCritique || hasMajeure) {
    statut = 'ALERTE_DISCORDANCE';
  } else {
    statut = 'VERIFICATION_MANUELLE_REQUISE';
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCTION DU RAPPORT
  // ─────────────────────────────────────────────────────────────────────────
  
  const verification_puissance = {
    valeur_agent_a: puissanceAgentA,
    valeur_relue: puissanceRelue,
    concordance: concordancePuissance,
    confiance_relecture: relecture.confidence,
  };
  
  const verification_calcul = {
    kwh_cumac_agent_a: kwhAgentA,
    kwh_cumac_recalcule: recalcul.kwh_cumac,
    prime_agent_a: primeAgentA,
    prime_recalculee: recalcul.prime_euros,
    concordance_kwh: concordanceKwh,
    concordance_prime: concordancePrime,
    ecart_prime_euros: ecartPrime,
  };
  
  const rapport_audit = genererRapportAudit(
    statut,
    discordances,
    verification_puissance,
    verification_calcul,
    verificationSiret,
    zoomResultats
  );
  
  return {
    statut,
    verification_puissance,
    verification_calcul,
    verification_siret: verificationSiret,
    zoom_ia_resultats: zoomResultats,
    discordances,
    rapport_audit,
    timestamp: new Date().toISOString(),
    duree_validation_ms: Date.now() - startTime,
  };
}

// ============================================================================
// FONCTION COMBINÉE (EXTRACTION + VALIDATION)
// ============================================================================

/**
 * Pipeline complet : Extraction (Agent A) + Validation (Agent B)
 */
export async function processAndValidateQuote(file: File): Promise<{
  extraction: ExtractionResult;
  validation: ValidationReport;
}> {
  // Import dynamique pour éviter les dépendances circulaires
  const { processQuote } = await import('./cee-extractor');
  
  const extraction = await processQuote(file);
  const validation = await validateExtraction(file, extraction);
  
  return { extraction, validation };
}
