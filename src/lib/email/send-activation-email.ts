// Service d'envoi d'email d'activation - Capital Énergie v2.7.0

import {
  generateActivationEmailSubject,
  generateActivationEmailHTML,
  generateActivationEmailText,
  FORFAIT_DETAILS,
  type ActivationEmailData,
} from './activation-template';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Capital Énergie <onboarding@resend.dev>';

interface SendActivationEmailResult {
  success: boolean;
  mode: 'real' | 'simulation';
  message: string;
  emailId?: string;
}

export async function sendActivationEmail(
  customerEmail: string,
  customerName: string | null,
  forfaitId: string,
  amountPaid: number
): Promise<SendActivationEmailResult> {
  
  // Récupérer les détails du forfait
  const forfaitDetails = FORFAIT_DETAILS[forfaitId] || {
    name: 'Forfait Capital Énergie',
    dossiers: 'Variable',
    volume: 'Selon abonnement',
  };

  const emailData: ActivationEmailData = {
    customerName: customerName || 'Partenaire',
    customerEmail,
    forfaitName: forfaitDetails.name,
    dossiersCount: forfaitDetails.volume,
    forfaitId,
    amount: Math.round(amountPaid / 100), // Convertir centimes en euros
  };

  const subject = generateActivationEmailSubject();
  const htmlContent = generateActivationEmailHTML(emailData);
  const textContent = generateActivationEmailText(emailData);

  // Mode SIMULATION si pas de clé API
  if (!RESEND_API_KEY) {
    console.log('📧 [SIMULATION] Email d\'activation');
    console.log(`   📬 To: ${customerEmail}`);
    console.log(`   📝 Subject: ${subject}`);
    console.log(`   📦 Forfait: ${forfaitDetails.name}`);
    
    return {
      success: true,
      mode: 'simulation',
      message: 'Email simulé (RESEND_API_KEY non configurée)',
      emailId: `sim_activation_${Date.now()}`,
    };
  }

  // Mode RÉEL - Envoi via Resend API
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [customerEmail],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'campaign', value: 'activation_scanner_flash' },
          { name: 'forfait', value: forfaitId },
          { name: 'type', value: 'welcome' },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur envoi email activation:', result);
      return {
        success: false,
        mode: 'real',
        message: result.message || 'Erreur lors de l\'envoi',
      };
    }

    console.log('✅ Email d\'activation envoyé!');
    console.log(`   📬 To: ${customerEmail}`);
    console.log(`   📦 Forfait: ${forfaitDetails.name}`);
    console.log(`   🆔 ID: ${result.id}`);

    return {
      success: true,
      mode: 'real',
      message: 'Email d\'activation envoyé avec succès',
      emailId: result.id,
    };

  } catch (error) {
    console.error('❌ Erreur technique envoi email:', error);
    return {
      success: false,
      mode: 'real',
      message: error instanceof Error ? error.message : 'Erreur technique',
    };
  }
}
