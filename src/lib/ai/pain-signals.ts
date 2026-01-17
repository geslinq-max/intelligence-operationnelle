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
  category: 'reactivite' | 'delais' | 'qualite' | 'prix' | 'conformite';
  weight: number;
  matchedText: string;
  reviewDate?: Date;
  reviewRating?: number;
  authorName?: string;
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
  // Nouveaux champs pour les scripts de vente
  realQuotes: RealQuote[];
  scriptHooks: ScriptHook[];
}

export interface RealQuote {
  text: string;
  category: string;
  authorName?: string;
  rating: number;
  date: Date;
}

export interface ScriptHook {
  category: string;
  hook: string;
  frequency: number;
  suggestedOpener: string;
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
      // Communication de base
      { regex: /ne?\s*(répond|répondent)\s*(pas|jamais|plus)/gi, weight: 15 },
      { regex: /sans\s*réponse/gi, weight: 12 },
      { regex: /pas\s*de\s*(rappel|réponse|nouvelles|retour)/gi, weight: 14 },
      { regex: /impossible\s*(de\s*)?(joindre|contacter|avoir)/gi, weight: 16 },
      { regex: /aucun\s*(retour|rappel|signe)/gi, weight: 13 },
      { regex: /relance[rs]?\s*(plusieurs|multiple|[0-9]+\s*fois)/gi, weight: 14 },
      { regex: /appel[és]?\s*(sans\s*)?suite/gi, weight: 10 },
      { regex: /injoignable[s]?/gi, weight: 15 },
      { regex: /ghost[ée]?[s]?/gi, weight: 14 },
      { regex: /laissé[es]?\s*(en\s*)?plan/gi, weight: 12 },
      // Messages et emails
      { regex: /message[s]?\s*(rest[ée]s?\s*)?(sans\s*réponse|ignor[ée]s?)/gi, weight: 13 },
      { regex: /mail[s]?\s*(rest[ée]s?\s*)?(sans\s*réponse|ignor[ée]s?)/gi, weight: 13 },
      { regex: /ne\s*(décroche|rappelle)\s*(jamais|pas)/gi, weight: 14 },
    ],
    label: 'Problème de réactivité',
    scriptHook: 'la gestion de vos communications clients',
  },
  delais: {
    patterns: [
      // Devis spécifiquement
      { regex: /attente?\s*(du\s*)?(devis|chiffrage)/gi, weight: 14 },
      { regex: /toujours\s*(pas\s*de\s*)?(devis|chiffrage)/gi, weight: 15 },
      { regex: /devis\s*(jamais\s*)?(reçu|arrivé|envoyé)/gi, weight: 16 },
      { regex: /devis\s*apr[eè]s\s*([0-9]+|plusieurs)\s*(jours?|semaines?|mois)/gi, weight: 17 },
      { regex: /attendu\s*([0-9]+|plusieurs)\s*(jours?|semaines?|mois)/gi, weight: 18 },
      { regex: /dû\s*relancer\s*(pour|le)\s*(un\s*)?devis/gi, weight: 15 },
      // Délais généraux
      { regex: /(plusieurs|des|[0-9]+)\s*semaines\s*(d['']attente)?/gi, weight: 12 },
      { regex: /(plusieurs|des|[0-9]+)\s*mois\s*(d['']attente)?/gi, weight: 16 },
      { regex: /délai[s]?\s*(trop\s*)?(long[s]?|interminable[s]?)/gi, weight: 15 },
      { regex: /retard\s*(important|énorme|conséquent)/gi, weight: 14 },
      { regex: /repouss[ée][s]?\s*(plusieurs|sans\s*cesse)/gi, weight: 13 },
      // Chantiers
      { regex: /chantier\s*(jamais\s*)?(commencé|démarré|terminé)/gi, weight: 15 },
      { regex: /travaux\s*(en\s*)?(suspens|attente|retard)/gi, weight: 12 },
      { regex: /planning\s*(non\s*)?respect[ée]/gi, weight: 10 },
    ],
    label: 'Problème de délais',
    scriptHook: 'la rapidité de vos réponses aux demandes',
  },
  qualite: {
    patterns: [
      { regex: /travail\s*(bâclé|mal\s*fait|approximatif)/gi, weight: 10 },
      { regex: /malfaçon[s]?/gi, weight: 12 },
      { regex: /doit\s*repasser/gi, weight: 8 },
      { regex: /pas\s*(du\s*)?professionnel/gi, weight: 9 },
      { regex: /déçu[e]?[s]?\s*(du\s*)?résultat/gi, weight: 7 },
      { regex: /finition[s]?\s*(bâcl[ée]e?s?|mauvaise[s]?)/gi, weight: 9 },
    ],
    label: 'Problème de qualité',
    scriptHook: 'la qualité et le suivi de vos prestations',
  },
  prix: {
    patterns: [
      { regex: /devis\s*(très\s*)?(cher|élevé|excessif)/gi, weight: 6 },
      { regex: /surfactur[ée]/gi, weight: 8 },
      { regex: /prix\s*(abusif|exorbitant|gonfl[ée])/gi, weight: 7 },
      { regex: /facture\s*(surprise|élev[ée]e?|gonfl[ée]e?)/gi, weight: 8 },
    ],
    label: 'Problème de prix',
    scriptHook: 'la transparence de vos devis',
  },
  conformite: {
    patterns: [
      { regex: /non\s*conforme/gi, weight: 14 },
      { regex: /attestation\s*(manquante|jamais\s*reçue)/gi, weight: 15 },
      { regex: /document[s]?\s*(manquant[s]?|incomplet[s]?)/gi, weight: 12 },
      { regex: /dossier\s*(incomplet|rejet[ée]|refus[ée])/gi, weight: 16 },
      { regex: /prime[s]?\s*(perdue[s]?|refus[ée]e?s?)/gi, weight: 17 },
      { regex: /CEE\s*(refus[ée]|rejet[ée]|perdu)/gi, weight: 18 },
      { regex: /paperasse/gi, weight: 8 },
      { regex: /administratif\s*(lourd|complexe|galère)/gi, weight: 10 },
    ],
    label: 'Problème de conformité',
    scriptHook: 'la gestion de vos dossiers administratifs',
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
  
  // Extraire les citations réelles pour les scripts de vente
  const realQuotes = extractRealQuotes(reviews, allSignals);
  
  // Générer les hooks pour les scripts de vente
  const scriptHooks = generateScriptHooks(allSignals);
  
  return {
    prospectId: '',
    painScore: normalizedScore,
    urgencyLevel,
    signals: allSignals,
    summary,
    lastAnalyzedAt: new Date(),
    reviewCount: reviews.length,
    topIssues,
    realQuotes,
    scriptHooks,
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
  if (categoryCounts.conformite) {
    parts.push(`Conformité mentionnée ${categoryCounts.conformite} fois`);
  }
  
  return parts.join(' • ') || 'Analyse en cours';
}

/**
 * Extrait les citations réelles des avis pour personnaliser les scripts
 */
function extractRealQuotes(reviews: ReviewData[], signals: PainSignal[]): RealQuote[] {
  const quotes: RealQuote[] = [];
  
  for (const review of reviews) {
    // Ne garder que les avis négatifs (< 3 étoiles) avec des signaux détectés
    if (review.rating >= 3) continue;
    
    const reviewSignals = signals.filter(s => 
      s.reviewDate?.getTime() === review.date.getTime()
    );
    
    if (reviewSignals.length === 0) continue;
    
    // Extraire la phrase la plus pertinente (contenant le mot-clé)
    const sentences = review.text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const signal of reviewSignals) {
      const relevantSentence = sentences.find(s => 
        s.toLowerCase().includes(signal.keyword.toLowerCase())
      );
      
      if (relevantSentence && quotes.length < 5) {
        quotes.push({
          text: relevantSentence.trim(),
          category: signal.category,
          authorName: review.authorName,
          rating: review.rating,
          date: review.date,
        });
      }
    }
  }
  
  // Trier par récence et limiter à 3
  return quotes
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);
}

/**
 * Génère des accroches de script basées sur les problèmes détectés
 */
function generateScriptHooks(signals: PainSignal[]): ScriptHook[] {
  const categoryCounts: Record<string, number> = {};
  
  for (const signal of signals) {
    categoryCounts[signal.category] = (categoryCounts[signal.category] || 0) + 1;
  }
  
  const hooks: ScriptHook[] = [];
  
  // Générer un hook pour chaque catégorie détectée
  for (const [category, count] of Object.entries(categoryCounts)) {
    const config = PAIN_KEYWORDS[category as keyof typeof PAIN_KEYWORDS];
    if (!config) continue;
    
    let suggestedOpener = '';
    
    switch (category) {
      case 'reactivite':
        suggestedOpener = count > 2 
          ? `J'ai remarqué que plusieurs clients mentionnent des difficultés à vous joindre. Ma solution automatise les réponses et relances pour vous.`
          : `J'ai vu qu'un client a eu du mal à avoir un retour. Notre système de notifications automatiques règle ce problème.`;
        break;
      case 'delais':
        suggestedOpener = count > 2
          ? `J'ai noté que ${count} avis évoquent des délais de devis. Avec notre outil, vos devis partent en 2 clics depuis le terrain.`
          : `J'ai remarqué qu'un client a attendu son devis. Notre générateur de devis automatique vous fait gagner des heures.`;
        break;
      case 'qualite':
        suggestedOpener = `J'ai vu des retours sur la qualité de finition. Notre checklist digitale garantit que rien n'est oublié avant de quitter le chantier.`;
        break;
      case 'prix':
        suggestedOpener = `J'ai remarqué des commentaires sur vos tarifs. Notre système de devis détaillé justifie chaque ligne et rassure vos clients.`;
        break;
      case 'conformite':
        suggestedOpener = count > 1
          ? `J'ai vu que ${count} avis mentionnent des problèmes de conformité ou de dossiers. Notre plateforme vérifie automatiquement chaque dossier avant envoi.`
          : `J'ai remarqué un souci de conformité mentionné. Notre système détecte les erreurs avant qu'elles ne coûtent une prime.`;
        break;
    }
    
    hooks.push({
      category,
      hook: config.scriptHook,
      frequency: count,
      suggestedOpener,
    });
  }
  
  // Trier par fréquence décroissante
  return hooks.sort((a, b) => b.frequency - a.frequency);
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
