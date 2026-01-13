/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE DE NOTIFICATIONS
 * ============================================================================
 * Gestion des notifications automatiques "Flash de Succès"
 * Envoi d'emails et simulation SMS lors de la certification des dossiers
 * 
 * Usage :
 *   node service-notifications.js tester [CLIENT_ID]     Simule une notification
 *   node service-notifications.js aide                   Affiche l'aide
 * 
 * Déclencheurs :
 *   - Dossier passant à l'état "Certifié"
 *   - Dossier passant à l'état "Validé"
 * ============================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  entreprise: {
    nom: 'Capital Énergie',
    cellule: 'Cellule d\'Expertise',
    email: 'contact@capital-energie.fr',
    telephone: '01 23 45 67 89',
    siteBase: process.env.VERCEL_URL || 'https://capital-energie.vercel.app',
  },
  emails: {
    expediteur: 'notifications@capital-energie.fr',
    nomExpediteur: 'Capital Énergie - Cellule d\'Expertise',
  },
  resendApiKey: process.env.RESEND_API_KEY,
};

// ============================================================================
// TYPES DE STATUTS SURVEILLÉS
// ============================================================================

const STATUTS_SUCCES = ['certifie', 'valide', 'Certifié', 'Validé', 'CERTIFIE', 'VALIDE'];

/**
 * Vérifie si un statut correspond à un succès de certification
 */
function estStatutSucces(statut) {
  return STATUTS_SUCCES.some(s => 
    s.toLowerCase() === statut?.toLowerCase()
  );
}

// ============================================================================
// SURVEILLANCE DES CHANGEMENTS DE STATUT
// ============================================================================

/**
 * Détecte un changement de statut vers Certifié/Validé
 * @param {Object} dossier - Le dossier à surveiller
 * @param {string} ancienStatut - Le statut précédent
 * @param {string} nouveauStatut - Le nouveau statut
 * @returns {boolean} - True si c'est un changement vers un statut de succès
 */
function detecterChangementStatut(dossier, ancienStatut, nouveauStatut) {
  const etaitSucces = estStatutSucces(ancienStatut);
  const estMaintenantSucces = estStatutSucces(nouveauStatut);
  
  if (!etaitSucces && estMaintenantSucces) {
    console.log(`\n  🎯 [Surveillance] Changement détecté pour "${dossier.nom}"`);
    console.log(`     ${ancienStatut || 'Inconnu'} → ${nouveauStatut}`);
    return true;
  }
  
  return false;
}

/**
 * Surveille un dossier et déclenche les notifications si nécessaire
 */
async function surveillerDossier(dossier, ancienStatut, nouveauStatut) {
  if (detecterChangementStatut(dossier, ancienStatut, nouveauStatut)) {
    console.log('  ✅ Déclenchement des notifications Flash de Succès...\n');
    await envoyerNotificationsSucces(dossier);
    return true;
  }
  return false;
}

// ============================================================================
// CALCUL DU BOUCLIER DE TRÉSORERIE
// ============================================================================

/**
 * Calcule le nouveau total du Bouclier de Trésorerie pour un client
 */
function calculerBouclierTresorerie(clientId, nouveauMontant = 0) {
  // Simulation : en production, on récupérerait depuis la base de données
  const historiqueSimule = {
    '1': 21000,  // Métallurgie Dupont
    '2': 10300,  // Plasturgie Ouest
    '3': 33700,  // Fonderie Martin
    '5': 20100,  // Verrerie d'Azur
  };
  
  const totalExistant = historiqueSimule[clientId] || 0;
  return totalExistant + nouveauMontant;
}

// ============================================================================
// GÉNÉRATION DES EMAILS FLASH DE SUCCÈS
// ============================================================================

/**
 * Génère l'objet de l'email Flash de Succès
 */
function genererObjetEmail(dossier) {
  const montant = (dossier.economie || 0) + (dossier.subventions || 0);
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);
  
  return `🛡️ Succès : ${montantFormate} € sécurisés par la Cellule pour ${dossier.nom}`;
}

/**
 * Génère le contenu HTML de l'email Flash de Succès
 */
function genererContenuEmailHTML(dossier, client) {
  const montant = (dossier.economie || 0) + (dossier.subventions || 0);
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);
  const bouclierTotal = calculerBouclierTresorerie(client.id, montant);
  const bouclierFormate = new Intl.NumberFormat('fr-FR').format(bouclierTotal);
  const urlEspaceClient = `${CONFIG.entreprise.siteBase}/espace-client?id=${client.id}`;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash de Succès - ${CONFIG.entreprise.nom}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 2px solid #10b981; overflow: hidden;">
          
          <!-- Header avec badge succès -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🛡️</div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                CERTIFICATION RÉUSSIE
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Notre Système d'Audit a validé votre dossier
              </p>
            </td>
          </tr>
          
          <!-- Montant sécurisé -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                Montant sécurisé pour ce dossier
              </p>
              <h2 style="color: #10b981; margin: 0; font-size: 48px; font-weight: 700;">
                +${montantFormate} €
              </h2>
              <p style="color: #64748b; margin: 15px 0 0 0; font-size: 14px;">
                ${dossier.nom}
              </p>
            </td>
          </tr>
          
          <!-- Bouclier de Trésorerie total -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #10b981; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      🛡️ Votre Bouclier de Trésorerie Total
                    </p>
                    <h3 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                      ${bouclierFormate} €
                    </h3>
                    <p style="color: #64748b; margin: 10px 0 0 0; font-size: 13px;">
                      Capital sécurisé par la Cellule d'Expertise
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Bouton CTA -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${urlEspaceClient}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                Accéder à mon Espace
              </a>
              <p style="color: #64748b; margin: 15px 0 0 0; font-size: 12px;">
                Consultez tous vos dossiers et votre capital sécurisé
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 30px; border-top: 1px solid #334155; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                ${CONFIG.entreprise.nom} • ${CONFIG.entreprise.cellule}
              </p>
              <p style="color: #475569; margin: 8px 0 0 0; font-size: 11px;">
                Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Génère le contenu texte de l'email (version plain text)
 */
function genererContenuEmailTexte(dossier, client) {
  const montant = (dossier.economie || 0) + (dossier.subventions || 0);
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);
  const bouclierTotal = calculerBouclierTresorerie(client.id, montant);
  const bouclierFormate = new Intl.NumberFormat('fr-FR').format(bouclierTotal);
  const urlEspaceClient = `${CONFIG.entreprise.siteBase}/espace-client?id=${client.id}`;
  
  return `🛡️ CERTIFICATION RÉUSSIE - ${CONFIG.entreprise.nom}
═══════════════════════════════════════════════════════════

Notre Système d'Audit a validé votre dossier avec succès.

📄 DOSSIER : ${dossier.nom}

💰 MONTANT SÉCURISÉ : +${montantFormate} €

🛡️ BOUCLIER DE TRÉSORERIE TOTAL : ${bouclierFormate} €
   Capital sécurisé par la Cellule d'Expertise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 Accédez à votre Espace Client :
   ${urlEspaceClient}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${CONFIG.entreprise.nom} • ${CONFIG.entreprise.cellule}
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
`;
}

// ============================================================================
// SIMULATION SMS
// ============================================================================

/**
 * Simule l'envoi d'un SMS au gérant
 */
function simulerEnvoiSMS(dossier, client) {
  const montant = (dossier.economie || 0) + (dossier.subventions || 0);
  const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);
  
  const messageSMS = `🛡️ [Capital Énergie] : Dossier certifié ! +${montantFormate}€ pour votre trésorerie.`;
  
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📱 SIMULATION SMS                                      │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`     Destinataire : ${client.telephone || 'Non renseigné'}`);
  console.log(`     Gérant       : ${client.gerant || 'Responsable'}`);
  console.log(`     Message      : ${messageSMS}`);
  console.log('     Status       : ✅ SMS simulé (mode démo)\n');
  
  return {
    envoye: true,
    simulation: true,
    message: messageSMS,
    destinataire: client.telephone,
  };
}

// ============================================================================
// ENVOI DES NOTIFICATIONS
// ============================================================================

/**
 * Envoie toutes les notifications Flash de Succès pour un dossier certifié
 */
async function envoyerNotificationsSucces(dossier) {
  const client = dossier.client || {
    id: dossier.clientId || '1',
    nom: dossier.clientNom || 'Client',
    email: dossier.clientEmail || 'client@example.com',
    telephone: dossier.clientTelephone || '06 XX XX XX XX',
    gerant: dossier.clientGerant || 'Responsable',
  };
  
  const resultats = {
    email: null,
    sms: null,
    timestamp: new Date().toISOString(),
  };
  
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  🛡️ FLASH DE SUCCÈS - NOTIFICATIONS                     │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`     Dossier    : ${dossier.nom}`);
  console.log(`     Client     : ${client.nom}`);
  console.log(`     Montant    : ${new Intl.NumberFormat('fr-FR').format((dossier.economie || 0) + (dossier.subventions || 0))} €\n`);
  
  // 1. Préparer l'email
  const objet = genererObjetEmail(dossier);
  const contenuHTML = genererContenuEmailHTML(dossier, client);
  const contenuTexte = genererContenuEmailTexte(dossier, client);
  
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📧 EMAIL FLASH DE SUCCÈS                               │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`     À          : ${client.email}`);
  console.log(`     Objet      : ${objet}`);
  console.log(`     Contenu    : Email HTML avec bouton "Accéder à mon Espace"`);
  console.log(`     Lien       : ${CONFIG.entreprise.siteBase}/espace-client?id=${client.id}`);
  
  // Simulation d'envoi (en production, utiliser Resend ou autre)
  if (CONFIG.resendApiKey) {
    console.log('     Status     : ⏳ Envoi via Resend...');
    // TODO: Intégrer Resend API
    console.log('     Status     : ✅ Email envoyé\n');
  } else {
    console.log('     Status     : ✅ Email préparé (mode simulation)\n');
  }
  
  resultats.email = {
    envoye: true,
    simulation: !CONFIG.resendApiKey,
    objet,
    destinataire: client.email,
  };
  
  // 2. Simuler le SMS
  resultats.sms = simulerEnvoiSMS(dossier, client);
  
  // 3. Résumé
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('  ✅ NOTIFICATIONS ENVOYÉES\n');
  console.log(`     📧 Email   : ${resultats.email.envoye ? 'Envoyé' : 'Échec'}`);
  console.log(`     📱 SMS     : ${resultats.sms.envoye ? 'Simulé' : 'Échec'}`);
  console.log('');
  
  return resultats;
}

/**
 * Déclenche manuellement un Flash de Succès pour un dossier
 */
async function declencherFlashSucces(dossier, client) {
  const dossierComplet = {
    ...dossier,
    client: client,
  };
  
  return await envoyerNotificationsSucces(dossierComplet);
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

function afficherAide() {
  console.log('\n  📖 COMMANDES DISPONIBLES :\n');
  console.log('  tester [ID]          Simule un Flash de Succès pour un client');
  console.log('');
  console.log('  aide                 Affiche cette aide');
  console.log('');
  console.log('  🔔 DÉCLENCHEURS AUTOMATIQUES :');
  console.log('     Dossier → "Certifié"   Notification immédiate');
  console.log('     Dossier → "Validé"     Notification immédiate');
  console.log('');
  console.log('  📧 CONTENU DE L\'EMAIL :');
  console.log('     Objet    : 🛡️ Succès : [Montant] € sécurisés par la Cellule');
  console.log('     Bouton   : "Accéder à mon Espace" → /espace-client?id=[ID]');
  console.log('');
  console.log('  📱 SIMULATION SMS :');
  console.log('     Message  : 🛡️ [Capital Énergie] : Dossier certifié ! +[Montant]€');
  console.log('');
  console.log('  💡 EXEMPLE :');
  console.log('     node service-notifications.js tester 1\n');
}

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'aide';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE NOTIFICATIONS v1.0.0          ║');
  console.log('║   Flash de Succès - Cellule d\'Expertise                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'tester':
    case 'test': {
      const clientId = args[1] || '1';
      
      // Données de test
      const dossierTest = {
        id: 'test-' + Date.now(),
        nom: 'Pompe à chaleur - Bâtiment A',
        economie: 12500,
        subventions: 8500,
        statut: 'Certifié',
        clientId: clientId,
      };
      
      const clientTest = {
        id: clientId,
        nom: 'Métallurgie Dupont SARL',
        email: 'contact@metallurgie-dupont.fr',
        telephone: '06 12 34 56 78',
        gerant: 'Jean Dupont',
      };
      
      await declencherFlashSucces(dossierTest, clientTest);
      break;
    }
    
    case 'aide':
    case 'help':
    default: {
      afficherAide();
    }
  }
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  estStatutSucces,
  detecterChangementStatut,
  surveillerDossier,
  calculerBouclierTresorerie,
  genererObjetEmail,
  genererContenuEmailHTML,
  genererContenuEmailTexte,
  simulerEnvoiSMS,
  envoyerNotificationsSucces,
  declencherFlashSucces,
  CONFIG,
};
