/**
 * Pain Signals Engine - Moteur de Scoring Prédictif
 * Détecte la détresse administrative des prospects via analyse NLP des avis
 * 
 * @module pain-signals
 * @version 1.0.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type UrgencyLevel = 'URGENCE_HAUTE' | 'URGENCE_MOYENNE' | 'NORMAL' | 'UNKNOWN';

export interface PainSignal {
  keyword: string;
  category: 'reactivite' | 'delais' | 'qualite' | 'prix';
  weight: number;
  matchedText: string;
  reviewDate?: Date;
}

export interface ProspectInsight {
  prospectId: string;
  painScore: number;
  urgencyLevel: UrgencyLevel;
  signals: PainSignal[];
  summary: string;
  lastAnalyzedAt: Date;
  reviewCount: number;
  topIssues: string[];
}

export interface ReviewData {
  text: string;
  rating: number;
  date: Date;
  authorName?: string;
}

// ============================================================================
// CLUSTERS DE MOTS-CLÉS (NLP PATTERNS)
// ============================================================================

const PAIN_KEYWORDS = {
  reactivite: {
    patterns: [
      { regex: /ne?\s*(répond|répondent)\s*(pas|jamais|plus)/gi, weight: 15 },
      { regex: /sans\s*réponse/gi, weight: 12 },
      { regex: /pas\s*de\s*(rappel|réponse|nouvelles)/gi, weight: 14 },
      { regex: /impossible\s*(de\s*)?(joindre|contacter)/gi, weight: 16 },
      { regex: /aucun\s*retour/gi, weight: 13 },
      { regex: /relance[rs]?\s*(plusieurs|multiple)/gi, weight: 11 },
      { regex: /appel[és]?\s*(sans\s*)?suite/gi, weight: 10 },
      { regex: /injoignable/gi, weight: 15 },
      { regex: /ghost[ée]?/gi, weight: 14 },
      { regex: /laissé\s*(en\s*)?plan/gi, weight: 12 },
    ],
    label: 'Problème de réactivité',
  },
  delais: {
    patterns: [
      { regex: /attente?\s*(du\s*)?(devis|chiffrage)/gi, weight: 14 },
      { regex: /(plusieurs|des)\s*semaines/gi, weight: 12 },
      { regex: /délai[s]?\s*(trop\s*)?(long|interminable)/gi, weight: 15 },
      { regex: /mois\s*(d['']attente|sans)/gi, weight: 16 },
      { regex: /toujours\s*(pas\s*de\s*)?devis/gi, weight: 13 },
      { regex: /retard\s*(important|énorme|conséquent)/gi, weight: 14 },
      { regex: /repouss[ée]\s*(plusieurs|sans\s*cesse)/gi, weight: 11 },
      { regex: /chantier\s*(jamais\s*)?(commencé|démarré)/gi, weight: 15 },
      { regex: /travaux\s*(en\s*)?suspens/gi, weight: 12 },
      { regex: /planning\s*(non\s*)?respect[ée]/gi, weight: 10 },
    ],
    label: 'Problème de délais',
  },
  qualite: {
    patterns: [
      { regex: /travail\s*(bâclé|mal\s*fait)/gi, weight: 10 },
      { regex: /malfaçon[s]?/gi, weight: 12 },
      { regex: /doit\s*repasser/gi, weight: 8 },
      { regex: /pas\s*(du\s*)?professionnel/gi, weight: 9 },
      { regex: /déçu[e]?\s*(du\s*)?résultat/gi, weight: 7 },
    ],
    label: 'Problème de qualité',
  },
  prix: {
    patterns: [
      { regex: /devis\s*(très\s*)?(cher|élevé|excessif)/gi, weight: 6 },
      { regex: /surfactur[ée]/gi, weight: 8 },
      { regex: /prix\s*(abusif|exorbitant)/gi, weight: 7 },
    ],
    label: 'Problème de prix',
  },
};

// ============================================================================
// ALGORITHME DE SCORING
// ============================================================================

/**
 * Analyse un texte et extrait les signaux de détresse
 */
function extractSignalsFromText(text: string, reviewDate?: Date): PainSignal[] {
  const signals: PainSignal[] = [];
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const [category, config] of Object.entries(PAIN_KEYWORDS)) {
    for (const pattern of config.patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          signals.push({
            keyword: match,
            category: category as PainSignal['category'],
            weight: pattern.weight,
            matchedText: extractContext(text, match),
            reviewDate,
          });
        }
      }
    }
  }

  return signals;
}

/**
 * Extrait le contexte autour d'un mot-clé (±30 caractères)
 */
function extractContext(text: string, keyword: string): string {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return keyword;
  
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + keyword.length + 30);
  let context = text.slice(start, end);
  
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

/**
 * Calcule le facteur de récence (avis récents = plus de poids)
 */
function calculateRecencyFactor(reviewDate: Date | undefined): number {
  if (!reviewDate) return 0.5;
  
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 30) return 1.0;      // Dernier mois = poids max
  if (daysDiff <= 90) return 0.8;      // 3 mois
  if (daysDiff <= 180) return 0.6;     // 6 mois
  if (daysDiff <= 365) return 0.4;     // 1 an
  return 0.2;                           // Plus ancien
}

/**
 * Calcule le Pain Score global (0-100)
 */
export function calculatePainScore(reviews: ReviewData[]): ProspectInsight {
  const allSignals: PainSignal[] = [];
  
  for (const review of reviews) {
    const signals = extractSignalsFromText(review.text, review.date);
    
    // Appliquer facteur de récence
    const recencyFactor = calculateRecencyFactor(review.date);
    for (const signal of signals) {
      signal.weight = signal.weight * recencyFactor;
    }
    
    // Bonus pour avis négatifs (rating < 3)
    if (review.rating < 3) {
      for (const signal of signals) {
        signal.weight = signal.weight * 1.3;
      }
    }
    
    allSignals.push(...signals);
  }
  
  // Calcul du score brut
  const rawScore = allSignals.reduce((sum, s) => sum + s.weight, 0);
  
  // Normalisation sur 100 (max théorique ~200 pour 10 avis très négatifs)
  const normalizedScore = Math.min(100, Math.round((rawScore / 150) * 100));
  
  // Détermination du niveau d'urgence
  let urgencyLevel: UrgencyLevel = 'NORMAL';
  if (normalizedScore > 70) urgencyLevel = 'URGENCE_HAUTE';
  else if (normalizedScore > 40) urgencyLevel = 'URGENCE_MOYENNE';
  else if (normalizedScore === 0 && reviews.length === 0) urgencyLevel = 'UNKNOWN';
  
  // Génération du résumé
  const summary = generateSummary(allSignals);
  
  // Top issues
  const topIssues = getTopIssues(allSignals);
  
  return {
    prospectId: '',
    painScore: normalizedScore,
    urgencyLevel,
    signals: allSignals,
    summary,
    lastAnalyzedAt: new Date(),
    reviewCount: reviews.length,
    topIssues,
  };
}

/**
 * Génère un résumé lisible des problèmes détectés
 */
function generateSummary(signals: PainSignal[]): string {
  if (signals.length === 0) return 'Aucun signal de détresse détecté';
  
  const categoryCounts: Record<string, number> = {};
  for (const signal of signals) {
    categoryCounts[signal.category] = (categoryCounts[signal.category] || 0) + 1;
  }
  
  const parts: string[] = [];
  
  if (categoryCounts.reactivite) {
    parts.push(`Réactivité mentionnée ${categoryCounts.reactivite} fois`);
  }
  if (categoryCounts.delais) {
    parts.push(`Délais mentionnés ${categoryCounts.delais} fois`);
  }
  if (categoryCounts.qualite) {
    parts.push(`Qualité critiquée ${categoryCounts.qualite} fois`);
  }
  if (categoryCounts.prix) {
    parts.push(`Prix critiqué ${categoryCounts.prix} fois`);
  }
  
  return parts.join(' • ') || 'Analyse en cours';
}

/**
 * Retourne les top 3 problèmes par catégorie
 */
function getTopIssues(signals: PainSignal[]): string[] {
  const categoryScores: Record<string, number> = {};
  
  for (const signal of signals) {
    categoryScores[signal.category] = (categoryScores[signal.category] || 0) + signal.weight;
  }
  
  return Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => PAIN_KEYWORDS[category as keyof typeof PAIN_KEYWORDS]?.label || category);
}

// ============================================================================
// API PUBLIQUE - SERVICE D'ANALYSE
// ============================================================================

/**
 * Analyse un prospect et retourne son insight
 * Fallback silencieux si erreur
 */
export async function analyzeProspect(
  prospectId: string,
  reviews: ReviewData[]
): Promise<ProspectInsight | null> {
  try {
    const insight = calculatePainScore(reviews);
    insight.prospectId = prospectId;
    return insight;
  } catch (error) {
    console.error(`[PainSignals] Erreur analyse prospect ${prospectId}:`, error);
    return null;
  }
}

/**
 * Analyse batch de prospects (pour background worker)
 */
export async function analyzeProspectsBatch(
  prospects: Array<{ id: string; reviews: ReviewData[] }>
): Promise<Map<string, ProspectInsight>> {
  const results = new Map<string, ProspectInsight>();
  
  for (const prospect of prospects) {
    const insight = await analyzeProspect(prospect.id, prospect.reviews);
    if (insight) {
      results.set(prospect.id, insight);
    }
  }
  
  return results;
}

// ============================================================================
// UTILITAIRES EXPORT
// ============================================================================

export const PainSignalsEngine = {
  analyzeProspect,
  analyzeProspectsBatch,
  calculatePainScore,
  extractSignalsFromText,
};

export default PainSignalsEngine;
