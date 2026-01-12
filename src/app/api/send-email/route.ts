import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// API ROUTE: ENVOI EMAIL VIA RESEND
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Capital Énergie <onboarding@resend.dev>'; // Domaine par défaut Resend

interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  message: string;
  prospectId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { to, toName, subject, message, prospectId } = body;

    // Validation
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants (to, subject, message)' },
        { status: 400 }
      );
    }

    // Mode SIMULATION si pas de clé API
    if (!RESEND_API_KEY) {
      console.log('📧 [SIMULATION] Email envoyé à:', to);
      console.log('   Sujet:', subject);
      console.log('   Message:', message.substring(0, 100) + '...');
      
      return NextResponse.json({
        success: true,
        mode: 'simulation',
        message: 'Email simulé (RESEND_API_KEY non configurée)',
        data: {
          id: `sim_${Date.now()}`,
          to,
          subject,
          sentAt: new Date().toISOString(),
        }
      });
    }

    // Mode RÉEL - Envoi via Resend API
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Capital Énergie</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">
            Partenariat CEE - Économies d'Énergie
          </p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <div style="background: #1e293b; padding: 16px; border-radius: 0 0 8px 8px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: htmlContent,
        text: message,
        tags: [
          { name: 'campaign', value: 'prospection_cee' },
          { name: 'prospect_id', value: prospectId || 'unknown' },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur Resend:', result);
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Erreur lors de l\'envoi',
          details: result 
        },
        { status: response.status }
      );
    }

    console.log('✅ Email envoyé via Resend:', result.id);
    
    return NextResponse.json({
      success: true,
      mode: 'real',
      message: 'Email envoyé avec succès',
      data: {
        id: result.id,
        to,
        subject,
        sentAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Erreur API send-email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}
