/**
 * API Radar de Prospection
 * Recherche d'artisans via Google Places Text Search + analyse Pain Signals
 * 
 * @module api/radar
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PainSignalsEngine, ReviewData } from '@/lib/ai/pain-signals';

// ============================================================================
// TYPES
// ============================================================================

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

interface RealQuote {
  text: string;
  category: string;
  authorName?: string;
  rating: number;
  date: Date;
}

interface ScriptHook {
  category: string;
  hook: string;
  frequency: number;
  suggestedOpener: string;
}

interface RadarProspect {
  place_id: string;
  raison_sociale: string;
  adresse: string;
  ville: string;
  telephone: string | null;
  site_web: string | null;
  note_google: number | null;
  nombre_avis: number;
  pain_score: number;
  urgency_level: string;
  pain_summary: string;
  top_issues: string[];
  is_new: boolean;
  // Nouvelles données pour scripts personnalisés
  real_quotes?: RealQuote[];
  script_hooks?: ScriptHook[];
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================================
// GOOGLE PLACES API HELPERS
// ============================================================================

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

// Déterminer le mode de fonctionnement
const isRealMode = GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.trim().length > 0 && !GOOGLE_PLACES_API_KEY.startsWith('your_');

// FieldMask requis pour la nouvelle API Places (New)
const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.reviews',
  'places.location',
  'places.types',
].join(',');

/**
 * Recherche via la NOUVELLE API Google Places (New) - Méthode principale
 * Requiert les en-têtes X-Goog-FieldMask et X-Goog-Api-Key
 */
async function searchGooglePlacesNew(query: string): Promise<GooglePlaceResult[]> {
  console.log('[Radar] Tentative API Places (New) pour:', query);
  
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'fr',
        maxResultCount: 10,
      }),
    });

    const rawData = await response.json();
    
    // LOG DIAGNOSTIC - Réponse brute de Google
    console.log('[Radar] === RÉPONSE BRUTE GOOGLE PLACES (NEW) ===');
    console.log('[Radar] Status HTTP:', response.status);
    console.log('[Radar] Raw response:', JSON.stringify(rawData, null, 2));
    console.log('[Radar] ==========================================');

    // Vérifier les erreurs d'autorisation
    if (rawData.error) {
      console.error('[Radar] ERREUR API:', rawData.error.message || rawData.error.status);
      console.error('[Radar] Code erreur:', rawData.error.code);
      console.error('[Radar] Détails:', JSON.stringify(rawData.error.details || []));
      return [];
    }

    if (!rawData.places || rawData.places.length === 0) {
      console.log('[Radar] Aucun résultat retourné par l\'API Places (New)');
      return [];
    }

    // Convertir le format Places (New) vers le format legacy
    return rawData.places.map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || 'Nom inconnu',
      formatted_address: place.formattedAddress || '',
      formatted_phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber || undefined,
      website: place.websiteUri || undefined,
      rating: place.rating || undefined,
      user_ratings_total: place.userRatingCount || 0,
      reviews: (place.reviews || []).map((r: any) => ({
        author_name: r.authorAttribution?.displayName || 'Anonyme',
        rating: r.rating || 3,
        text: r.text?.text || '',
        time: r.publishTime ? new Date(r.publishTime).getTime() / 1000 : Date.now() / 1000,
        relative_time_description: r.relativePublishTimeDescription || '',
      })),
      geometry: place.location ? {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        }
      } : undefined,
      types: place.types || [],
    }));
  } catch (error) {
    console.error('[Radar] Exception API Places (New):', error);
    return [];
  }
}

/**
 * Recherche via l'ancienne API Google Places (Legacy) - Fallback
 */
async function searchGooglePlacesLegacy(query: string): Promise<GooglePlaceResult[]> {
  console.log('[Radar] Fallback vers API Places Legacy pour:', query);
  
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&key=${GOOGLE_PLACES_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // LOG DIAGNOSTIC
    console.log('[Radar] === RÉPONSE BRUTE GOOGLE PLACES (LEGACY) ===');
    console.log('[Radar] Status:', searchData.status);
    console.log('[Radar] Nombre de résultats:', searchData.results?.length || 0);
    if (searchData.error_message) {
      console.error('[Radar] Error message:', searchData.error_message);
    }
    console.log('[Radar] =============================================');

    if (searchData.status !== 'OK' || !searchData.results) {
      console.error('[Radar] Erreur Google Places Legacy:', searchData.status, searchData.error_message);
      return [];
    }

    // Récupérer les détails de chaque établissement
    const detailedResults: GooglePlaceResult[] = [];

    for (const place of searchData.results.slice(0, 10)) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,geometry,types&language=fr&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK' && detailsData.result) {
          detailedResults.push(detailsData.result);
        }
      } catch (error) {
        console.error(`[Radar] Erreur détails place ${place.place_id}:`, error);
      }
    }

    return detailedResults;
  } catch (error) {
    console.error('[Radar] Erreur recherche Google Places Legacy:', error);
    return [];
  }
}

/**
 * Scinde une requête multi-termes et effectue des recherches séparées
 * Ex: "Électricien Plombier Romilly" -> ["Électricien Romilly", "Plombier Romilly"]
 */
function splitSearchTerms(metier: string, localisation: string): string[] {
  // Liste des métiers connus pour scinder intelligemment
  const knownMetiers = [
    'électricien', 'electricien', 'plombier', 'chauffagiste', 'couvreur',
    'menuisier', 'maçon', 'macon', 'peintre', 'carreleur', 'plaquiste',
    'climaticien', 'frigoriste', 'serrurier', 'vitrier', 'charpentier',
    'isolation', 'isolateur', 'pompe à chaleur', 'pac', 'rge',
  ];
  
  const metierLower = metier.toLowerCase();
  const foundMetiers: string[] = [];
  
  for (const m of knownMetiers) {
    if (metierLower.includes(m)) {
      foundMetiers.push(m.charAt(0).toUpperCase() + m.slice(1));
    }
  }
  
  // Si plusieurs métiers détectés, créer des requêtes séparées
  if (foundMetiers.length > 1) {
    console.log(`[Radar] Détection multi-métiers: ${foundMetiers.join(', ')}`);
    return foundMetiers.map(m => `${m} ${localisation}`);
  }
  
  // Sinon, requête unique
  return [`${metier} ${localisation}`];
}

/**
 * Recherche des établissements via Google Places (avec fallback et split)
 */
async function searchGooglePlaces(query: string, metier?: string, localisation?: string): Promise<GooglePlaceResult[]> {
  if (!isRealMode) {
    console.log('[Radar] Mode SIMULATION - Aucune clé Google Places configurée');
    return generateMockResults(query);
  }
  
  console.log('[Radar] Mode PRODUCTION - Utilisation de Google Places API');

  // Déterminer les requêtes à effectuer
  const queries = metier && localisation 
    ? splitSearchTerms(metier, localisation)
    : [query];
  
  const allResults: GooglePlaceResult[] = [];
  const seenPlaceIds = new Set<string>();

  for (const q of queries) {
    console.log(`[Radar] Recherche: "${q}"`);
    
    // Essayer d'abord la nouvelle API
    let results = await searchGooglePlacesNew(q);
    
    // Fallback vers l'ancienne API si aucun résultat
    if (results.length === 0) {
      console.log('[Radar] Nouvelle API sans résultat, tentative API Legacy...');
      results = await searchGooglePlacesLegacy(q);
    }
    
    // Dédupliquer par place_id
    for (const place of results) {
      if (!seenPlaceIds.has(place.place_id)) {
        seenPlaceIds.add(place.place_id);
        allResults.push(place);
      }
    }
  }

  console.log(`[Radar] Total après déduplication: ${allResults.length} établissements`);
  return allResults;
}

/**
 * Génère des résultats de simulation (mode sans API Key)
 */
function generateMockResults(query: string): GooglePlaceResult[] {
  const [metier, localisation] = query.split(' ');
  const mockNames = [
    `${metier} Pro Services`,
    `Établissement ${metier} Express`,
    `${metier} & Fils`,
    `Artisan ${metier} Local`,
    `${metier} Solutions`,
  ];

  return mockNames.map((name, index) => ({
    place_id: `mock_place_${Date.now()}_${index}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    formatted_address: `${12 + index * 3} Rue de la République, ${localisation || 'France'}`,
    formatted_phone_number: `06 ${String(10 + index).padStart(2, '0')} ${String(20 + index * 2).padStart(2, '0')} ${String(30 + index * 3).padStart(2, '0')} ${String(40 + index * 4).padStart(2, '0')}`,
    website: index % 2 === 0 ? `https://www.${name.toLowerCase().replace(/\s/g, '-')}.fr` : undefined,
    rating: 3.5 + Math.random() * 1.5,
    user_ratings_total: Math.floor(5 + Math.random() * 50),
    reviews: generateMockReviews(index),
    geometry: {
      location: { lat: 48.8566 + Math.random() * 0.1, lng: 2.3522 + Math.random() * 0.1 }
    },
    types: ['point_of_interest', 'establishment'],
  }));
}

/**
 * Génère des avis de simulation avec pain signals
 */
function generateMockReviews(seed: number): GoogleReview[] {
  const painReviews = [
    "Impossible de les joindre au téléphone. J'ai laissé plusieurs messages sans réponse.",
    "Attente du devis depuis 3 semaines, toujours rien. Très déçu du manque de réactivité.",
    "Ne répond jamais aux emails. J'ai dû trouver quelqu'un d'autre.",
    "Délai interminable pour avoir un simple devis. Pas professionnel.",
  ];
  
  const goodReviews = [
    "Excellent travail, très professionnel. Je recommande !",
    "Rapide et efficace. Devis reçu en 24h.",
    "Artisan sérieux, travail soigné.",
  ];

  const reviews: GoogleReview[] = [];
  const hasPainSignals = seed % 2 === 0;
  
  if (hasPainSignals) {
    reviews.push({
      author_name: 'Client mécontent',
      rating: 1,
      text: painReviews[seed % painReviews.length],
      time: Date.now() / 1000 - 86400 * 7,
      relative_time_description: 'il y a une semaine',
    });
    reviews.push({
      author_name: 'Autre client',
      rating: 2,
      text: painReviews[(seed + 1) % painReviews.length],
      time: Date.now() / 1000 - 86400 * 14,
      relative_time_description: 'il y a 2 semaines',
    });
  }
  
  reviews.push({
    author_name: 'Client satisfait',
    rating: 5,
    text: goodReviews[seed % goodReviews.length],
    time: Date.now() / 1000 - 86400 * 30,
    relative_time_description: 'il y a un mois',
  });

  return reviews;
}

/**
 * Convertit les avis Google en ReviewData pour PainSignalsEngine
 */
function convertToReviewData(googleReviews: GoogleReview[]): ReviewData[] {
  return googleReviews.map(review => ({
    text: review.text,
    rating: review.rating,
    date: new Date(review.time * 1000),
    authorName: review.author_name,
  }));
}

/**
 * Extrait la ville depuis l'adresse formatée
 */
function extractVille(address: string): string {
  const parts = address.split(',');
  if (parts.length >= 2) {
    const villeWithCode = parts[parts.length - 2].trim();
    return villeWithCode.replace(/^\d{5}\s*/, '').trim();
  }
  return address;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metier, localisation } = body;

    if (!metier || !localisation) {
      return NextResponse.json(
        { error: 'Métier et localisation requis' },
        { status: 400 }
      );
    }

    // Construction de la requête de recherche
    const searchQuery = `${metier} ${localisation}`;
    console.log(`[Radar] Recherche: "${searchQuery}"`);

    // Recherche Google Places (avec split multi-métiers et fallback API)
    const places = await searchGooglePlaces(searchQuery, metier, localisation);
    console.log(`[Radar] ${places.length} établissements trouvés`);

    // Récupérer les place_ids existants pour logique upsert
    const placeIds = places.map(p => p.place_id);
    const { data: existingProspects } = await supabase
      .from('prospects')
      .select('id, place_id')
      .in('place_id', placeIds);

    const existingPlaceIds = new Set(existingProspects?.map(p => p.place_id) || []);

    // Traitement de chaque établissement
    const results: RadarProspect[] = [];
    let newCount = 0;
    let updatedCount = 0;

    for (const place of places) {
      // Analyse Pain Signals
      const reviews = place.reviews || [];
      const reviewData = convertToReviewData(reviews);
      const insight = PainSignalsEngine.calculatePainScore(reviewData);

      const isNew = !existingPlaceIds.has(place.place_id);
      
      // Préparer les données prospect
      const prospectData = {
        place_id: place.place_id,
        raison_sociale: place.name,
        activite_principale: metier,
        activites_secondaires: [],
        adresse: place.formatted_address,
        ville: extractVille(place.formatted_address),
        telephone: place.formatted_phone_number || null,
        site_web: place.website || null,
        note_google: place.rating || null,
        nombre_avis: place.user_ratings_total || 0,
        pain_score: insight.painScore,
        urgency_level: insight.urgencyLevel,
        pain_summary: insight.summary,
        top_issues: insight.topIssues,
        score_pertinence: Math.min(100, 50 + insight.painScore * 0.5),
        fiches_cee_potentielles: [],
        statut: 'nouveau' as const,
        date_creation: new Date().toISOString(),
        latitude: place.geometry?.location.lat,
        longitude: place.geometry?.location.lng,
      };

      // Upsert dans Supabase
      const { error } = await supabase
        .from('prospects')
        .upsert(prospectData, { onConflict: 'place_id' });

      if (error) {
        console.error(`[Radar] Erreur upsert ${place.place_id}:`, error);
      } else {
        if (isNew) newCount++;
        else updatedCount++;
      }

      // Ajouter au résultat pour affichage
      results.push({
        place_id: place.place_id,
        raison_sociale: place.name,
        adresse: place.formatted_address,
        ville: extractVille(place.formatted_address),
        telephone: place.formatted_phone_number || null,
        site_web: place.website || null,
        note_google: place.rating || null,
        nombre_avis: place.user_ratings_total || 0,
        pain_score: insight.painScore,
        urgency_level: insight.urgencyLevel,
        pain_summary: insight.summary,
        top_issues: insight.topIssues,
        is_new: isNew,
        // Nouvelles données pour scripts de vente personnalisés
        real_quotes: insight.realQuotes,
        script_hooks: insight.scriptHooks,
      });
    }

    // Trier par pain_score décroissant (prospects à haut potentiel en premier)
    results.sort((a, b) => b.pain_score - a.pain_score);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      total: results.length,
      new_count: newCount,
      updated_count: updatedCount,
      high_potential_count: results.filter(r => r.pain_score > 40).length,
      prospects: results,
      mode: isRealMode ? 'PRODUCTION' : 'SIMULATION',
    });

  } catch (error) {
    console.error('[Radar] Erreur API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche radar' },
      { status: 500 }
    );
  }
}
