// Template Email d'Activation - Capital Énergie v2.7.0
// ⚠️ INTERDICTION: Ne jamais utiliser le mot "agent"
// Substituts autorisés: Scanner Flash, Système d'Audit, Assistant Digital

export interface ActivationEmailData {
  customerName: string;
  customerEmail: string;
  forfaitName: string;
  dossiersCount: string;
  forfaitId: string;
  amount: number;
}

export const FORFAIT_DETAILS: Record<string, { name: string; dossiers: string; volume: string }> = {
  essentiel: {
    name: 'Forfait Essentiel',
    dossiers: '3',
    volume: '3 dossiers/mois',
  },
  serenite: {
    name: 'Forfait Sérénité',
    dossiers: '15',
    volume: '15 dossiers/mois',
  },
  expert: {
    name: 'Forfait Expert',
    dossiers: 'Illimité',
    volume: 'Dossiers illimités',
  },
};

export function generateActivationEmailSubject(): string {
  return 'Félicitations ! Votre Scanner Flash est prêt (Accès à votre espace client)';
}

export function generateActivationEmailHTML(data: ActivationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capital-energie.fr';
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue chez Capital Énergie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header avec Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ⚡ CAPITAL ÉNERGIE
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Système d'Audit CEE - Scanner Flash
              </p>
            </td>
          </tr>

          <!-- Message de Bienvenue Personnalisé -->
          <tr>
            <td style="padding: 40px 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Bienvenue ${data.customerName || 'cher partenaire'} ! 🎉
              </h2>
              <p style="margin: 0; color: #94a3b8; font-size: 16px; line-height: 1.7;">
                Vous avez fait le bon choix. Votre trésorerie est désormais sécurisée 
                et vos heures de paperasse supprimées.
              </p>
            </td>
          </tr>

          <!-- Détails du Forfait -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Votre abonnement
                    </p>
                    <h3 style="margin: 0 0 16px 0; color: #10b981; font-size: 20px; font-weight: 600;">
                      ${data.forfaitName}
                    </h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #94a3b8; font-size: 14px;">Volume mensuel</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #334155; text-align: right;">
                          <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${data.dossiersCount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">Montant HT/mois</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${data.amount} €</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Avantages Scanner Flash -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: 500;">
                Ce que votre Scanner Flash vous apporte :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #10b981; font-size: 16px;">✓</span>
                    <span style="color: #cbd5e1; font-size: 14px; margin-left: 12px;">Validation automatique de vos devis en 30 secondes</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #10b981; font-size: 16px;">✓</span>
                    <span style="color: #cbd5e1; font-size: 14px; margin-left: 12px;">Conformité CEE garantie par notre Système d'Audit</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #10b981; font-size: 16px;">✓</span>
                    <span style="color: #cbd5e1; font-size: 14px; margin-left: 12px;">Support prioritaire de notre équipe d'experts</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 40px 32px; text-align: center;">
              <a href="${appUrl}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
                🚀 Lancer mon premier Scan
              </a>
              <p style="margin: 16px 0 0 0; color: #64748b; font-size: 13px;">
                Accédez directement à votre espace client sécurisé
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; border-top: 1px solid #334155;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center; line-height: 1.6;">
                Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.<br>
                <span style="color: #475569;">Capital Énergie © 2026 - Tous droits réservés</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateActivationEmailText(data: ActivationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capital-energie.fr';
  
  return `
CAPITAL ÉNERGIE - Système d'Audit CEE

Bienvenue ${data.customerName || 'cher partenaire'} !

Vous avez fait le bon choix. Votre trésorerie est désormais sécurisée et vos heures de paperasse supprimées.

VOTRE ABONNEMENT
================
Forfait: ${data.forfaitName}
Volume: ${data.dossiersCount}
Montant: ${data.amount} € HT/mois

CE QUE VOTRE SCANNER FLASH VOUS APPORTE
=======================================
✓ Validation automatique de vos devis en 30 secondes
✓ Conformité CEE garantie par notre Système d'Audit
✓ Support prioritaire de notre équipe d'experts

→ Lancer mon premier Scan: ${appUrl}/dashboard

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
Capital Énergie © 2026 - Tous droits réservés
  `.trim();
}
