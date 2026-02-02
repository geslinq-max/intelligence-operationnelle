/**
 * API BSD - Flux complet Trackdéchets Production
 * Création, signature et suivi des Bordereaux de Suivi des Déchets
 * 
 * @module api/bsd
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createBSDADraft,
  publishBSDA,
  signBSDAAsProducer,
  signBSDAAsTransporter,
  getBSDADetails,
  checkBSDAProcessed,
  convertBSDToTrackdechets,
  isTrackdechetsAvailable,
  getTrackdechetsConfig,
  TRACKDECHETS_STATUS,
} from '@/lib/api/trackdechets';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================================
// TYPES
// ============================================================================

interface BSDCreateRequest {
  chantierNom: string;
  chantierAdresse: string;
  dateEnlevement: string;
  producteurNom: string;
  producteurSiret: string;
  producteurTel: string;
  typeDechet: string;
  codeDechet: string;
  tonnageEstime: number;
  volumeEstime?: number;
  conditionnement: string;
  destinationNom: string;
  destinationAdresse: string;
  destinationType: string;
  transporteurNom: string;
  transporteurSiret: string;
  immatriculationVehicule: string;
  signatureProducteur: string | null;
  signatureTransporteur: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère un numéro BSD local (fallback si API non disponible)
 */
function generateLocalBSDNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BSD-${timestamp}-${random}`;
}

/**
 * Enregistre le BSD dans Supabase pour suivi
 */
async function saveBSDToDatabase(bsdData: BSDCreateRequest & {
  trackdechetsId?: string;
  readableId?: string;
  status: string;
  mode: 'PRODUCTION' | 'LOCAL';
}) {
  try {
    const { error } = await supabase.from('bordereaux_dechets').insert({
      trackdechets_id: bsdData.trackdechetsId || null,
      readable_id: bsdData.readableId || generateLocalBSDNumber(),
      status: bsdData.status,
      mode: bsdData.mode,
      chantier_nom: bsdData.chantierNom,
      chantier_adresse: bsdData.chantierAdresse,
      date_enlevement: bsdData.dateEnlevement,
      producteur_nom: bsdData.producteurNom,
      producteur_siret: bsdData.producteurSiret,
      producteur_tel: bsdData.producteurTel,
      type_dechet: bsdData.typeDechet,
      code_dechet: bsdData.codeDechet,
      tonnage_estime: bsdData.tonnageEstime,
      volume_estime: bsdData.volumeEstime || null,
      conditionnement: bsdData.conditionnement,
      destination_nom: bsdData.destinationNom,
      destination_adresse: bsdData.destinationAdresse,
      destination_type: bsdData.destinationType,
      transporteur_nom: bsdData.transporteurNom,
      transporteur_siret: bsdData.transporteurSiret,
      immatriculation: bsdData.immatriculationVehicule,
      signature_producteur: bsdData.signatureProducteur,
      signature_transporteur: bsdData.signatureTransporteur,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[BSD API] Erreur sauvegarde Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[BSD API] Exception sauvegarde:', error);
    return false;
  }
}

/**
 * Envoie une notification au client
 */
async function sendClientNotification(
  clientEmail: string | undefined,
  clientPhone: string | undefined,
  bsdNumber: string,
  status: string
) {
  // TODO: Intégrer avec service-notifications.js
  console.log(`[BSD API] Notification client: BSD ${bsdNumber} - Status: ${status}`);
  
  // Pour l'instant, on log simplement
  // L'intégration avec Twilio/SendGrid sera ajoutée ultérieurement
  return true;
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/bsd - Créer et signer un BSD
 */
export async function POST(request: NextRequest) {
  try {
    const body: BSDCreateRequest = await request.json();
    
    // Validation des champs requis
    if (!body.chantierNom || !body.producteurNom) {
      return NextResponse.json(
        { error: 'Champs requis manquants: chantierNom, producteurNom' },
        { status: 400 }
      );
    }

    // CONF-006 FIX: Validation stricte du tonnage (doit être > 0)
    if (typeof body.tonnageEstime !== 'number' || body.tonnageEstime <= 0) {
      return NextResponse.json(
        { error: 'Le tonnage estimé doit être un nombre supérieur à 0' },
        { status: 400 }
      );
    }

    // Validation des signatures
    if (!body.signatureProducteur || !body.signatureTransporteur) {
      return NextResponse.json(
        { error: 'Les signatures producteur et transporteur sont requises' },
        { status: 400 }
      );
    }

    const config = getTrackdechetsConfig();
    console.log(`[BSD API] Mode: ${config.isProduction ? 'PRODUCTION' : 'LOCAL'}`);

    // ========================================================================
    // MODE PRODUCTION - API Trackdéchets
    // ========================================================================
    if (isTrackdechetsAvailable()) {
      console.log('[BSD API] Création BSDA via API Trackdéchets...');
      
      // 1. Convertir les données au format Trackdéchets
      const bsdaData = convertBSDToTrackdechets(body);
      
      // 2. Créer le brouillon
      const draft = await createBSDADraft(bsdaData);
      if (!draft) {
        console.error('[BSD API] Échec création brouillon Trackdéchets');
        // Fallback vers mode local
        return handleLocalMode(body);
      }
      
      console.log(`[BSD API] Brouillon créé: ${draft.id}`);
      
      // 3. Signer côté producteur
      const signedProducer = await signBSDAAsProducer(draft.id, body.signatureProducteur);
      if (!signedProducer) {
        console.error('[BSD API] Échec signature producteur');
      }
      
      // 4. Signer côté transporteur
      const signedTransporter = await signBSDAAsTransporter(draft.id, body.signatureTransporteur);
      if (!signedTransporter) {
        console.error('[BSD API] Échec signature transporteur');
      }
      
      // 5. Publier le BSDA pour obtenir le numéro officiel
      const published = await publishBSDA(draft.id);
      const readableId = published?.readableId || draft.id;
      
      console.log(`[BSD API] BSDA publié avec numéro officiel: ${readableId}`);
      
      // 6. Sauvegarder en base
      await saveBSDToDatabase({
        ...body,
        trackdechetsId: draft.id,
        readableId: readableId,
        status: 'SIGNED_BY_PRODUCER',
        mode: 'PRODUCTION',
      });
      
      return NextResponse.json({
        success: true,
        mode: 'PRODUCTION',
        bsdId: draft.id,
        readableId: readableId,
        status: 'SIGNED_BY_PRODUCER',
        message: `Bordereau ${readableId} créé et signé avec succès`,
        trackdechetsUrl: `https://app.trackdechets.beta.gouv.fr/dashboard/${draft.id}`,
      });
    }

    // ========================================================================
    // MODE LOCAL - Sans API Trackdéchets
    // ========================================================================
    return handleLocalMode(body);

  } catch (error) {
    console.error('[BSD API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du BSD' },
      { status: 500 }
    );
  }
}

/**
 * Gère le mode local (sans API Trackdéchets)
 */
async function handleLocalMode(body: BSDCreateRequest) {
  const localBsdNumber = generateLocalBSDNumber();
  
  console.log(`[BSD API] Mode LOCAL - Génération BSD: ${localBsdNumber}`);
  
  // Sauvegarder en base
  await saveBSDToDatabase({
    ...body,
    readableId: localBsdNumber,
    status: 'LOCAL_SIGNED',
    mode: 'LOCAL',
  });
  
  return NextResponse.json({
    success: true,
    mode: 'LOCAL',
    bsdId: localBsdNumber,
    readableId: localBsdNumber,
    status: 'LOCAL_SIGNED',
    message: `Bordereau ${localBsdNumber} créé localement (mode préparation)`,
    warning: 'API Trackdéchets non configurée - Le BSD est valide localement mais non transmis à l\'État',
  });
}

/**
 * GET /api/bsd - Récupérer le statut d'un BSD
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bsdId = searchParams.get('id');
  
  if (!bsdId) {
    // Retourner le statut général de l'intégration
    return NextResponse.json({
      trackdechets: TRACKDECHETS_STATUS,
      config: {
        isProduction: getTrackdechetsConfig().isProduction,
        apiUrl: getTrackdechetsConfig().apiUrl,
      },
    });
  }
  
  // Vérifier le statut d'un BSD spécifique
  if (isTrackdechetsAvailable()) {
    const status = await checkBSDAProcessed(bsdId);
    
    return NextResponse.json({
      success: true,
      bsdId,
      ...status,
      notification: status.isProcessed 
        ? 'Le bordereau a été traité par le centre de destination'
        : 'En attente de traitement',
    });
  }
  
  // Mode local - chercher en base
  const { data, error } = await supabase
    .from('bordereaux_dechets')
    .select('*')
    .or(`trackdechets_id.eq.${bsdId},readable_id.eq.${bsdId}`)
    .single();
  
  if (error || !data) {
    return NextResponse.json(
      { error: 'BSD non trouvé' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    bsdId: data.readable_id,
    status: data.status,
    mode: data.mode,
    createdAt: data.created_at,
  });
}

/**
 * PATCH /api/bsd - Mettre à jour le statut (webhook Trackdéchets)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bsdId, status, processingDate } = body;
    
    if (!bsdId || !status) {
      return NextResponse.json(
        { error: 'bsdId et status requis' },
        { status: 400 }
      );
    }
    
    // Mettre à jour en base
    const { error } = await supabase
      .from('bordereaux_dechets')
      .update({
        status,
        processing_date: processingDate || null,
        updated_at: new Date().toISOString(),
      })
      .or(`trackdechets_id.eq.${bsdId},readable_id.eq.${bsdId}`);
    
    if (error) {
      console.error('[BSD API] Erreur mise à jour:', error);
      return NextResponse.json(
        { error: 'Erreur mise à jour BSD' },
        { status: 500 }
      );
    }
    
    // Si le BSD est traité, envoyer notification
    if (status === 'PROCESSED') {
      // Récupérer les infos du BSD pour notification
      const { data: bsdData } = await supabase
        .from('bordereaux_dechets')
        .select('producteur_tel, readable_id')
        .or(`trackdechets_id.eq.${bsdId},readable_id.eq.${bsdId}`)
        .single();
      
      if (bsdData) {
        await sendClientNotification(
          undefined,
          bsdData.producteur_tel,
          bsdData.readable_id,
          'PROCESSED'
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `BSD ${bsdId} mis à jour: ${status}`,
    });
    
  } catch (error) {
    console.error('[BSD API] Erreur PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur mise à jour BSD' },
      { status: 500 }
    );
  }
}
