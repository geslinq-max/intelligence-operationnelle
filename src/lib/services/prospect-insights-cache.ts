/**
 * ProspectInsights Cache Service
 * Gère le cache local des analyses Pain Signals pour éviter de ralentir l'interface
 * 
 * @module prospect-insights-cache
 */

import { ProspectInsight, ReviewData, PainSignalsEngine } from '@/lib/ai/pain-signals';

// ============================================================================
// CACHE EN MÉMOIRE (Production: utiliser Redis/Supabase)
// ============================================================================

const insightsCache = new Map<string, ProspectInsight>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 heures

interface CacheEntry {
  insight: ProspectInsight;
  cachedAt: number;
}

const cacheStore = new Map<string, CacheEntry>();

// ============================================================================
// DONNÉES SPECIMEN (Mock Google Places Reviews)
// ============================================================================

const MOCK_REVIEWS_DATABASE: Record<string, ReviewData[]> = {
  '1': [
    {
      text: "Très bon artisan, travail soigné et dans les délais. Je recommande !",
      rating: 5,
      date: new Date('2026-01-10'),
    },
    {
      text: "Professionnel et réactif. Devis reçu en 24h.",
      rating: 5,
      date: new Date('2026-01-05'),
    },
  ],
  '2': [
    {
      text: "Impossible de joindre cette entreprise. J'ai laissé 3 messages sans réponse. Très déçu.",
      rating: 1,
      date: new Date('2026-01-12'),
    },
    {
      text: "Attente du devis depuis plusieurs semaines. Aucun retour malgré mes relances.",
      rating: 2,
      date: new Date('2026-01-08'),
    },
    {
      text: "Ne répond jamais au téléphone. J'ai dû trouver quelqu'un d'autre.",
      rating: 1,
      date: new Date('2025-12-20'),
    },
  ],
  '3': [
    {
      text: "Délai de devis trop long, plusieurs semaines d'attente. Travail correct une fois commencé.",
      rating: 3,
      date: new Date('2026-01-14'),
    },
    {
      text: "Chantier repoussé plusieurs fois sans explication. Frustrant.",
      rating: 2,
      date: new Date('2025-12-15'),
    },
  ],
};

// ============================================================================
// SERVICE D'ACQUISITION (Simulé - Production: Google Places API)
// ============================================================================

/**
 * Récupère les avis Google Places pour un prospect
 * En production: appeler l'API Google Places
 * Fallback silencieux si erreur
 */
export async function fetchProspectReviews(prospectId: string): Promise<ReviewData[]> {
  try {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // En production, remplacer par:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${API_KEY}`);
    
    return MOCK_REVIEWS_DATABASE[prospectId] || [];
  } catch (error) {
    console.error(`[ProspectInsights] Erreur fetch reviews ${prospectId}:`, error);
    return [];
  }
}

// ============================================================================
// API CACHE
// ============================================================================

/**
 * Récupère l'insight depuis le cache ou l'analyse
 */
export async function getProspectInsight(prospectId: string): Promise<ProspectInsight | null> {
  try {
    // Vérifier le cache
    const cached = cacheStore.get(prospectId);
    if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
      return cached.insight;
    }
    
    // Récupérer les reviews et analyser
    const reviews = await fetchProspectReviews(prospectId);
    if (reviews.length === 0) {
      return null; // Fallback silencieux
    }
    
    const insight = await PainSignalsEngine.analyzeProspect(prospectId, reviews);
    
    if (insight) {
      // Mettre en cache
      cacheStore.set(prospectId, {
        insight,
        cachedAt: Date.now(),
      });
    }
    
    return insight;
  } catch (error) {
    console.error(`[ProspectInsights] Erreur getInsight ${prospectId}:`, error);
    return null; // Fallback silencieux
  }
}

/**
 * Récupère les insights pour plusieurs prospects
 */
export async function getProspectsInsights(
  prospectIds: string[]
): Promise<Map<string, ProspectInsight>> {
  const results = new Map<string, ProspectInsight>();
  
  await Promise.all(
    prospectIds.map(async (id) => {
      const insight = await getProspectInsight(id);
      if (insight) {
        results.set(id, insight);
      }
    })
  );
  
  return results;
}

/**
 * Force le rafraîchissement d'un insight
 */
export async function refreshProspectInsight(prospectId: string): Promise<ProspectInsight | null> {
  cacheStore.delete(prospectId);
  return getProspectInsight(prospectId);
}

/**
 * Vide le cache (pour tests/debug)
 */
export function clearInsightsCache(): void {
  cacheStore.clear();
}

// ============================================================================
// BACKGROUND WORKER (Simulation)
// ============================================================================

/**
 * Worker asynchrone pour pré-charger les insights
 * En production: utiliser un cron job ou queue
 */
export async function runBackgroundAnalysis(prospectIds: string[]): Promise<void> {
  console.log(`[ProspectInsights] Background analysis started for ${prospectIds.length} prospects`);
  
  for (const id of prospectIds) {
    await getProspectInsight(id);
    // Petit délai pour ne pas surcharger
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`[ProspectInsights] Background analysis completed`);
}

// ============================================================================
// EXPORT
// ============================================================================

export const ProspectInsightsService = {
  getProspectInsight,
  getProspectsInsights,
  refreshProspectInsight,
  clearInsightsCache,
  runBackgroundAnalysis,
  fetchProspectReviews,
};

export default ProspectInsightsService;
