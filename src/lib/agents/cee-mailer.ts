/**
 * Agent d'Automatisation des Envois CEE
 * 
 * Gère les campagnes email de prospection :
 * - Intégration Resend API
 * - Séquence Drip Campaign (J1 + J4 relance)
 * - Tracking des ouvertures
 * - Limite anti-spam 30/jour
 * 
 * Mode de fonctionnement :
 * - RÉEL : Si RESEND_API_KEY est présente
 * - SIMULATION : Sinon, simule les envois sans appel API
 */

import { supabase } from '@/lib/supabase/client';
import type { Prospect, ProspectStatus } from './cee-prospector';
import { RESEND_CONFIG, logAgentStatus } from '../config/env-config';

// Log du statut au chargement du module
if (typeof window !== 'undefined') {
  logAgentStatus();
}

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
export type CampaignStep = 'initial' | 'relance_j4' | 'relance_j7' | 'cloture';

export interface EmailLog {
  id: string;
  prospect_id: string;
  campaign_step: CampaignStep;
  subject: string;
  body: string;
  status: EmailStatus;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  tracking_id: string;
  resend_id?: string;
}

export interface CampaignConfig {
  name: string;
  steps: CampaignStepConfig[];
  daily_limit: number;
  enabled: boolean;
}

export interface CampaignStepConfig {
  step: CampaignStep;
  delay_days: number;
  subject_template: string;
  condition?: (prospect: Prospect, logs: EmailLog[]) => boolean;
}

export interface SendResult {
  success: boolean;
  email_id?: string;
  resend_id?: string;
  error?: string;
}

export interface DailySendStats {
  date: string;
  sent_count: number;
  remaining: number;
  limit: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAILER_CONFIG = {
  // Limite quotidienne anti-spam
  DAILY_LIMIT: 30,
  
  // Délais de la séquence (en jours)
  DELAYS: {
    INITIAL: 0,
    RELANCE_J4: 4,
    RELANCE_J7: 7,
    CLOTURE: 14,
  },
  
  // Configuration Resend
  RESEND_API_URL: 'https://api.resend.com/emails',
  
  // Domaine d'envoi
  FROM_EMAIL: 'prospection@capital-energie.fr',
  FROM_NAME: 'Capital Énergie',
  
  // Tracking
  TRACKING_DOMAIN: process.env.NEXT_PUBLIC_APP_URL || 'https://capital-energie.fr',
  
  // Prime de référence pour les templates
  PRIME_REFERENCE: 2969,
  PUISSANCE_REFERENCE: 25,
};

// ============================================================================
// TEMPLATES EMAIL
// ============================================================================

const EMAIL_TEMPLATES = {
  initial: {
    subject: (prospect: Prospect) => 
      `${prospect.contact_nom?.split(' ')[0] || 'Bonjour'}, divisez vos devis moteurs par 3`,
    
    body: (prospect: Prospect) => {
      const prenom = prospect.contact_nom?.split(' ')[0] || 'Bonjour';
      const activite = prospect.activite_principale.toLowerCase();
      
      return `${prenom},

J'ai vu que vous travaillez sur ${activite}${prospect.ville ? ` à ${prospect.ville}` : ''}.

Saviez-vous que je peux diviser vos devis par 3 grâce à la prime CEE de ${MAILER_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € ?

Et le meilleur : vous n'avez aucune paperasse à faire.

Pour un moteur de ${MAILER_CONFIG.PUISSANCE_REFERENCE} kW avec variateur, vos clients récupèrent quasi 3 000 € de prime, déduits directement du devis.

Je m'occupe de tout : dossier, validation, versement.

Vous facturez, je gère l'administratif.

Intéressé pour en discuter 10 minutes ?

Cordialement,
L'équipe Capital Énergie

---
Capital Énergie - Partenaire CEE
Se désinscrire : {{unsubscribe_link}}`;
    },
  },
  
  relance_j4: {
    subject: (prospect: Prospect) => 
      `${prospect.contact_nom?.split(' ')[0] || 'Bonjour'}, votre pack "Prêt à signer" vous attend`,
    
    body: (prospect: Prospect) => {
      const prenom = prospect.contact_nom?.split(' ')[0] || 'Bonjour';
      
      return `${prenom},

Je me permets de revenir vers vous suite à mon précédent message.

Pour vous montrer la simplicité de notre approche, j'ai préparé un exemple concret :

📦 Pack "Prêt à signer" pour une opération variateur 25 kW :

✅ Devis pré-rempli avec la prime de ${MAILER_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € déjà déduite
✅ Attestation sur l'Honneur complète
✅ Mandat de délégation CEE

Votre client signe → Vous installez → Nous gérons le dossier → Vous êtes payé.

C'est tout.

Voulez-vous que je vous envoie ce pack exemple pour voir à quoi ça ressemble ?

Cordialement,
L'équipe Capital Énergie

---
Capital Énergie - Partenaire CEE
Se désinscrire : {{unsubscribe_link}}`;
    },
  },
  
  relance_j7: {
    subject: (prospect: Prospect) => 
      `Dernière relance : ${MAILER_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € de prime CEE`,
    
    body: (prospect: Prospect) => {
      const prenom = prospect.contact_nom?.split(' ')[0] || 'Bonjour';
      
      return `${prenom},

C'est ma dernière relance, je ne veux pas vous importuner.

Récapitulatif de ce que je vous propose :
• Prime de ${MAILER_CONFIG.PRIME_REFERENCE.toLocaleString('fr-FR')} € pour un moteur de ${MAILER_CONFIG.PUISSANCE_REFERENCE} kW
• Zéro paperasse pour vous
• Je gère 100% de l'administratif

Si ce n'est pas le bon moment, pas de souci.
Si vous voulez en savoir plus, répondez simplement "Intéressé" à cet email.

Belle continuation,
L'équipe Capital Énergie

---
Capital Énergie - Partenaire CEE
Se désinscrire : {{unsubscribe_link}}`;
    },
  },
};

// ============================================================================
// CONFIGURATION CAMPAGNE PAR DÉFAUT
// ============================================================================

export const DEFAULT_CAMPAIGN: CampaignConfig = {
  name: 'Prospection CEE IND-UT-102',
  daily_limit: MAILER_CONFIG.DAILY_LIMIT,
  enabled: true,
  steps: [
    {
      step: 'initial',
      delay_days: 0,
      subject_template: 'initial',
      condition: (prospect) => prospect.statut === 'nouveau' || prospect.statut === 'a_contacter',
    },
    {
      step: 'relance_j4',
      delay_days: 4,
      subject_template: 'relance_j4',
      condition: (prospect, logs) => {
        const initialSent = logs.find(l => l.campaign_step === 'initial' && l.status !== 'failed');
        const alreadyReplied = prospect.statut === 'interesse' || prospect.statut === 'rdv_pris';
        const alreadyRelanced = logs.some(l => l.campaign_step === 'relance_j4');
        return !!initialSent && !alreadyReplied && !alreadyRelanced;
      },
    },
    {
      step: 'relance_j7',
      delay_days: 7,
      subject_template: 'relance_j7',
      condition: (prospect, logs) => {
        const relanceJ4Sent = logs.find(l => l.campaign_step === 'relance_j4' && l.status !== 'failed');
        const alreadyReplied = prospect.statut === 'interesse' || prospect.statut === 'rdv_pris';
        const alreadyRelanced = logs.some(l => l.campaign_step === 'relance_j7');
        return !!relanceJ4Sent && !alreadyReplied && !alreadyRelanced;
      },
    },
  ],
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function generateTrackingId(): string {
  return `TRK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
}

function generateEmailId(): string {
  return `EML-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysSince(date: string): number {
  const then = new Date(date);
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ============================================================================
// INTÉGRATION RESEND API
// ============================================================================

interface ResendEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Envoie un email via Resend API
 * Bascule automatiquement entre mode RÉEL et SIMULATION
 */
async function sendViaResend(payload: ResendEmailPayload): Promise<{ id: string } | null> {
  // Basculement automatique Simulation/Réel
  if (RESEND_CONFIG.mode === 'SIMULATION') {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: `sim_${Date.now()}` };
  }
  
  const apiKey = RESEND_CONFIG.apiKey;
  
  try {
    const response = await fetch(MAILER_CONFIG.RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Convertit le texte en HTML basique
 */
function textToHtml(text: string, trackingId: string): string {
  const trackingPixel = `<img src="${MAILER_CONFIG.TRACKING_DOMAIN}/api/track/open/${trackingId}" width="1" height="1" style="display:none" />`;
  const unsubscribeLink = `${MAILER_CONFIG.TRACKING_DOMAIN}/api/track/unsubscribe/${trackingId}`;
  
  const htmlContent = text
    .replace(/\n/g, '<br>')
    .replace('{{unsubscribe_link}}', `<a href="${unsubscribeLink}">Se désinscrire</a>`);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${htmlContent}
  ${trackingPixel}
</body>
</html>`;
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Vérifie la limite quotidienne d'envoi
 */
export async function getDailySendStats(): Promise<DailySendStats> {
  const today = new Date().toISOString().split('T')[0];
  
  const { count, error } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', `${today}T00:00:00`)
    .lt('sent_at', `${today}T23:59:59`);
  
  const sentCount = error ? 0 : (count || 0);
  
  return {
    date: today,
    sent_count: sentCount,
    remaining: Math.max(0, MAILER_CONFIG.DAILY_LIMIT - sentCount),
    limit: MAILER_CONFIG.DAILY_LIMIT,
  };
}

/**
 * Envoie un email à un prospect
 */
export async function sendEmail(
  prospect: Prospect,
  step: CampaignStep
): Promise<SendResult> {
  // Vérification limite quotidienne
  const stats = await getDailySendStats();
  if (stats.remaining <= 0) {
    return {
      success: false,
      error: `Limite quotidienne atteinte (${MAILER_CONFIG.DAILY_LIMIT}/jour)`,
    };
  }
  
  // Vérification email prospect
  if (!prospect.email) {
    return {
      success: false,
      error: 'Prospect sans adresse email',
    };
  }
  
  // Génération du contenu
  const template = EMAIL_TEMPLATES[step as keyof typeof EMAIL_TEMPLATES];
  if (!template) {
    return {
      success: false,
      error: `Template inconnu: ${step}`,
    };
  }
  
  const subject = template.subject(prospect);
  const body = template.body(prospect);
  const trackingId = generateTrackingId();
  const emailId = generateEmailId();
  
  // Envoi via Resend
  const html = textToHtml(body, trackingId);
  const resendResult = await sendViaResend({
    from: `${MAILER_CONFIG.FROM_NAME} <${MAILER_CONFIG.FROM_EMAIL}>`,
    to: prospect.email,
    subject,
    html,
    text: body.replace('{{unsubscribe_link}}', `${MAILER_CONFIG.TRACKING_DOMAIN}/unsubscribe`),
    tags: [
      { name: 'prospect_id', value: prospect.id },
      { name: 'campaign_step', value: step },
    ],
  });
  
  // Log dans la base
  const emailLog: Partial<EmailLog> = {
    id: emailId,
    prospect_id: prospect.id,
    campaign_step: step,
    subject,
    body,
    status: resendResult ? 'sent' : 'failed',
    sent_at: new Date().toISOString(),
    tracking_id: trackingId,
    resend_id: resendResult?.id,
  };
  
  await supabase.from('email_logs').insert(emailLog);
  
  // Mise à jour du prospect (désactivé - table prospects n'existe pas)
  if (resendResult) {
    console.log('[CEE-Mailer] Mode local - mise à jour prospect simulée:', prospect.id);
  }
  
  return {
    success: !!resendResult,
    email_id: emailId,
    resend_id: resendResult?.id,
    error: resendResult ? undefined : 'Échec envoi Resend',
  };
}

/**
 * Récupère l'historique des emails d'un prospect
 */
export async function getProspectEmailLogs(prospectId: string): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('sent_at', { ascending: false });
  
  if (error) {
    return [];
  }
  
  return data as EmailLog[];
}

/**
 * Détermine le prochain step de campagne pour un prospect
 */
export async function getNextCampaignStep(
  prospect: Prospect,
  campaign: CampaignConfig = DEFAULT_CAMPAIGN
): Promise<CampaignStep | null> {
  const logs = await getProspectEmailLogs(prospect.id);
  
  for (const stepConfig of campaign.steps) {
    // Vérifier la condition
    if (stepConfig.condition && !stepConfig.condition(prospect, logs)) {
      continue;
    }
    
    // Vérifier si déjà envoyé
    const alreadySent = logs.some(l => l.campaign_step === stepConfig.step);
    if (alreadySent) {
      continue;
    }
    
    // Vérifier le délai
    if (stepConfig.delay_days > 0) {
      const lastSent = logs[0]?.sent_at;
      if (!lastSent || daysSince(lastSent) < stepConfig.delay_days) {
        continue;
      }
    }
    
    return stepConfig.step;
  }
  
  return null;
}

/**
 * Exécute la campagne automatique pour tous les prospects éligibles
 */
export async function runDripCampaign(
  campaign: CampaignConfig = DEFAULT_CAMPAIGN
): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}> {
  if (!campaign.enabled) {
    return { processed: 0, sent: 0, skipped: 0, errors: ['Campagne désactivée'] };
  }
  
  const stats = await getDailySendStats();
  if (stats.remaining <= 0) {
    return { processed: 0, sent: 0, skipped: 0, errors: ['Limite quotidienne atteinte'] };
  }
  
  // Table 'prospects' désactivée - mode local
  console.log('[CEE-Mailer] Mode local - pas de prospects en base');
  const prospects: Prospect[] = [];
  
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const prospect of prospects as Prospect[]) {
    // Vérifier limite
    if (sent >= stats.remaining) break;
    
    // Déterminer le step
    const nextStep = await getNextCampaignStep(prospect, campaign);
    if (!nextStep) {
      skipped++;
      continue;
    }
    
    // Envoyer
    const result = await sendEmail(prospect, nextStep);
    if (result.success) {
      sent++;
    } else {
      errors.push(`${prospect.raison_sociale}: ${result.error}`);
    }
  }
  
  return {
    processed: prospects.length,
    sent,
    skipped,
    errors,
  };
}

// ============================================================================
// TRACKING DES OUVERTURES
// ============================================================================

/**
 * Enregistre une ouverture d'email (appelé par l'API de tracking)
 */
export async function trackEmailOpen(trackingId: string): Promise<void> {
  // Mettre à jour le log email
  const { data: emailLog } = await supabase
    .from('email_logs')
    .select('prospect_id, opened_at')
    .eq('tracking_id', trackingId)
    .single();
  
  if (!emailLog) return;
  
  // Première ouverture
  if (!emailLog.opened_at) {
    await supabase
      .from('email_logs')
      .update({ 
        status: 'opened',
        opened_at: new Date().toISOString(),
      })
      .eq('tracking_id', trackingId);
  }
  
  // Incrémenter le compteur du prospect
  await supabase.rpc('increment_prospect_opens', {
    p_prospect_id: emailLog.prospect_id,
  });
}

/**
 * Enregistre un clic dans un email
 */
export async function trackEmailClick(trackingId: string, link: string): Promise<void> {
  await supabase
    .from('email_logs')
    .update({ 
      status: 'clicked',
      clicked_at: new Date().toISOString(),
    })
    .eq('tracking_id', trackingId);
}

/**
 * Récupère les prospects "chauds" (avec ouvertures récentes)
 * NOTE: Table 'prospects' désactivée - retourne tableau vide
 */
export async function getHotProspects(minOpens: number = 2): Promise<Prospect[]> {
  console.log('[CEE-Mailer] Mode local - pas de prospects chauds en base');
  return [];
}

// ============================================================================
// SCHÉMA SQL COMPLÉMENTAIRE
// ============================================================================

export const EMAIL_LOGS_TABLE_SQL = `
-- Table des logs d'emails
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(50) PRIMARY KEY,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_step VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  tracking_id VARCHAR(50) UNIQUE NOT NULL,
  resend_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_email_logs_prospect ON email_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON email_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Colonnes supplémentaires pour la table prospects (tracking)
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS derniere_ouverture TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nombre_ouvertures INTEGER DEFAULT 0;

-- Index pour les prospects chauds
CREATE INDEX IF NOT EXISTS idx_prospects_ouvertures ON prospects(nombre_ouvertures DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_derniere_ouverture ON prospects(derniere_ouverture DESC NULLS LAST);

-- Fonction pour incrémenter les ouvertures
CREATE OR REPLACE FUNCTION increment_prospect_opens(p_prospect_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prospects
  SET 
    nombre_ouvertures = COALESCE(nombre_ouvertures, 0) + 1,
    derniere_ouverture = NOW()
  WHERE id = p_prospect_id;
END;
$$ LANGUAGE plpgsql;

-- Vue des prospects chauds
CREATE OR REPLACE VIEW prospects_chauds AS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM email_logs e WHERE e.prospect_id = p.id) as total_emails,
  (SELECT MAX(sent_at) FROM email_logs e WHERE e.prospect_id = p.id) as dernier_email
FROM prospects p
WHERE p.nombre_ouvertures >= 2
ORDER BY p.derniere_ouverture DESC;

-- Vue des stats quotidiennes d'envoi
CREATE OR REPLACE VIEW email_stats_daily AS
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  ROUND(COUNT(*) FILTER (WHERE status = 'opened')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as taux_ouverture
FROM email_logs
WHERE sent_at IS NOT NULL
GROUP BY DATE(sent_at)
ORDER BY date DESC;
`;

// ============================================================================
// API ROUTES POUR TRACKING (À créer dans /app/api/track/)
// ============================================================================

export const TRACKING_API_EXAMPLE = `
// Fichier: src/app/api/track/open/[trackingId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { trackEmailOpen } from '@/lib/agents/cee-mailer';

// Pixel transparent 1x1
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  await trackEmailOpen(params.trackingId);
  
  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
`;
